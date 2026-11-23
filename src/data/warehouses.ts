import type { Warehouse } from '@/types/logistics';

export const warehouses: Warehouse[] = [
  { id: 'wh-dal', name: 'Dallas Distribution Center', code: 'DAL-01', city: 'Dallas, TX', region: 'Southwest' },
  { id: 'wh-nj', name: 'Newark Fulfillment Hub', code: 'EWR-02', city: 'Newark, NJ', region: 'Northeast' },
  { id: 'wh-ont', name: 'Ontario Cross-Dock', code: 'ONT-03', city: 'Ontario, CA', region: 'West' },
  { id: 'wh-chi', name: 'Chicago Gateway Warehouse', code: 'CHI-04', city: 'Chicago, IL', region: 'Midwest' },
];
