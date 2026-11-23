import type { SupplierUpdate } from '@/types/logistics';

export const seedSupplierUpdates: SupplierUpdate[] = [
  {
    id: 'SU-5101',
    shipmentId: 'NSL-IB-24817',
    supplierId: 'sup-meridian',
    submittedAt: '2026-11-06T18:20:00Z',
    submittedBy: 'Elena Ruiz',
    status: 'in_transit',
    trackingNumber: 'HF-7720-4418',
    revisedEta: '2026-11-07T14:00:00Z',
    notes: 'Truck departed the Monterrey dock at 06:00 CST. ETA unchanged.',
  },
  {
    id: 'SU-5102',
    shipmentId: 'NSL-IB-24815',
    supplierId: 'sup-meridian',
    submittedAt: '2026-11-07T08:05:00Z',
    submittedBy: 'Elena Ruiz',
    status: 'scheduled',
    trackingNumber: 'HF-7741-0092',
    revisedEta: '2026-11-10T15:00:00Z',
    notes: 'Pickup window confirmed for November 8. Pallet count is 14.',
  },
  {
    id: 'SU-5103',
    shipmentId: 'NSL-IB-24845',
    supplierId: 'sup-meridian',
    submittedAt: '2026-11-05T13:40:00Z',
    submittedBy: 'Elena Ruiz',
    status: 'in_transit',
    trackingNumber: 'HF-7755-2081',
    revisedEta: '2026-11-08T13:00:00Z',
    notes: 'Loaded and sealed. Seal HF-44902 recorded on the bill of lading.',
  },
];
