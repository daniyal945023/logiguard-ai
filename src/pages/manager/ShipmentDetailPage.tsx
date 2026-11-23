import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CircleOff, LoaderCircle, PackageSearch } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { InfoItem } from '@/components/common/InfoItem';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline } from '@/components/common/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime, formatNumber } from '@/lib/format';
import { navigate } from '@/lib/router';
import {
  getManagerAiAssessments,
  getManagerExceptions,
  getManagerProducts,
  getManagerShipmentEvents,
  getManagerShipmentItems,
  getManagerShipments,
  getManagerSuppliers,
  getManagerWarehouses,
} from '@/services/logisticsDataService';
import type {
  AiAssessmentRow,
  ExceptionRow,
  ProductRow,
  ShipmentEventRow,
  ShipmentItemRow,
  ShipmentRow,
  SupplierRow,
  WarehouseRow,
} from '@/types/database';

interface ShipmentDetailData {
  shipment: ShipmentRow;
  supplier: SupplierRow | undefined;
  warehouse: WarehouseRow | undefined;
  items: ShipmentItemRow[];
  products: ProductRow[];
  events: ShipmentEventRow[];
  exceptions: ExceptionRow[];
  assessments: AiAssessmentRow[];
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notFound' }
  | { status: 'ready'; data: ShipmentDetailData };

function displayValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('critical') || normalized.includes('high') || normalized.includes('delay') || normalized.includes('hold')) return 'danger' as const;
  if (normalized.includes('resolved') || normalized.includes('received') || normalized.includes('complete')) return 'success' as const;
  if (normalized.includes('medium') || normalized.includes('open')) return 'warning' as const;
  return 'neutral' as const;
}

function LoadingState() {
  return (
    <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      Loading shipment…
    </div>
  );
}

export function ShipmentDetailPage({ id }: { id: string }) {
  const [state, setState] = useState<DetailState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    async function load() {
      try {
        const [shipments, suppliers, warehouses] = await Promise.all([
          getManagerShipments(),
          getManagerSuppliers(),
          getManagerWarehouses(),
        ]);
        if (!active) return;

        const shipment = shipments.find((row) => row.id === id);
        if (!shipment) {
          setState({ status: 'notFound' });
          return;
        }

        const [items, events, exceptions, products, allAssessments] = await Promise.all([
          getManagerShipmentItems(shipment.id),
          getManagerShipmentEvents(shipment.id),
          getManagerExceptions(),
          getManagerProducts(),
          getManagerAiAssessments(),
        ]);
        if (!active) return;

        const relatedExceptions = exceptions.filter((item) => item.shipment_id === shipment.id);
        const exceptionIds = new Set(relatedExceptions.map((item) => item.id));
        const relatedAssessments = allAssessments.filter((item) => exceptionIds.has(item.exception_id));

        setState({
          status: 'ready',
          data: {
            shipment,
            supplier: suppliers.find((item) => item.id === shipment.supplier_id),
            warehouse: warehouses.find((item) => item.id === shipment.warehouse_id),
            items,
            products,
            events: [...events].sort((a, b) => a.event_time.localeCompare(b.event_time)),
            exceptions: relatedExceptions,
            assessments: relatedAssessments,
          },
        });
      } catch (cause) {
        if (active) {
          setState({
            status: 'error',
            message: cause instanceof Error ? cause.message : 'Could not load shipment details. Please try again.',
          });
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') {
    return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{state.message}</div>;
  }
  if (state.status === 'notFound') {
    return (
      <EmptyState
        icon={CircleOff}
        title="Shipment not found"
        description="No shipment record exists for this reference."
        action={<Button variant="outline" onClick={() => navigate('/manager/shipments')}>Back to shipments</Button>}
      />
    );
  }

  return <ShipmentDetailContent data={state.data} />;
}

function ShipmentDetailContent({ data }: { data: ShipmentDetailData }) {
  const { shipment, supplier, warehouse, items, products, events, exceptions, assessments } = data;
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const eventItems = events.map((event) => ({
    id: event.id,
    title: displayValue(event.status),
    description: event.description ?? undefined,
    timestamp: event.event_time,
    meta: [event.location, event.source].filter(Boolean).join(' · ') || undefined,
  }));
  const assessmentByExceptionId = useMemo(() => {
    const grouped = new Map<string, AiAssessmentRow[]>();
    assessments.forEach((assessment) => {
      const current = grouped.get(assessment.exception_id) ?? [];
      current.push(assessment);
      grouped.set(assessment.exception_id, current);
    });
    return grouped;
  }, [assessments]);

  return (
    <div className="space-y-6">
      <a href="#/manager/shipments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Inbound shipments
      </a>

      <PageHeader
        title={shipment.shipment_number}
        description={`${supplier?.company_name ?? 'Supplier unavailable'} · ${warehouse?.name ?? 'Warehouse unavailable'}`}
        actions={<StatusBadge tone={statusTone(shipment.status)}>{displayValue(shipment.status)}</StatusBadge>}
      />

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 sm:w-auto">
          <TabsTrigger value="details" className="data-[state=active]:bg-secondary">Details</TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-secondary">Event history</TabsTrigger>
          <TabsTrigger value="exceptions" className="data-[state=active]:bg-secondary">
            Exceptions {exceptions.length > 0 && <span className="ml-1.5 tabular-nums text-muted-foreground">{exceptions.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          <div className="space-y-6">
            <SectionCard title="Shipment information" description="Shipment, supplier, and delivery details">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <InfoItem label="Shipment number"><span className="font-mono">{shipment.shipment_number}</span></InfoItem>
                <InfoItem label="Tracking number"><span className="font-mono">{shipment.tracking_number ?? '—'}</span></InfoItem>
                <InfoItem label="Supplier">
                  {supplier ? <a href={`#/manager/suppliers/${supplier.id}`} className="text-primary hover:underline">{supplier.company_name}</a> : '—'}
                </InfoItem>
                <InfoItem label="Supplier contact">{supplier?.contact_name ?? '—'}</InfoItem>
                <InfoItem label="Supplier email">{supplier?.email ?? '—'}</InfoItem>
                <InfoItem label="Supplier phone">{supplier?.phone ?? '—'}</InfoItem>
                <InfoItem label="Warehouse">{warehouse?.name ?? '—'}</InfoItem>
                <InfoItem label="Warehouse location">{warehouse?.location ?? '—'}</InfoItem>
                <InfoItem label="Warehouse address">{warehouse?.address ?? '—'}</InfoItem>
                <InfoItem label="Carrier">{shipment.carrier_name ?? '—'}</InfoItem>
                <InfoItem label="Transport mode">{shipment.transport_mode ? displayValue(shipment.transport_mode) : '—'}</InfoItem>
                <InfoItem label="Expected arrival">{shipment.expected_arrival_at ? formatDateTime(shipment.expected_arrival_at) : '—'}</InfoItem>
                <InfoItem label="Actual arrival">{shipment.actual_arrival_at ? formatDateTime(shipment.actual_arrival_at) : '—'}</InfoItem>
                <InfoItem label="Last updated">{formatDateTime(shipment.updated_at)}</InfoItem>
                <InfoItem label="Shipment notes">{shipment.notes ?? '—'}</InfoItem>
              </dl>
            </SectionCard>

            <SectionCard title="Shipment items" description="Expected and received quantities from shipment item records">
              {items.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity expected</TableHead>
                        <TableHead>Quantity received</TableHead>
                        <TableHead className="text-right">Unit cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const product = productById.get(item.product_id);
                        return (
                          <TableRow key={item.id} className="border-border">
                            <TableCell className="font-medium">{product?.name ?? 'Product unavailable'}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{product?.sku ?? '—'}</TableCell>
                            <TableCell className="tabular-nums">{formatNumber(item.quantity_expected)}</TableCell>
                            <TableCell className="tabular-nums">{formatNumber(item.quantity_received)}</TableCell>
                            <TableCell className="text-right tabular-nums">{item.unit_cost === null ? '—' : formatNumber(item.unit_cost)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-2 text-sm text-muted-foreground">No shipment items are recorded.</div>
              )}
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-0">
          <SectionCard title="Event history" description="Shipment events in chronological order">
            {eventItems.length ? <Timeline items={eventItems} /> : <p className="text-sm text-muted-foreground">No events recorded for this shipment.</p>}
          </SectionCard>
        </TabsContent>

        <TabsContent value="exceptions" className="mt-0">
          {exceptions.length ? (
            <div className="space-y-4">
              {exceptions.map((exception) => (
                <ExceptionCard
                  key={exception.id}
                  exception={exception}
                  assessments={assessmentByExceptionId.get(exception.id) ?? []}
                />
              ))}
            </div>
          ) : (
            <Card className="surface-card border-border/80">
              <EmptyState icon={PackageSearch} title="No exceptions" description="This shipment has no recorded exceptions." />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExceptionCard({ exception, assessments }: { exception: ExceptionRow; assessments: AiAssessmentRow[] }) {
  return (
    <SectionCard
      title={exception.title}
      description={`${displayValue(exception.exception_type)} · Detected ${formatDateTime(exception.detected_at)}`}
      action={
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={statusTone(exception.severity)}>{displayValue(exception.severity)}</StatusBadge>
          <StatusBadge tone={statusTone(exception.status)}>{displayValue(exception.status)}</StatusBadge>
        </div>
      }
    >
      <div className="space-y-4">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <InfoItem label="Description">{exception.description ?? '—'}</InfoItem>
          <InfoItem label="Estimated exposure">{exception.estimated_exposure === null ? '—' : formatNumber(exception.estimated_exposure)}</InfoItem>
          <InfoItem label="Assigned to">{exception.assigned_to ?? '—'}</InfoItem>
          <InfoItem label="Resolved at">{exception.resolved_at ? formatDateTime(exception.resolved_at) : '—'}</InfoItem>
        </dl>
        {assessments.length > 0 && (
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">AI assessments</h3>
            {assessments.map((assessment) => (
              <Card key={assessment.id} className="border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge tone={statusTone(assessment.risk_level)}>{displayValue(assessment.risk_level)}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(assessment.created_at)}</span>
                </div>
                {assessment.risk_score !== null && <p className="mt-2 text-xs text-muted-foreground">Risk score: {formatNumber(assessment.risk_score)}</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{assessment.summary}</p>
                {assessment.recommended_action && (
                  <p className="mt-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Recommended action: </span>{assessment.recommended_action}</p>
                )}
                {assessment.model_name && <p className="mt-2 text-xs text-muted-foreground">Model: {assessment.model_name}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
