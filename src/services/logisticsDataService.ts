import { supabase } from '@/lib/supabase';
import type {
  AiAssessmentRow,
  ExceptionRow,
  InventoryLevelRow,
  ProductRow,
  ProfileRow,
  ShipmentEventRow,
  ShipmentItemRow,
  ShipmentRow,
  SupplierRow,
  WarehouseRow,
} from '@/types/database';
import type { ExceptionType, RiskLevel, ShipmentStatus } from '@/types/logistics';

type DataQueryResult = {
  data: unknown;
  error: { message: string } | null;
};

export class LogisticsDataAccessError extends Error {
  constructor(operation: string, message: string) {
    super(`${operation} failed: ${message}`);
    this.name = 'LogisticsDataAccessError';
  }
}

async function read<T>(operation: string, query: PromiseLike<DataQueryResult>): Promise<T> {
  let result: DataQueryResult;
  try {
    result = await query;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected data access error.';
    throw new LogisticsDataAccessError(operation, message);
  }

  if (result.error) {
    throw new LogisticsDataAccessError(operation, result.error.message);
  }
  if (result.data === null) {
    throw new LogisticsDataAccessError(operation, 'The query returned no data.');
  }

  return result.data as T;
}

async function getCurrentProfile(operation: string): Promise<ProfileRow> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw new LogisticsDataAccessError(operation, userError.message);
  if (!userResult.user) throw new LogisticsDataAccessError(operation, 'An authenticated user is required.');

  const profile = await read<ProfileRow | null>(
    `${operation} profile lookup`,
    supabase
      .from('profiles')
      .select('id, full_name, role, supplier_id, created_at, updated_at')
      .eq('id', userResult.user.id)
      .maybeSingle(),
  );
  if (!profile) throw new LogisticsDataAccessError(operation, 'No profile is linked to this account.');
  return profile;
}

async function requireManager(operation: string): Promise<void> {
  const profile = await getCurrentProfile(operation);
  if (profile.role !== 'logistics_manager' && profile.role !== 'admin') {
    throw new LogisticsDataAccessError(operation, 'A manager or admin profile is required.');
  }
}

async function requireSupplier(operation: string): Promise<{ profile: ProfileRow; supplierId: string }> {
  const profile = await getCurrentProfile(operation);
  if (profile.role !== 'supplier' || !profile.supplier_id?.trim()) {
    throw new LogisticsDataAccessError(operation, 'A valid supplier profile is required.');
  }
  return { profile, supplierId: profile.supplier_id };
}

async function requireSupplierShipment(shipmentId: string, operation: string): Promise<string> {
  const { supplierId } = await requireSupplier(operation);
  const shipment = await read<{ id: string } | null>(
    `${operation} ownership check`,
    supabase
      .from('shipments')
      .select('id')
      .eq('id', shipmentId)
      .eq('supplier_id', supplierId)
      .maybeSingle(),
  );
  if (!shipment) {
    throw new LogisticsDataAccessError(operation, 'Shipment not found for this supplier account.');
  }
  return supplierId;
}

const SUPPLIER_SHIPMENT_STATUSES: readonly ShipmentStatus[] = [
  'scheduled',
  'in_transit',
  'customs_hold',
  'arrived',
  'receiving',
  'delayed',
  'received',
];

const EXCEPTION_TYPES: readonly ExceptionType[] = [
  'late_arrival',
  'quantity_shortage',
  'damaged_goods',
  'documentation_missing',
  'customs_hold',
  'temperature_excursion',
  'carrier_no_response',
];

const RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'critical'];

export async function getManagerSuppliers(): Promise<SupplierRow[]> {
  await requireManager('Load suppliers');
  return read(
    'Load suppliers',
    supabase
      .from('suppliers')
      .select('id, company_name, contact_name, email, phone, address, created_at, updated_at')
      .order('company_name'),
  );
}

export async function getManagerWarehouses(): Promise<WarehouseRow[]> {
  await requireManager('Load warehouses');
  return read(
    'Load warehouses',
    supabase.from('warehouses').select('id, name, location, address, created_at').order('name'),
  );
}

export async function getManagerShipments(): Promise<ShipmentRow[]> {
  await requireManager('Load shipments');
  return read(
    'Load shipments',
    supabase
      .from('shipments')
      .select('id, shipment_number, tracking_number, supplier_id, warehouse_id, status, expected_arrival_at, actual_arrival_at, carrier_name, transport_mode, notes, created_by, created_at, updated_at')
      .order('created_at', { ascending: false }),
  );
}

export async function getManagerShipmentItems(shipmentId: string): Promise<ShipmentItemRow[]> {
  await requireManager('Load shipment items');
  return read(
    'Load shipment items',
    supabase
      .from('shipment_items')
      .select('id, shipment_id, product_id, quantity_expected, quantity_received, unit_cost, created_at')
      .eq('shipment_id', shipmentId)
      .order('created_at'),
  );
}

export async function getManagerShipmentEvents(shipmentId?: string): Promise<ShipmentEventRow[]> {
  await requireManager('Load shipment events');
  const query = supabase
    .from('shipment_events')
    .select('id, shipment_id, status, description, location, source, event_time, created_at')
    .order('event_time', { ascending: false });
  return read(
    'Load shipment events',
    shipmentId ? query.eq('shipment_id', shipmentId) : query,
  );
}

export async function getManagerExceptions(): Promise<ExceptionRow[]> {
  await requireManager('Load exceptions');
  return read(
    'Load exceptions',
    supabase
      .from('exceptions')
      .select('id, shipment_id, exception_type, severity, status, title, description, estimated_exposure, detected_at, resolved_at, assigned_to, created_at, updated_at')
      .order('detected_at', { ascending: false }),
  );
}

export async function createManagerException(input: {
  shipmentId: string;
  exceptionType: ExceptionType;
  severity: RiskLevel;
  title: string;
  description?: string;
  estimatedExposure?: number;
}): Promise<ExceptionRow> {
  const operation = 'Create exception';
  await requireManager(operation);

  if (!input.shipmentId.trim()) throw new LogisticsDataAccessError(operation, 'Select a shipment.');
  if (!EXCEPTION_TYPES.includes(input.exceptionType)) {
    throw new LogisticsDataAccessError(operation, 'Select a supported exception type.');
  }
  if (!RISK_LEVELS.includes(input.severity)) {
    throw new LogisticsDataAccessError(operation, 'Select a supported severity.');
  }
  if (!input.title.trim()) throw new LogisticsDataAccessError(operation, 'Enter an exception title.');
  if (input.estimatedExposure !== undefined &&
      (!Number.isFinite(input.estimatedExposure) || input.estimatedExposure < 0)) {
    throw new LogisticsDataAccessError(operation, 'Estimated exposure must be a non-negative number.');
  }

  return read(
    operation,
    supabase
      .from('exceptions')
      .insert({
        shipment_id: input.shipmentId,
        exception_type: input.exceptionType,
        severity: input.severity,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        estimated_exposure: input.estimatedExposure ?? null,
      })
      .select('id, shipment_id, exception_type, severity, status, title, description, estimated_exposure, detected_at, resolved_at, assigned_to, created_at, updated_at')
      .single(),
  );
}

export async function acknowledgeManagerException(exceptionId: string): Promise<ExceptionRow> {
  await requireManager('Acknowledge exception');
  const updated = await read<ExceptionRow | null>(
    'Acknowledge exception',
    supabase
      .from('exceptions')
      .update({ status: 'acknowledged', updated_at: new Date().toISOString() })
      .eq('id', exceptionId)
      .eq('status', 'open')
      .select('id, shipment_id, exception_type, severity, status, title, description, estimated_exposure, detected_at, resolved_at, assigned_to, created_at, updated_at')
      .maybeSingle(),
  );
  if (!updated) {
    throw new LogisticsDataAccessError(
      'Acknowledge exception',
      'No open exception was updated. It may have changed already, may not exist, or access may be denied by RLS.',
    );
  }
  return updated;
}

export async function resolveManagerException(exceptionId: string): Promise<ExceptionRow> {
  await requireManager('Resolve exception');
  const timestamp = new Date().toISOString();
  const updated = await read<ExceptionRow | null>(
    'Resolve exception',
    supabase
      .from('exceptions')
      .update({ status: 'resolved', resolved_at: timestamp, updated_at: timestamp })
      .eq('id', exceptionId)
      .neq('status', 'resolved')
      .select('id, shipment_id, exception_type, severity, status, title, description, estimated_exposure, detected_at, resolved_at, assigned_to, created_at, updated_at')
      .maybeSingle(),
  );
  if (!updated) {
    throw new LogisticsDataAccessError(
      'Resolve exception',
      'No unresolved exception was updated. It may already be resolved, may not exist, or access may be denied by RLS.',
    );
  }
  return updated;
}

export async function getManagerAiAssessments(): Promise<AiAssessmentRow[]> {
  await requireManager('Load AI assessments');
  return read(
    'Load AI assessments',
    supabase
      .from('ai_assessments')
      .select('id, exception_id, risk_level, risk_score, summary, recommended_action, model_name, raw_response, created_at')
      .order('created_at', { ascending: false }),
  );
}

export async function getManagerInventoryLevels(): Promise<InventoryLevelRow[]> {
  await requireManager('Load inventory levels');
  return read(
    'Load inventory levels',
    supabase
      .from('inventory_levels')
      .select('id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, reorder_point, avg_daily_demand, lead_time_days, updated_at')
      .order('updated_at', { ascending: false }),
  );
}

export async function getManagerProducts(): Promise<ProductRow[]> {
  await requireManager('Load products');
  return read(
    'Load products',
    supabase
      .from('products')
      .select('id, sku, name, description, category, unit_of_measure, created_at')
      .order('name'),
  );
}

export async function getSupplierShipments(): Promise<ShipmentRow[]> {
  const { supplierId } = await requireSupplier('Load supplier shipments');
  return read(
    'Load supplier shipments',
    supabase
      .from('shipments')
      .select('id, shipment_number, tracking_number, supplier_id, warehouse_id, status, expected_arrival_at, actual_arrival_at, carrier_name, transport_mode, created_at, updated_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false }),
  );
}

export async function getSupplierRecord(): Promise<SupplierRow> {
  const { supplierId } = await requireSupplier('Load supplier record');
  const supplier = await read<SupplierRow | null>(
    'Load supplier record',
    supabase
      .from('suppliers')
      .select('id, company_name, contact_name, email, phone, address, created_at, updated_at')
      .eq('id', supplierId)
      .maybeSingle(),
  );
  if (!supplier) {
    throw new LogisticsDataAccessError('Load supplier record', 'No supplier record is linked to this account.');
  }
  return supplier;
}

export async function getSupplierShipmentItems(shipmentId: string): Promise<ShipmentItemRow[]> {
  await requireSupplierShipment(shipmentId, 'Load supplier shipment items');
  return read(
    'Load supplier shipment items',
    supabase
      .from('shipment_items')
      .select('id, shipment_id, product_id, quantity_expected, quantity_received, created_at')
      .eq('shipment_id', shipmentId)
      .order('created_at'),
  );
}

export async function getSupplierShipmentEvents(shipmentId: string): Promise<ShipmentEventRow[]> {
  const operation = 'Load supplier shipment events';
  await requireSupplierShipment(shipmentId, operation);
  return read(
    operation,
    supabase
      .from('shipment_events')
      .select('id, shipment_id, status, description, location, source, event_time, created_at')
      .eq('shipment_id', shipmentId)
      .eq('source', 'portal')
      .order('event_time', { ascending: true }),
  );
}

export async function insertSupplierShipmentEvent(input: {
  shipmentId: string;
  status: ShipmentStatus;
  trackingNumber: string;
  revisedEta: string;
  notes: string;
}): Promise<ShipmentEventRow> {
  const operation = 'Submit supplier shipment update';
  if (!input.shipmentId.trim()) throw new LogisticsDataAccessError(operation, 'A shipment is required.');
  if (!SUPPLIER_SHIPMENT_STATUSES.includes(input.status)) {
    throw new LogisticsDataAccessError(operation, 'Select a supported shipment status.');
  }
  if (!input.trackingNumber.trim()) throw new LogisticsDataAccessError(operation, 'A tracking number is required.');
  if (!input.revisedEta.trim() || !Number.isFinite(Date.parse(input.revisedEta))) {
    throw new LogisticsDataAccessError(operation, 'Enter a valid revised ETA.');
  }
  if (input.notes.trim().length < 5) {
    throw new LogisticsDataAccessError(operation, 'Update notes must contain at least 5 characters.');
  }

  await requireSupplierShipment(input.shipmentId, operation);
  const description = [
    `Tracking number: ${input.trackingNumber.trim()}`,
    `Revised ETA: ${new Date(input.revisedEta).toISOString()}`,
    `Notes: ${input.notes.trim()}`,
  ].join('\n');

  return read(
    operation,
    supabase
      .from('shipment_events')
      .insert({
        shipment_id: input.shipmentId,
        status: input.status,
        description,
        source: 'portal',
      })
      .select('id, shipment_id, status, description, location, source, event_time, created_at')
      .single(),
  );
}

export async function getSupplierProducts(shipmentId: string): Promise<ProductRow[]> {
  await requireSupplierShipment(shipmentId, 'Load supplier shipment products');
  const items = await getSupplierShipmentItems(shipmentId);
  const productIds = [...new Set(items.map((item) => item.product_id))];
  if (productIds.length === 0) return [];

  return read(
    'Load supplier shipment products',
    supabase
      .from('products')
      .select('id, sku, name, description, category, unit_of_measure, created_at')
      .in('id', productIds)
      .order('name'),
  );
}

export async function getSupplierWarehouses(): Promise<WarehouseRow[]> {
  const shipments = await getSupplierShipments();
  const warehouseIds = [...new Set(shipments.map((shipment) => shipment.warehouse_id))];
  if (warehouseIds.length === 0) return [];

  return read(
    'Load supplier warehouses',
    supabase
      .from('warehouses')
      .select('id, name, location, address, created_at')
      .in('id', warehouseIds)
      .order('name'),
  );
}
