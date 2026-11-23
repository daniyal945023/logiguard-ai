import type {
  ExceptionStatus,
  ExceptionType,
  InventoryItem,
  RiskLevel,
  ShipmentStatus,
  StockStatus,
} from '@/types/logistics';

export type Tone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'orange' | 'danger';

export const shipmentStatusMeta: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  scheduled: { label: 'Scheduled', tone: 'neutral' },
  in_transit: { label: 'In transit', tone: 'info' },
  customs_hold: { label: 'Customs hold', tone: 'orange' },
  arrived: { label: 'Arrived', tone: 'accent' },
  receiving: { label: 'Receiving', tone: 'accent' },
  delayed: { label: 'Delayed', tone: 'danger' },
  received: { label: 'Received', tone: 'success' },
};

export const riskLevelMeta: Record<RiskLevel, { label: string; tone: Tone; color: string }> = {
  low: { label: 'Low', tone: 'success', color: 'bg-emerald-400' },
  medium: { label: 'Medium', tone: 'warning', color: 'bg-amber-400' },
  high: { label: 'High', tone: 'orange', color: 'bg-orange-400' },
  critical: { label: 'Critical', tone: 'danger', color: 'bg-rose-500' },
};

export const exceptionStatusMeta: Record<ExceptionStatus, { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'warning' },
  acknowledged: { label: 'Acknowledged', tone: 'info' },
  investigating: { label: 'Investigating', tone: 'accent' },
  resolved: { label: 'Resolved', tone: 'success' },
};

export const exceptionTypeMeta: Record<ExceptionType, string> = {
  late_arrival: 'Late arrival',
  quantity_shortage: 'Quantity shortage',
  damaged_goods: 'Damaged goods',
  documentation_missing: 'Missing documentation',
  customs_hold: 'Customs hold',
  temperature_excursion: 'Temperature excursion',
  carrier_no_response: 'Carrier no response',
};

export const stockStatusMeta: Record<StockStatus, { label: string; tone: Tone; bar: string }> = {
  stockout: { label: 'Stockout', tone: 'danger', bar: 'bg-rose-500' },
  critical: { label: 'Critical', tone: 'orange', bar: 'bg-orange-400' },
  low: { label: 'Low', tone: 'warning', bar: 'bg-amber-400' },
  healthy: { label: 'Healthy', tone: 'success', bar: 'bg-emerald-400' },
};

export const supplierStatusMeta: Record<'active' | 'probation', { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  probation: { label: 'Probation', tone: 'warning' },
};

export const transportModeLabel = {
  ocean: 'Ocean freight',
  air: 'Air freight',
  road: 'Road freight',
} as const;

export const riskOrder: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export const shipmentStatusOptions = Object.entries(shipmentStatusMeta).map(([value, meta]) => ({
  value: value as ShipmentStatus,
  label: meta.label,
}));

export function isActiveShipment(status: ShipmentStatus) {
  return status !== 'received';
}

export function isOpenException(status: ExceptionStatus) {
  return status !== 'resolved';
}

export function isAtRisk(risk: RiskLevel) {
  return risk === 'high' || risk === 'critical';
}

export function getInventoryCoverage(item: InventoryItem) {
  const available = item.onHand - item.reserved;
  return {
    available,
    coverageDays: item.dailyUsage > 0 ? available / item.dailyUsage : Number.POSITIVE_INFINITY,
  };
}

export function getStockStatus(item: InventoryItem): StockStatus {
  const { available, coverageDays } = getInventoryCoverage(item);
  if (available <= 0) return 'stockout';
  if (coverageDays < 3) return 'critical';
  if (available <= item.reorderPoint) return 'low';
  return 'healthy';
}
