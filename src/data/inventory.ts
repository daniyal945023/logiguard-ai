import type { ActivityEntry, InventoryItem } from '@/types/logistics';

export const inventoryItems: InventoryItem[] = [
  { id: 'inv-1', sku: 'NSL-SEN-1100', product: 'Industrial sensor module, Gen 2', category: 'Electronics', warehouseId: 'wh-dal', onHand: 4120, reserved: 3600, reorderPoint: 2500, dailyUsage: 410, inboundUnits: 14200 },
  { id: 'inv-2', sku: 'NSL-CTL-2040', product: 'Controller board, rev B', category: 'Electronics', warehouseId: 'wh-dal', onHand: 1880, reserved: 1100, reorderPoint: 900, dailyUsage: 150, inboundUnits: 0 },
  { id: 'inv-3', sku: 'NSL-PSU-2400', product: '24V power supply unit', category: 'Electronics', warehouseId: 'wh-chi', onHand: 6400, reserved: 2100, reorderPoint: 1800, dailyUsage: 220, inboundUnits: 9600 },
  { id: 'inv-4', sku: 'NSL-BMS-3310', product: 'BMS-3310 battery management IC', category: 'Electronics', warehouseId: 'wh-dal', onHand: 240, reserved: 240, reorderPoint: 1200, dailyUsage: 95, inboundUnits: 18500 },
  { id: 'inv-5', sku: 'NSL-HEX-M8', product: 'M8 stainless hex fastener, 100-ct', category: 'Hardware', warehouseId: 'wh-chi', onHand: 9100, reserved: 4300, reorderPoint: 5000, dailyUsage: 620, inboundUnits: 0 },
  { id: 'inv-6', sku: 'NSL-ANC-120', product: 'Anchor bracket kit', category: 'Hardware', warehouseId: 'wh-dal', onHand: 3900, reserved: 900, reorderPoint: 2000, dailyUsage: 180, inboundUnits: 120000 },
  { id: 'inv-7', sku: 'NSL-CTN-SM', product: 'Retail corrugated carton, small', category: 'Packaging', warehouseId: 'wh-ont', onHand: 46000, reserved: 12000, reorderPoint: 20000, dailyUsage: 1900, inboundUnits: 52000 },
  { id: 'inv-8', sku: 'NSL-WRP-500', product: 'Pallet stretch wrap roll', category: 'Packaging', warehouseId: 'wh-dal', onHand: 1120, reserved: 400, reorderPoint: 1000, dailyUsage: 90, inboundUnits: 30000 },
  { id: 'inv-9', sku: 'NSL-HSK-210', product: 'Heat sink extrusion, 210mm', category: 'Thermal', warehouseId: 'wh-nj', onHand: 1400, reserved: 300, reorderPoint: 800, dailyUsage: 70, inboundUnits: 8000 },
  { id: 'inv-10', sku: 'NSL-TIM-ASM', product: 'Thermal interface assembly', category: 'Thermal', warehouseId: 'wh-nj', onHand: 920, reserved: 560, reorderPoint: 600, dailyUsage: 75, inboundUnits: 3600 },
  { id: 'inv-11', sku: 'NSL-GLV-M', product: 'Nitrile exam gloves, medium case', category: 'Medical', warehouseId: 'wh-nj', onHand: 5200, reserved: 1900, reorderPoint: 3000, dailyUsage: 260, inboundUnits: 22000 },
  { id: 'inv-12', sku: 'NSL-DRS-4X4', product: 'Sterile wound dressing, 4x4', category: 'Medical', warehouseId: 'wh-ont', onHand: 2300, reserved: 500, reorderPoint: 1500, dailyUsage: 140, inboundUnits: 0 },
  { id: 'inv-13', sku: 'NSL-SLV-55', product: 'Industrial solvent drum, 55 gal', category: 'Chemicals', warehouseId: 'wh-dal', onHand: 110, reserved: 40, reorderPoint: 80, dailyUsage: 9, inboundUnits: 360 },
];

export const activityFeed: ActivityEntry[] = [
  { id: 'act-1', timestamp: '2026-11-07T07:58:00Z', actor: 'LogiGuard AI', message: 'Weather advisory added to NSL-IB-24817. Risk remains medium.', kind: 'assessment', href: '#/manager/assessments' },
  { id: 'act-2', timestamp: '2026-11-07T07:12:00Z', actor: 'Priya Shah', message: 'Acknowledged critical exception EXC-3384 for Newark customs hold.', kind: 'exception', href: '#/manager/exceptions/EXC-3384' },
  { id: 'act-3', timestamp: '2026-11-07T06:30:00Z', actor: 'U.S. Customs', message: 'Customs hold placed on NSL-IB-24822.', kind: 'shipment', href: '#/manager/shipments/NSL-IB-24822' },
  { id: 'act-4', timestamp: '2026-11-07T05:50:00Z', actor: 'Valle Verde Fresh Foods', message: 'Supplier submitted an update for NSL-IB-24833 with a revised reefer log.', kind: 'supplier', href: '#/manager/shipments/NSL-IB-24833' },
  { id: 'act-5', timestamp: '2026-11-06T15:15:00Z', actor: 'Northstar receiving team', message: 'Quantity variance recorded on NSL-IB-24790.', kind: 'exception', href: '#/manager/exceptions/EXC-3392' },
  { id: 'act-6', timestamp: '2026-11-06T11:40:00Z', actor: 'Northstar receiving team', message: 'Cycle count started at Chicago Gateway Warehouse.', kind: 'shipment', href: '#/manager/shipments/NSL-IB-24790' },
  { id: 'act-7', timestamp: '2026-11-05T15:40:00Z', actor: 'Marcus Hale', message: 'Started investigating EXC-3387 for missing hazmat documents.', kind: 'exception', href: '#/manager/exceptions/EXC-3387' },
  { id: 'act-8', timestamp: '2026-11-05T15:00:00Z', actor: 'LogiGuard AI', message: 'Critical exception EXC-3390 raised for an unconfirmed carrier check-in.', kind: 'exception', href: '#/manager/exceptions/EXC-3390' },
  { id: 'act-9', timestamp: '2026-11-05T09:10:00Z', actor: 'Saigon Pacific Packaging', message: 'Vessel re-routing confirmed for NSL-IB-24809.', kind: 'supplier', href: '#/manager/shipments/NSL-IB-24809' },
  { id: 'act-10', timestamp: '2026-11-03T16:00:00Z', actor: 'Priya Shah', message: 'Resolved EXC-3398. Replacement cartons confirmed by Pacific MedSupply.', kind: 'exception', href: '#/manager/exceptions/EXC-3398' },
];
