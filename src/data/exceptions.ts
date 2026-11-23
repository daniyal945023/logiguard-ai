import type { Exception } from '@/types/logistics';

export const exceptions: Exception[] = [
  {
    id: 'EXC-3381',
    shipmentId: 'NSL-IB-24809',
    type: 'late_arrival',
    severity: 'high',
    status: 'open',
    title: 'Vessel re-routed, arrival slips three days',
    summary:
      'Pacific Ocean Lines skipped the Cai Mep call and transshipped via Singapore. The revised ETA of November 9 is three days later than the booking and falls inside the Ontario receiving freeze.',
    detectedAt: '2026-11-05T13:20:00Z',
    owner: 'Unassigned',
    dataGaps: [
      'No confirmed berth time from the carrier after the Singapore transshipment.',
      'Revised ETA has not been checked against Ontario dock appointments.',
    ],
    supplierMessage: {
      channel: 'email',
      subject: 'Confirm transshipment ETA for POL-2291-077',
      body:
        'Hello Minh, thank you for the update on vessel POL-VOY-2291. Please confirm the Singapore transshipment berth time and the final discharge date at Long Beach, so we can book Ontario dock appointments. We will hold the receiving slot until we hear from you.',
    },
    resolutionNotes: null,
    resolvedAt: null,
    activity: [
      { id: 'EXC-3381-A1', timestamp: '2026-11-05T13:20:00Z', actor: 'LogiGuard AI', message: 'Exception raised. Revised ETA is three days later than the booking.' },
    ],
  },
  {
    id: 'EXC-3384',
    shipmentId: 'NSL-IB-24822',
    type: 'customs_hold',
    severity: 'critical',
    status: 'acknowledged',
    title: 'Controlled thermal materials held at Newark',
    summary:
      'U.S. Customs has placed a hold on 3,600 thermal interface assemblies pending an end-use certificate. Air freight is already on the ground, and demurrage charges start after 48 hours.',
    detectedAt: '2026-11-07T06:30:00Z',
    owner: 'Priya Shah',
    dataGaps: [
      'End-use certificate has not been received from the supplier.',
      'Broker has not confirmed whether a bond waiver applies.',
    ],
    supplierMessage: {
      channel: 'phone',
      subject: 'Urgent: end-use certificate needed for RAC-55018832',
      body:
        'Customs is holding the air shipment for an end-use certificate. Please send the signed certificate today so the broker can file it. Demurrage begins in 48 hours.',
    },
    resolutionNotes: null,
    resolvedAt: null,
    activity: [
      { id: 'EXC-3384-A1', timestamp: '2026-11-07T06:30:00Z', actor: 'LogiGuard AI', message: 'Critical exception raised for customs hold.' },
      { id: 'EXC-3384-A2', timestamp: '2026-11-07T07:12:00Z', actor: 'Priya Shah', message: 'Acknowledged. Calling the broker before 9:00.' },
    ],
  },
  {
    id: 'EXC-3387',
    shipmentId: 'NSL-IB-24798',
    type: 'documentation_missing',
    severity: 'high',
    status: 'investigating',
    title: 'Hazmat paperwork missing at Houston',
    summary:
      'The commercial invoice and safety data sheets for the solvent drums never arrived. The vessel is at Houston and the entry cannot be filed until the paperwork is complete.',
    detectedAt: '2026-11-05T12:00:00Z',
    owner: 'Marcus Hale',
    dataGaps: [
      'Safety data sheet revision for the supplier product code is unknown.',
      'Storage approval for class 3 flammables at Dallas is pending.',
    ],
    supplierMessage: {
      channel: 'email',
      subject: 'Missing commercial invoice and SDS for NSB-5530-214',
      body:
        'The solvent drums are at Houston but the commercial invoice and current safety data sheets have not reached us. Please send both documents so we can file the entry.',
    },
    resolutionNotes: null,
    resolvedAt: null,
    activity: [
      { id: 'EXC-3387-A1', timestamp: '2026-11-05T12:00:00Z', actor: 'LogiGuard AI', message: 'Exception raised for missing documentation.' },
      { id: 'EXC-3387-A2', timestamp: '2026-11-05T15:40:00Z', actor: 'Marcus Hale', message: 'Investigating. Requested SDS from Rhine Chemical Solutions.' },
    ],
  },
  {
    id: 'EXC-3390',
    shipmentId: 'NSL-IB-24805',
    type: 'carrier_no_response',
    severity: 'critical',
    status: 'open',
    title: 'No carrier check-in for anchor bolt shipment',
    summary:
      'Keystone Truckload has not checked in the 120,000-unit anchor bolt load. The supplier reports a driver shortage, and the revised arrival date is November 12.',
    detectedAt: '2026-11-05T15:00:00Z',
    owner: 'Unassigned',
    dataGaps: [
      'No live tracking position since Harrisburg.',
      'Alternate carrier quote has not been requested.',
      'Atlas probation review does not yet cover this delay.',
    ],
    supplierMessage: {
      channel: 'phone',
      subject: 'Driver shortage on KT-9902-541: alternate carrier plan',
      body:
        'The anchor bolt load has missed its appointment. Please confirm the alternate carrier, the pickup time, and a live tracking link within the next two hours.',
    },
    resolutionNotes: null,
    resolvedAt: null,
    activity: [
      { id: 'EXC-3390-A1', timestamp: '2026-11-05T15:00:00Z', actor: 'LogiGuard AI', message: 'Critical exception raised. Scheduled arrival passed without check-in.' },
    ],
  },
  {
    id: 'EXC-3392',
    shipmentId: 'NSL-IB-24790',
    type: 'quantity_shortage',
    severity: 'medium',
    status: 'open',
    title: 'Fastener count 8,800 units short',
    summary:
      'Cycle count shows 471,200 units received against 480,000 on the packing list, a variance of 1.8 percent. The variance is inside the contract tolerance of 2 percent but affects the M8 reorder plan.',
    detectedAt: '2026-11-06T15:15:00Z',
    owner: 'Unassigned',
    dataGaps: [
      'Ninth SKU has not been counted yet.',
      'Supplier packing list has not been reconciled against the load seal.',
    ],
    supplierMessage: {
      channel: 'portal',
      subject: 'Quantity variance on PO-884102',
      body:
        'Our count shows 471,200 units against 480,000 on the packing list. Please confirm the packing list and advise whether a credit note or a make-up shipment is preferred.',
    },
    resolutionNotes: null,
    resolvedAt: null,
    activity: [
      { id: 'EXC-3392-A1', timestamp: '2026-11-06T15:15:00Z', actor: 'LogiGuard AI', message: 'Exception raised for quantity variance.' },
    ],
  },
  {
    id: 'EXC-3395',
    shipmentId: 'NSL-IB-24833',
    type: 'temperature_excursion',
    severity: 'high',
    status: 'open',
    title: 'Reefer temperature excursion above 4C',
    summary:
      'The reefer unit logged 6.1C for 14 minutes during a transfer. The supplier reset the unit and reports a door opening, but the load has not been quarantined or inspected.',
    detectedAt: '2026-11-06T22:10:00Z',
    owner: 'Unassigned',
    dataGaps: [
      'Continuous logger export for the full transit has not been received.',
      'Supplier quality sign-off on product integrity is missing.',
    ],
    supplierMessage: {
      channel: 'email',
      subject: 'Temperature event on IRL-44021: logger export required',
      body:
        'The reefer logged 6.1C at Zaragoza. Please send the full temperature log and your product integrity assessment before the load is released at Ontario.',
    },
    resolutionNotes: null,
    resolvedAt: null,
    activity: [
      { id: 'EXC-3395-A1', timestamp: '2026-11-06T22:10:00Z', actor: 'LogiGuard AI', message: 'Exception raised for temperature excursion.' },
    ],
  },
  {
    id: 'EXC-3398',
    shipmentId: 'NSL-IB-24799',
    type: 'damaged_goods',
    severity: 'medium',
    status: 'resolved',
    title: 'Two cartons damaged on arrival',
    summary:
      'Two cartons of sterile dressings arrived crushed at the Ontario cross-dock. The damage was limited to outer packaging and inner packs were intact.',
    detectedAt: '2026-11-02T10:00:00Z',
    owner: 'Priya Shah',
    dataGaps: [],
    supplierMessage: {
      channel: 'email',
      subject: 'Damage claim for KMX-0903112',
      body:
        'Two outer cartons arrived crushed. Please confirm replacement cartons on the next consignment.',
    },
    resolutionNotes:
      'Pacific MedSupply confirmed replacement cartons on the next consignment. Claim closed with no cost to Northstar.',
    resolvedAt: '2026-11-03T16:00:00Z',
    activity: [
      { id: 'EXC-3398-A1', timestamp: '2026-11-02T10:00:00Z', actor: 'LogiGuard AI', message: 'Exception raised for damaged goods.' },
      { id: 'EXC-3398-A2', timestamp: '2026-11-03T16:00:00Z', actor: 'Priya Shah', message: 'Resolved. Replacement cartons confirmed.' },
    ],
  },
];
