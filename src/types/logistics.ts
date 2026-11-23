export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ShipmentStatus =
  | 'scheduled'
  | 'in_transit'
  | 'customs_hold'
  | 'arrived'
  | 'receiving'
  | 'delayed'
  | 'received';

export type TransportMode = 'ocean' | 'air' | 'road';

export type ExceptionStatus = 'open' | 'acknowledged' | 'investigating' | 'resolved';

export type ExceptionType =
  | 'late_arrival'
  | 'quantity_shortage'
  | 'damaged_goods'
  | 'documentation_missing'
  | 'customs_hold'
  | 'temperature_excursion'
  | 'carrier_no_response';

export type StockStatus = 'stockout' | 'critical' | 'low' | 'healthy';

export type SupplierStatus = 'active' | 'probation';

export type EventVisibility = 'internal' | 'shared';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  region: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  country: string;
  city: string;
  category: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  status: SupplierStatus;
  onTimeRate: number;
  qualityScore: number;
  paymentTerms: string;
  onboardedOn: string;
  internalNotes: string;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  timestamp: string;
  title: string;
  description: string;
  location: string;
  actor: string;
  visibility: EventVisibility;
}

export interface Shipment {
  id: string;
  supplierId: string;
  warehouseId: string;
  purchaseOrder: string;
  productSummary: string;
  lineCount: number;
  units: number;
  declaredValue: number;
  origin: string;
  carrier: string;
  mode: TransportMode;
  trackingNumber: string;
  status: ShipmentStatus;
  expectedArrival: string;
  revisedEta: string | null;
  risk: RiskLevel;
  riskScore: number;
  lastUpdated: string;
}

export interface ExceptionActivity {
  id: string;
  timestamp: string;
  actor: string;
  message: string;
}

export interface Exception {
  id: string;
  shipmentId: string;
  type: ExceptionType;
  severity: RiskLevel;
  status: ExceptionStatus;
  title: string;
  summary: string;
  detectedAt: string;
  owner: string;
  dataGaps: string[];
  supplierMessage: {
    channel: 'email' | 'phone' | 'portal';
    subject: string;
    body: string;
  };
  resolutionNotes: string | null;
  resolvedAt: string | null;
  activity: ExceptionActivity[];
}

export interface AiAssessment {
  id: string;
  shipmentId: string;
  exceptionId: string | null;
  riskLevel: RiskLevel;
  riskScore: number;
  summary: string;
  businessImpact: string;
  recommendedActions: string[];
  generatedAt: string;
  modelVersion: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  product: string;
  category: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  dailyUsage: number;
  inboundUnits: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  message: string;
  kind: 'shipment' | 'exception' | 'supplier' | 'assessment' | 'inventory';
  href: string;
}

export interface SupplierUpdate {
  id: string;
  shipmentId: string;
  supplierId: string;
  submittedAt: string;
  submittedBy: string;
  status: ShipmentStatus;
  trackingNumber: string;
  revisedEta: string;
  notes: string;
}
