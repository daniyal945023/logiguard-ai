import { useEffect, useMemo, useState } from 'react';
import { AlertOctagon, CircleAlert, Gauge, LoaderCircle, Ship, TriangleAlert } from 'lucide-react';

import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline } from '@/components/common/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatNumber, formatShortDateTime } from '@/lib/format';
import { navigate } from '@/lib/router';
import {
  getManagerAiAssessments,
  getManagerExceptions,
  getManagerInventoryLevels,
  getManagerShipmentEvents,
  getManagerShipments,
  getManagerSuppliers,
} from '@/services/logisticsDataService';
import { useSession } from '@/services/session';
import type {
  AiAssessmentRow,
  ExceptionRow,
  InventoryLevelRow,
  ShipmentEventRow,
  ShipmentRow,
  SupplierRow,
} from '@/types/database';

interface OverviewData {
  shipments: ShipmentRow[];
  exceptions: ExceptionRow[];
  assessments: AiAssessmentRow[];
  suppliers: SupplierRow[];
  inventoryLevels: InventoryLevelRow[];
  shipmentEvents: ShipmentEventRow[];
}

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  meta: string;
  kind: 'shipment' | 'exception';
}

const CLOSED_SHIPMENT_STATUSES = new Set(['arrived', 'received', 'closed', 'cancelled', 'canceled', 'delivered']);
const EMPTY_SHIPMENTS: ShipmentRow[] = [];
const EMPTY_EXCEPTIONS: ExceptionRow[] = [];
const EMPTY_ASSESSMENTS: AiAssessmentRow[] = [];
const EMPTY_SUPPLIERS: SupplierRow[] = [];
const EMPTY_INVENTORY_LEVELS: InventoryLevelRow[] = [];
const EMPTY_EVENTS: ShipmentEventRow[] = [];

function displayValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shipmentIsClosed(shipment: ShipmentRow) {
  return shipment.actual_arrival_at !== null || CLOSED_SHIPMENT_STATUSES.has(shipment.status.toLowerCase());
}

export function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useSession();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      getManagerShipments(),
      getManagerExceptions(),
      getManagerAiAssessments(),
      getManagerSuppliers(),
      getManagerInventoryLevels(),
      getManagerShipmentEvents(),
    ])
      .then(([shipments, exceptions, assessments, suppliers, inventoryLevels, shipmentEvents]) => {
        if (active) setData({ shipments, exceptions, assessments, suppliers, inventoryLevels, shipmentEvents });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load operations overview. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const shipments = data?.shipments ?? EMPTY_SHIPMENTS;
  const exceptions = data?.exceptions ?? EMPTY_EXCEPTIONS;
  const assessments = data?.assessments ?? EMPTY_ASSESSMENTS;
  const suppliers = data?.suppliers ?? EMPTY_SUPPLIERS;
  const inventoryLevels = data?.inventoryLevels ?? EMPTY_INVENTORY_LEVELS;
  const shipmentEvents = data?.shipmentEvents ?? EMPTY_EVENTS;

  const shipmentById = useMemo(() => new Map(shipments.map((shipment) => [shipment.id, shipment])), [shipments]);
  const activeShipments = shipments.filter((shipment) => !shipmentIsClosed(shipment));
  const arrivedShipments = shipments.filter((shipment) =>
    shipment.actual_arrival_at !== null || ['arrived', 'received'].includes(shipment.status.toLowerCase()),
  );
  const now = Date.now();
  const overdueShipments = shipments.filter((shipment) => {
    if (!shipment.expected_arrival_at || shipmentIsClosed(shipment)) return false;
    const expectedArrival = Date.parse(shipment.expected_arrival_at);
    return Number.isFinite(expectedArrival) && expectedArrival < now;
  });
  const openExceptions = exceptions.filter((exception) => exception.status.toLowerCase() !== 'resolved');
  const highCriticalExceptions = openExceptions.filter((exception) =>
    ['high', 'critical'].includes(exception.severity.toLowerCase()),
  );
  const highCriticalAssessments = assessments.filter((assessment) =>
    ['high', 'critical'].includes(assessment.risk_level.toLowerCase()),
  );
  const reorderRequiredCount = inventoryLevels.filter((level) => {
    const availableStock = level.quantity_on_hand - level.quantity_reserved;
    return availableStock <= level.reorder_point;
  }).length;

  const shipmentStatuses = useMemo(
    () => [...new Set(shipments.map((shipment) => shipment.status))].sort(),
    [shipments],
  );
  const exceptionStatuses = useMemo(
    () => [...new Set(exceptions.map((exception) => exception.status))].sort(),
    [exceptions],
  );
  const assessmentRiskLevels = useMemo(
    () => [...new Set(assessments.map((assessment) => assessment.risk_level))].sort(),
    [assessments],
  );

  const latestExceptions = useMemo(
    () => [...exceptions].sort((a, b) => Date.parse(b.detected_at) - Date.parse(a.detected_at)).slice(0, 5),
    [exceptions],
  );

  const activity = useMemo(() => {
    const shipmentActivity: ActivityItem[] = shipmentEvents.map((event) => {
      const shipment = shipmentById.get(event.shipment_id);
      const location = event.location?.trim();
      return {
        id: `shipment-event-${event.id}`,
        title: `Shipment ${displayValue(event.status)}`,
        description: event.description ?? undefined,
        timestamp: event.event_time,
        meta: [shipment?.shipment_number ?? 'Shipment unavailable', location].filter(Boolean).join(' · '),
        kind: 'shipment',
      };
    });

    const exceptionActivity: ActivityItem[] = exceptions.map((exception) => {
      const shipment = shipmentById.get(exception.shipment_id);
      const shipmentNumber = shipment?.shipment_number ?? 'Shipment unavailable';
      return {
        id: `exception-detected-${exception.id}`,
        title: `Exception detected: ${exception.title}`,
        description: exception.description ?? undefined,
        timestamp: exception.detected_at,
        meta: `${shipmentNumber} · ${displayValue(exception.severity)} severity · ${displayValue(exception.status)}`,
        kind: 'exception',
      };
    });

    return [...shipmentActivity, ...exceptionActivity]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .slice(0, 7);
  }, [exceptions, shipmentById, shipmentEvents]);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || 'team';
  const metricValue = (value: number) => loading || error ? '—' : formatNumber(value);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={today}
        title={`${greeting}, ${firstName}`}
        description="Here is where inbound freight needs your attention today."
        actions={
          <Button variant="outline" onClick={() => navigate('/manager/exceptions')} className="gap-2">
            <TriangleAlert className="h-4 w-4" />
            Review exceptions
          </Button>
        }
      />

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active inbound shipments"
          value={metricValue(activeShipments.length)}
          hint={`${metricValue(shipments.filter(shipmentIsClosed).length)} arrived or otherwise closed`}
          icon={Ship}
          tone="info"
        />
        <MetricCard
          label="Overdue shipments"
          value={metricValue(overdueShipments.length)}
          hint="Past expected arrival and not arrived or closed"
          icon={Gauge}
          tone="orange"
        />
        <MetricCard
          label="Open exceptions"
          value={metricValue(openExceptions.length)}
          hint={`${metricValue(exceptions.filter((exception) => exception.status.toLowerCase() === 'acknowledged').length)} acknowledged`}
          icon={CircleAlert}
          tone="warning"
        />
        <MetricCard
          label="High & critical exceptions"
          value={metricValue(highCriticalExceptions.length)}
          hint="Unresolved, based on exception severity"
          icon={AlertOctagon}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Shipment status" description={`${metricValue(shipments.length)} total shipments`}>
          {loading ? <p className="text-sm text-muted-foreground">Loading shipment status…</p> : error ? <p className="text-sm text-muted-foreground">Unavailable</p> : shipments.length ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Arrived (status or actual arrival)</span>
                <span className="font-medium tabular-nums text-foreground">{formatNumber(arrivedShipments.length)}</span>
              </div>
              {shipmentStatuses.map((status) => (
                <div key={status} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{displayValue(status)}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatNumber(shipments.filter((shipment) => shipment.status === status).length)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No shipment records are available.</p>}
        </SectionCard>

        <SectionCard title="Exception status" description={`${metricValue(exceptions.length)} total exceptions`}>
          {loading ? <p className="text-sm text-muted-foreground">Loading exception status…</p> : error ? <p className="text-sm text-muted-foreground">Unavailable</p> : exceptions.length ? (
            <div className="space-y-3">
              {exceptionStatuses.map((status) => (
                <div key={status} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{displayValue(status)}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatNumber(exceptions.filter((exception) => exception.status === status).length)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No exception records are available.</p>}
        </SectionCard>

        <SectionCard title="AI assessments" description={`${metricValue(assessments.length)} total assessments · ${metricValue(highCriticalAssessments.length)} high or critical`}>
          {loading ? <p className="text-sm text-muted-foreground">Loading AI assessments…</p> : error ? <p className="text-sm text-muted-foreground">Unavailable</p> : assessments.length ? (
            <div className="space-y-3">
              {assessmentRiskLevels.map((riskLevel) => (
                <div key={riskLevel} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{displayValue(riskLevel)} risk</span>
                  <span className="font-medium tabular-nums text-foreground">{formatNumber(assessments.filter((assessment) => assessment.risk_level === riskLevel).length)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No AI assessment records are available.</p>}
        </SectionCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="surface-card flex items-center justify-between gap-4 border-border/80 p-5">
          <div><p className="text-sm font-medium text-muted-foreground">Suppliers</p><p className="mt-1 text-2xl font-semibold tabular-nums">{metricValue(suppliers.length)}</p></div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/manager/suppliers')}>View suppliers</Button>
        </Card>
        <Card className="surface-card flex items-center justify-between gap-4 border-border/80 p-5">
          <div><p className="text-sm font-medium text-muted-foreground">Inventory records</p><p className="mt-1 text-2xl font-semibold tabular-nums">{metricValue(inventoryLevels.length)}</p><p className="mt-1 text-xs text-muted-foreground">{metricValue(reorderRequiredCount)} require reorder</p></div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/manager/inventory')}>View inventory</Button>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SectionCard
          title="Latest shipment exceptions"
          description="Most recently detected issues across inbound freight"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/manager/exceptions')}>
              View all
            </Button>
          }
          contentClassName="p-0 pt-0"
        >
          {loading ? <p className="p-5 text-sm text-muted-foreground">Loading exceptions…</p> : error ? <p className="p-5 text-sm text-muted-foreground">Unavailable while exception data could not be loaded.</p> : latestExceptions.length ? (
            <div className="divide-y divide-border">
              {latestExceptions.map((exception) => {
                const severity = exception.severity.toLowerCase();
                const severityTone = severity === 'critical' || severity === 'high'
                  ? 'danger'
                  : severity === 'medium' ? 'warning' : severity === 'low' ? 'info' : 'neutral';
                return (
                  <a
                    key={exception.id}
                    href={`#/manager/exceptions/${exception.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(`/manager/exceptions/${exception.id}`);
                    }}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
                  >
                    <span className={`h-11 w-1 shrink-0 rounded-full ${severityTone === 'danger' ? 'bg-rose-500' : severityTone === 'warning' ? 'bg-amber-400' : severityTone === 'info' ? 'bg-sky-400' : 'bg-slate-400'}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono">{exception.id}</span><span aria-hidden="true">·</span>
                        <span>{displayValue(exception.exception_type)}</span><span aria-hidden="true">·</span>
                        <span>{formatShortDateTime(exception.detected_at)}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground group-hover:text-primary">{exception.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{shipmentById.get(exception.shipment_id)?.shipment_number ?? 'Shipment unavailable'}</p>
                    </div>
                    <StatusBadge tone={severityTone}>{displayValue(exception.severity)}</StatusBadge>
                  </a>
                );
              })}
            </div>
          ) : <p className="p-5 text-sm text-muted-foreground">No exception records are available.</p>}
        </SectionCard>

        <SectionCard title="Recent operational activity" description="Recorded shipment events and exception updates">
          {loading ? (
            <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading activity…</div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">Activity is unavailable while operational data could not be loaded.</p>
          ) : activity.length ? (
            <Timeline
              items={activity.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                timestamp: item.timestamp,
                meta: item.meta,
                tone: item.kind === 'exception' ? 'danger' : 'default',
                badge: <StatusBadge tone={item.kind === 'exception' ? 'warning' : 'info'} showDot={false}>{item.kind === 'exception' ? 'Exception' : 'Shipment event'}</StatusBadge>,
              }))}
            />
          ) : <p className="text-sm text-muted-foreground">No recorded shipment events or exception activity are available.</p>}
        </SectionCard>
      </div>
    </div>
  );
}
