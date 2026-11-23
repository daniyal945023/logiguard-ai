import type { AiAssessment } from '@/types/logistics';

export const aiAssessments: AiAssessment[] = [
  {
    id: 'AI-7701',
    shipmentId: 'NSL-IB-24809',
    exceptionId: 'EXC-3381',
    riskLevel: 'high',
    riskScore: 81,
    summary:
      'The vessel transshipment through Singapore adds roughly three days and removes the Ontario receiving slot booked for November 7. Carrier schedule reliability on this lane has dropped to 61 percent.',
    businessImpact:
      'Carton stock for two retail replenishment waves may run short by November 10. Expedited ground freight from Long Beach would cost an estimated $11,400.',
    recommendedActions: [
      'Request berth and discharge confirmation from Pacific Ocean Lines within 24 hours.',
      'Re-book the Ontario dock appointment for November 9 or 10.',
      'Pre-approve a partial expedite for the first 12,000 cartons.',
    ],
    generatedAt: '2026-11-05T13:22:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7702',
    shipmentId: 'NSL-IB-24822',
    exceptionId: 'EXC-3384',
    riskLevel: 'critical',
    riskScore: 92,
    summary:
      'Customs is holding a controlled-materials shipment with no end-use certificate on file. Hold duration in comparable cases averaged 4.2 days, and the air freight is already on the ground.',
    businessImpact:
      'Thermal assemblies feed the Q4 sensor kit build. A hold beyond November 10 puts about 1,900 finished units at risk of missed customer commitments.',
    recommendedActions: [
      'Obtain a signed end-use certificate from Solaris Thermal Systems today.',
      'Ask the broker to file a voluntary disclosure to shorten the hold.',
      'Set up demurrage cap approval before the 48-hour threshold.',
    ],
    generatedAt: '2026-11-07T06:35:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7703',
    shipmentId: 'NSL-IB-24798',
    exceptionId: 'EXC-3387',
    riskLevel: 'high',
    riskScore: 77,
    summary:
      'Hazmat entry is blocked by missing invoice and safety data sheets. Rhine Chemical Solutions has missed documentation on three of its last five shipments.',
    businessImpact:
      'Drums cannot be moved to the Dallas flammables store until the entry clears. Solvent stock is already below reorder point, and a delay adds about $2,100 in storage fees.',
    recommendedActions: [
      'Ask Rhine Chemical Solutions for the current SDS revision and commercial invoice.',
      'Confirm flammables storage approval with the Dallas EHS team.',
      'Check whether a temporary bonded move to a licensed bonded warehouse is available.',
    ],
    generatedAt: '2026-11-05T12:05:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7704',
    shipmentId: 'NSL-IB-24805',
    exceptionId: 'EXC-3390',
    riskLevel: 'critical',
    riskScore: 88,
    summary:
      'The load has missed its appointment with no carrier check-in. Atlas Steel & Fasteners is on probation, and this is its third missed delivery this quarter.',
    businessImpact:
      'Anchor bracket kits are needed for the Dallas installation program. A slip to November 12 pushes three customer installs past their committed dates.',
    recommendedActions: [
      'Require an alternate carrier name and live tracking link within two hours.',
      'Start a backup order with a secondary supplier for 40 percent of the quantity.',
      'Log the delay in the probation review file for December.',
    ],
    generatedAt: '2026-11-05T15:04:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7705',
    shipmentId: 'NSL-IB-24790',
    exceptionId: 'EXC-3392',
    riskLevel: 'medium',
    riskScore: 54,
    summary:
      'The 8,800-unit variance sits within the 2 percent contract tolerance. The ninth SKU count will determine whether the variance is a packing error or a true shortage.',
    businessImpact:
      'The M8 reorder plan assumes full quantity. The shortfall covers about 9 days of usage and is recoverable with a make-up shipment.',
    recommendedActions: [
      'Finish the ninth SKU count before accepting the receipt.',
      'Request a packing list reconciliation from Atlas Steel & Fasteners.',
    ],
    generatedAt: '2026-11-06T15:20:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7706',
    shipmentId: 'NSL-IB-24833',
    exceptionId: 'EXC-3395',
    riskLevel: 'high',
    riskScore: 74,
    summary:
      'A 14-minute excursion to 6.1C is within the tolerance for short exposures, but the supplier has not provided continuous logger data to confirm product integrity.',
    businessImpact:
      'If the logger data is incomplete, the full load of 9,800 units may need quarantine. Replacement cost is about $84,300.',
    recommendedActions: [
      'Request the full logger export before the load is released at Ontario.',
      'Hold the load in a quality quarantine bay until the export is reviewed.',
      'Ask Valle Verde Fresh Foods for a product integrity statement.',
    ],
    generatedAt: '2026-11-06T22:14:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7707',
    shipmentId: 'NSL-IB-24817',
    exceptionId: null,
    riskLevel: 'medium',
    riskScore: 58,
    summary:
      'Freezing rain on the I-35 corridor could add two hours to the Dallas arrival. The shipment is currently on schedule and no exception has been raised.',
    businessImpact:
      'A two-hour slip is unlikely to affect receiving, but it would push the truck past the afternoon cut-off for same-day putaway.',
    recommendedActions: [
      'Monitor the truck position at the Waco checkpoint.',
      'Ask Hallmark Freight to confirm the route change if the advisory expands.',
    ],
    generatedAt: '2026-11-07T07:58:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
  {
    id: 'AI-7708',
    shipmentId: 'NSL-IB-24799',
    exceptionId: 'EXC-3398',
    riskLevel: 'medium',
    riskScore: 34,
    summary:
      'Outer carton damage was limited to two cases. Inner packs were intact, and the supplier has confirmed a replacement.',
    businessImpact:
      'No clinical stock was affected. The claim closed without cost to Northstar.',
    recommendedActions: [
      'Track replacement cartons on the next Pacific MedSupply consignment.',
    ],
    generatedAt: '2026-11-02T10:05:00Z',
    modelVersion: 'LogiGuard Risk Engine v2.4',
  },
];
