import { useSyncExternalStore } from 'react';

import { aiAssessments } from '@/data/assessments';
import { exceptions } from '@/data/exceptions';
import { activityFeed, inventoryItems } from '@/data/inventory';
import { seedSupplierUpdates } from '@/data/supplierUpdates';
import { shipmentEvents, shipments } from '@/data/shipments';
import { suppliers } from '@/data/suppliers';
import { warehouses } from '@/data/warehouses';
import type {
  ActivityEntry,
  AiAssessment,
  Exception,
  ExceptionStatus,
  InventoryItem,
  Shipment,
  ShipmentEvent,
  ShipmentStatus,
  Supplier,
  SupplierUpdate,
  Warehouse,
} from '@/types/logistics';

export interface LogisticsState {
  shipments: Shipment[];
  shipmentEvents: ShipmentEvent[];
  exceptions: Exception[];
  aiAssessments: AiAssessment[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  inventoryItems: InventoryItem[];
  activityFeed: ActivityEntry[];
  supplierUpdates: SupplierUpdate[];
}

export interface SupplierUpdateInput {
  shipmentId: string;
  supplierId: string;
  submittedBy: string;
  status: ShipmentStatus;
  trackingNumber: string;
  revisedEta: string;
  notes: string;
}

// In-memory stand-in for the backend. Replace these functions with Supabase calls when the database is connected.
let state: LogisticsState = {
  shipments,
  shipmentEvents,
  exceptions,
  aiAssessments,
  suppliers,
  warehouses,
  inventoryItems,
  activityFeed,
  supplierUpdates: seedSupplierUpdates,
};

const listeners = new Set<() => void>();

function commit(patch: Partial<LogisticsState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLogistics(): LogisticsState {
  return useSyncExternalStore(subscribe, () => state);
}

export function setExceptionStatus(exceptionId: string, status: Exclude<ExceptionStatus, 'resolved'>, actor: string) {
  const timestamp = new Date().toISOString();
  const message = `Marked as ${status}.`;
  commit({
    exceptions: state.exceptions.map((item) =>
      item.id === exceptionId
        ? {
            ...item,
            status,
            owner: item.owner === 'Unassigned' ? actor : item.owner,
            activity: [...item.activity, { id: `${exceptionId}-A${Date.now()}`, timestamp, actor, message }],
          }
        : item,
    ),
    activityFeed: [
      { id: `act-${Date.now()}`, timestamp, actor, message: `${message.replace('.', '')} on ${exceptionId}.`, kind: 'exception', href: `#/manager/exceptions/${exceptionId}` },
      ...state.activityFeed,
    ],
  });
}

export function resolveException(exceptionId: string, notes: string, actor: string) {
  const timestamp = new Date().toISOString();
  commit({
    exceptions: state.exceptions.map((item) =>
      item.id === exceptionId
        ? {
            ...item,
            status: 'resolved',
            resolutionNotes: notes,
            resolvedAt: timestamp,
            activity: [...item.activity, { id: `${exceptionId}-A${Date.now()}`, timestamp, actor, message: 'Resolved with notes.' }],
          }
        : item,
    ),
    activityFeed: [
      { id: `act-${Date.now()}`, timestamp, actor, message: `Resolved ${exceptionId}.`, kind: 'exception', href: `#/manager/exceptions/${exceptionId}` },
      ...state.activityFeed,
    ],
  });
}

export function submitSupplierUpdate(input: SupplierUpdateInput) {
  const timestamp = new Date().toISOString();
  const shipment = state.shipments.find((item) => item.id === input.shipmentId);
  if (!shipment) throw new Error('Shipment not found.');
  if (shipment.supplierId !== input.supplierId) throw new Error('This shipment is not assigned to the supplier account.');
  if (!state.suppliers.some((item) => item.id === input.supplierId)) throw new Error('Supplier account not found.');
  if (!input.trackingNumber.trim() || !input.revisedEta || !input.notes.trim()) {
    throw new Error('Tracking number, revised ETA, and update notes are required.');
  }

  const update: SupplierUpdate = {
    id: `SU-${Date.now()}`,
    shipmentId: input.shipmentId,
    supplierId: input.supplierId,
    submittedAt: timestamp,
    submittedBy: input.submittedBy,
    status: input.status,
    trackingNumber: input.trackingNumber,
    revisedEta: input.revisedEta,
    notes: input.notes,
  };

  const supplierName = state.suppliers.find((item) => item.id === input.supplierId)?.name ?? 'Supplier';
  const newEvent: ShipmentEvent = {
    id: `${input.shipmentId}-S${Date.now()}`,
    shipmentId: input.shipmentId,
    timestamp,
    title: 'Shipment update submitted',
    description: input.notes,
    location: shipment.origin,
    actor: supplierName,
    visibility: 'shared',
  };

  commit({
    supplierUpdates: [update, ...state.supplierUpdates],
    shipments: state.shipments.map((item) =>
      item.id === input.shipmentId
        ? {
            ...item,
            status: input.status,
            trackingNumber: input.trackingNumber,
            revisedEta: input.revisedEta,
            lastUpdated: timestamp,
          }
        : item,
    ),
    shipmentEvents: [newEvent, ...state.shipmentEvents],
    activityFeed: [
      { id: `act-${Date.now()}`, timestamp, actor: supplierName, message: `Submitted an update for ${input.shipmentId}.`, kind: 'supplier', href: `#/manager/shipments/${input.shipmentId}` },
      ...state.activityFeed,
    ],
  });
}
