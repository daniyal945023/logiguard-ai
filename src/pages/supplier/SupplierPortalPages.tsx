import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Clock3, LoaderCircle, Plus, Ship, Truck } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Timeline } from '@/components/common/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatDateTime, formatNumber, formatShortDateTime } from '@/lib/format';
import { navigate } from '@/lib/router';
import { shipmentStatusMeta, shipmentStatusOptions } from '@/lib/status';
import {
  getSupplierProducts,
  getSupplierRecord,
  getSupplierShipmentEvents,
  getSupplierShipmentItems,
  getSupplierShipments,
  getSupplierWarehouses,
  insertSupplierShipmentEvent,
} from '@/services/logisticsDataService';
import { useSession } from '@/services/session';
import type { ProductRow, ShipmentEventRow, ShipmentItemRow, ShipmentRow, SupplierRow, WarehouseRow } from '@/types/database';
import type { ShipmentStatus } from '@/types/logistics';

type SupplierPageData = {
  supplier: SupplierRow;
  shipments: ShipmentRow[];
  warehouses: WarehouseRow[];
};

type SupplierDirectoryData = {
  shipments: ShipmentRow[];
  warehouses: WarehouseRow[];
};

interface SupplierShipmentDetailData {
  shipment: ShipmentRow;
  items: ShipmentItemRow[];
  products: ProductRow[];
  events: ShipmentEventRow[];
  warehouse: WarehouseRow | undefined;
}

type SupplierShipmentDetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notFound' }
  | { status: 'ready'; data: SupplierShipmentDetailData };

const EMPTY_SHIPMENTS: ShipmentRow[] = [];
const EMPTY_WAREHOUSES: WarehouseRow[] = [];

function getShipmentStatusDisplay(status: string) {
  const knownStatus = shipmentStatusOptions.find((option) => option.value === status);
  return {
    label: knownStatus?.label ?? status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    tone: knownStatus ? shipmentStatusMeta[knownStatus.value].tone : 'neutral' as const,
  };
}

function isClosedShipment(shipment: ShipmentRow) {
  return shipment.actual_arrival_at !== null || ['arrived', 'received'].includes(shipment.status.toLowerCase());
}

function SupplierLoading({ children }: { children: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> {children}
    </div>
  );
}

function SupplierError({ message }: { message: string }) {
  return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message}</div>;
}

export function SupplierOverviewPage() {
  const { profile } = useSession();
  const [data, setData] = useState<SupplierPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([getSupplierRecord(), getSupplierShipments(), getSupplierWarehouses()])
      .then(([supplier, shipments, warehouses]) => {
        if (active) setData({ supplier, shipments, warehouses });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load your supplier overview.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const shipments = data?.shipments ?? EMPTY_SHIPMENTS;
  const supplier = data?.supplier;
  const warehouseById = useMemo(() => new Map((data?.warehouses ?? EMPTY_WAREHOUSES).map((warehouse) => [warehouse.id, warehouse])), [data?.warehouses]);
  const active = shipments.filter((shipment) => !isClosedShipment(shipment));
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const shipment of shipments) counts.set(shipment.status, (counts.get(shipment.status) ?? 0) + 1);
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shipments]);
  const now = Date.now();
  const upcoming = [...active]
    .filter((shipment) => shipment.expected_arrival_at && Number.isFinite(Date.parse(shipment.expected_arrival_at)) && Date.parse(shipment.expected_arrival_at) >= now)
    .sort((a, b) => (a.expected_arrival_at ?? '').localeCompare(b.expected_arrival_at ?? ''))
    .slice(0, 4);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Supplier workspace" title={`Welcome, ${profile?.full_name.trim().split(/\s+/)[0] ?? 'supplier'}`} description={`${supplier?.company_name ?? 'Your supplier account'} · Shipment updates and inbound coordination.`} actions={<Button onClick={() => navigate('/supplier/shipments')} className="gap-2">View shipments <ArrowRight className="h-4 w-4" /></Button>} />
      {error && <SupplierError message={error} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <SupplierMetric label="Assigned shipments" value={loading || error ? '—' : shipments.length} detail="Shipments assigned to your account" icon={Ship} />
        <SupplierMetric label="In progress" value={loading || error ? '—' : active.length} detail="Not yet arrived or received" icon={Truck} />
        <SupplierMetric label="Upcoming arrivals" value={loading || error ? '—' : upcoming.length} detail="Future expected arrival dates" icon={Clock3} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <SectionCard title="Upcoming arrivals" description="Your next scheduled deliveries" action={<Button variant="ghost" size="sm" onClick={() => navigate('/supplier/shipments')}>All shipments</Button>}>
          {loading ? <SupplierLoading>Loading upcoming arrivals…</SupplierLoading> : error ? <p className="text-sm text-muted-foreground">Upcoming arrivals are unavailable.</p> : shipments.length === 0 ? <p className="text-sm text-muted-foreground">No shipments are currently assigned.</p> : upcoming.length ? (
            <div className="space-y-3">
              {upcoming.map((shipment) => <SupplierShipmentCard key={shipment.id} shipment={shipment} warehouseName={warehouseById.get(shipment.warehouse_id)?.name} />)}
            </div>
          ) : <p className="text-sm text-muted-foreground">No future expected arrivals are currently assigned.</p>}
        </SectionCard>
        <SectionCard title="Shipment status" description="Current status counts for your shipments">
          {loading ? <SupplierLoading>Loading shipment statuses…</SupplierLoading> : error ? <p className="text-sm text-muted-foreground">Shipment statuses are unavailable.</p> : statusCounts.length ? (
            <div className="space-y-3">
              {statusCounts.map(([status, count]) => {
                const statusDisplay = getShipmentStatusDisplay(status);
                return <div key={status} className="flex items-center justify-between gap-3"><StatusBadge tone={statusDisplay.tone}>{statusDisplay.label}</StatusBadge><span className="text-sm font-medium tabular-nums">{formatNumber(count)}</span></div>;
              })}
            </div>
          ) : <p className="text-sm text-muted-foreground">No shipment status records are available.</p>}
        </SectionCard>
      </div>
      <Card className="surface-card flex items-start gap-3 p-4">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">Your portal is scoped to {supplier?.company_name ?? 'your supplier account'}. Internal Northstar assessments, exception notes, and other supplier records are not available here.</p>
      </Card>
    </div>
  );
}

export function SupplierShipmentsPage() {
  const [data, setData] = useState<SupplierDirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([getSupplierShipments(), getSupplierWarehouses()])
      .then(([shipments, warehouses]) => {
        if (active) setData({ shipments, warehouses });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load your shipments.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const assigned = data?.shipments ?? EMPTY_SHIPMENTS;
  const warehouseById = useMemo(() => new Map((data?.warehouses ?? EMPTY_WAREHOUSES).map((item) => [item.id, item])), [data?.warehouses]);
  const statuses = useMemo(() => [...new Set(assigned.map((shipment) => shipment.status))].sort(), [assigned]);
  const rows = assigned.filter((item) => {
    const term = query.trim().toLowerCase();
    return (term === '' || [
      item.shipment_number,
      item.tracking_number ?? '',
      item.carrier_name ?? '',
      item.transport_mode ?? '',
      warehouseById.get(item.warehouse_id)?.name ?? '',
    ].some((value) => value.toLowerCase().includes(term))) &&
      (status === 'all' || item.status === status);
  }).sort((a, b) => (a.expected_arrival_at ?? '').localeCompare(b.expected_arrival_at ?? ''));

  return (
    <div className="space-y-6">
      <PageHeader title="Your shipments" description="Review delivery details and submit status updates for your assigned inbound shipments." actions={!loading && !error ? <span className="text-sm text-muted-foreground">{rows.length} of {assigned.length} shipments</span> : undefined} />
      <Card className="surface-card border-border/80 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div className="relative"><span className="sr-only">Search shipments</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shipment number, carrier, or tracking" className="border-border bg-background/60" /></div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter shipment status" className="border-border bg-background/60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((value) => <SelectItem key={value} value={value}>{getShipmentStatusDisplay(value).label}</SelectItem>)}</SelectContent></Select>
        </div>
      </Card>
      <Card className="surface-card overflow-hidden border-border/80">
        {loading ? <SupplierLoading>Loading your shipments…</SupplierLoading> : error ? <SupplierError message={error} /> : assigned.length === 0 ? <EmptyState icon={Ship} title="No shipments found" description="No shipments are currently assigned to your supplier account." /> : rows.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead className="pl-5">Shipment number</TableHead><TableHead>Tracking number</TableHead><TableHead>Destination</TableHead><TableHead>Carrier / mode</TableHead><TableHead>Expected arrival</TableHead><TableHead>Actual arrival</TableHead><TableHead>Status</TableHead><TableHead>Last updated</TableHead><TableHead className="pr-5" /></TableRow></TableHeader><TableBody>{rows.map((shipment) => {
          const statusDisplay = getShipmentStatusDisplay(shipment.status);
          return <TableRow key={shipment.id} className="cursor-pointer border-border hover:bg-accent/40" onClick={() => navigate(`/supplier/shipments/${shipment.id}`)}>
            <TableCell className="pl-5 font-mono text-sm font-medium text-primary">{shipment.shipment_number}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{shipment.tracking_number ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{warehouseById.get(shipment.warehouse_id)?.name ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{shipment.carrier_name ?? '—'}{shipment.transport_mode ? <p className="text-xs">{shipment.transport_mode.replace(/_/g, ' ')}</p> : null}</TableCell>
            <TableCell className="whitespace-nowrap text-sm">{shipment.expected_arrival_at ? formatDate(shipment.expected_arrival_at) : '—'}</TableCell>
            <TableCell className="whitespace-nowrap text-sm">{shipment.actual_arrival_at ? formatDate(shipment.actual_arrival_at) : '—'}</TableCell>
            <TableCell><StatusBadge tone={statusDisplay.tone}>{statusDisplay.label}</StatusBadge></TableCell>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatShortDateTime(shipment.updated_at)}</TableCell>
            <TableCell className="pr-5"><span className="inline-flex items-center gap-1 text-xs text-primary">Open <ArrowRight className="h-3.5 w-3.5" /></span></TableCell>
          </TableRow>;
        })}</TableBody></Table></div> : <EmptyState icon={Ship} title="No shipments match your filters" description="Adjust the search or status filter to see other assigned shipments." />}
      </Card>
    </div>
  );
}

export function SupplierShipmentDetailPage({ id }: { id: string }) {
  const [state, setState] = useState<SupplierShipmentDetailState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    async function load() {
      try {
        const [shipments, warehouses] = await Promise.all([
          getSupplierShipments(),
          getSupplierWarehouses(),
        ]);
        if (!active) return;

        const shipment = shipments.find((item) => item.id === id);
        if (!shipment) {
          setState({ status: 'notFound' });
          return;
        }

        const [items, products, events] = await Promise.all([
          getSupplierShipmentItems(shipment.id),
          getSupplierProducts(shipment.id),
          getSupplierShipmentEvents(shipment.id),
        ]);
        if (!active) return;

        setState({
          status: 'ready',
          data: {
            shipment,
            items,
            products,
            events,
            warehouse: warehouses.find((item) => item.id === shipment.warehouse_id),
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

  if (state.status === 'loading') {
    return <SupplierLoading>Loading shipment details…</SupplierLoading>;
  }
  if (state.status === 'error') {
    return (
      <div className="space-y-5">
        <a href="#/supplier/shipments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Your shipments</a>
        <SupplierError message={state.message} />
      </div>
    );
  }
  if (state.status === 'notFound') {
    return <EmptyState icon={Ship} title="Shipment not found" description="This shipment does not exist or is not assigned to your supplier account." action={<Button variant="outline" onClick={() => navigate('/supplier/shipments')}>Back to your shipments</Button>} />;
  }

  return <SupplierShipmentDetailContent key={state.data.shipment.id} data={state.data} />;
}

function SupplierShipmentDetailContent({ data }: { data: SupplierShipmentDetailData }) {
  const { shipment, items, products, events, warehouse } = data;
  const { toast } = useToast();
  const submitLock = useRef(false);
  const [shipmentEvents, setShipmentEvents] = useState(events);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [status, setStatus] = useState<ShipmentStatus>(() => getInitialUpdateStatus(shipment.status));
  const [trackingNumber, setTrackingNumber] = useState(shipment.tracking_number ?? '');
  const [revisedEta, setRevisedEta] = useState(() => toDateTimeLocal(shipment.expected_arrival_at));
  const [notes, setNotes] = useState('');
  const productById = new Map(products.map((product) => [product.id, product]));
  const statusDisplay = getShipmentStatusDisplay(shipment.status);

  useEffect(() => {
    setShipmentEvents(events);
    setStatus(getInitialUpdateStatus(shipment.status));
    setTrackingNumber(shipment.tracking_number ?? '');
    setRevisedEta(toDateTimeLocal(shipment.expected_arrival_at));
    setNotes('');
  }, [events, shipment.expected_arrival_at, shipment.id, shipment.status, shipment.tracking_number]);

  async function handleSubmitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;

    const parsedEta = Date.parse(revisedEta);
    if (!Number.isFinite(parsedEta)) {
      setSubmissionError('Enter a valid revised estimated arrival date and time.');
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    setHistoryError(null);
    try {
      const insertedEvent = await insertSupplierShipmentEvent({
        shipmentId: shipment.id,
        status,
        trackingNumber,
        revisedEta: new Date(parsedEta).toISOString(),
        notes,
      });

      setShipmentEvents((currentEvents) => currentEvents.some((item) => item.id === insertedEvent.id)
        ? currentEvents
        : [...currentEvents, insertedEvent].sort((a, b) => Date.parse(a.event_time) - Date.parse(b.event_time)));
      setUpdateDialogOpen(false);
      setStatus(getInitialUpdateStatus(shipment.status));
      setTrackingNumber(shipment.tracking_number ?? '');
      setRevisedEta(toDateTimeLocal(shipment.expected_arrival_at));
      setNotes('');
      toast({ title: 'Shipment update submitted', description: 'Your update was recorded successfully.' });

      try {
        const refreshedEvents = await getSupplierShipmentEvents(shipment.id);
        setShipmentEvents(refreshedEvents);
      } catch {
        setHistoryError('Your update was submitted, but shipment history could not be refreshed. Reload the page to see the latest events.');
        toast({
          title: 'Update submitted; history refresh failed',
          description: 'Your update was saved. Reload the page to view the latest shipment history.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to submit the shipment update. Please try again.');
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <a href="#/supplier/shipments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Your shipments</a>
      <PageHeader
        eyebrow="Shipment details"
        title={shipment.shipment_number}
        description={shipment.tracking_number ? `Tracking number ${shipment.tracking_number}` : 'Tracking number unavailable'}
        actions={<StatusBadge tone={statusDisplay.tone}>{statusDisplay.label}</StatusBadge>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SectionCard title="Shipment details" description="Booking and delivery information">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailItem label="Shipment number" value={shipment.shipment_number} mono />
            <DetailItem label="Tracking number" value={shipment.tracking_number ?? '—'} mono />
            <DetailItem label="Status" value={statusDisplay.label} />
            <DetailItem label="Carrier" value={shipment.carrier_name ?? '—'} />
            <DetailItem label="Transport mode" value={shipment.transport_mode?.replace(/_/g, ' ') ?? '—'} />
            <DetailItem label="Destination warehouse" value={warehouse?.name ?? '—'} />
            <DetailItem label="Warehouse location" value={warehouse?.location ?? '—'} />
            <DetailItem label="Expected arrival" value={formatOptionalDateTime(shipment.expected_arrival_at)} />
            <DetailItem label="Actual arrival" value={formatOptionalDateTime(shipment.actual_arrival_at)} />
            <DetailItem label="Created" value={formatOptionalDateTime(shipment.created_at)} />
            <DetailItem label="Last updated" value={formatOptionalDateTime(shipment.updated_at)} />
          </dl>
        </SectionCard>
        <SectionCard title="Shipment items" description="Products and quantities on this shipment">
          {items.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Expected</TableHead><TableHead>Received</TableHead></TableRow></TableHeader>
                <TableBody>{items.map((item) => {
                  const product = productById.get(item.product_id);
                  return (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{product?.name ?? 'Product unavailable'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{product?.sku ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">{formatNumber(item.quantity_expected)}</TableCell>
                      <TableCell className="tabular-nums">{formatNumber(item.quantity_received)}</TableCell>
                    </TableRow>
                  );
                })}</TableBody>
              </Table>
            </div>
          ) : <p className="text-sm text-muted-foreground">No shipment items are available for this shipment.</p>}
        </SectionCard>
      </div>
      <SectionCard
        title="Shipment update history"
        description="Supplier portal updates for this shipment"
        action={<Button onClick={() => setUpdateDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Submit update</Button>}
      >
        {historyError && <p role="status" className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{historyError}</p>}
        {shipmentEvents.length ? (
          <Timeline items={shipmentEvents.map((event) => ({
            id: event.id,
            title: getShipmentStatusDisplay(event.status).label,
            description: event.description ?? undefined,
            timestamp: event.event_time,
            meta: event.location ?? undefined,
            tone: 'accent',
          }))} />
        ) : <p className="text-sm text-muted-foreground">No supplier portal updates have been recorded.</p>}
      </SectionCard>
      <Dialog open={updateDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setUpdateDialogOpen(open);
          if (open) setSubmissionError(null);
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSubmitUpdate} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Submit shipment update</DialogTitle>
              <DialogDescription>Provide the latest status and delivery information for {shipment.shipment_number}.</DialogDescription>
            </DialogHeader>
            {submissionError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{submissionError}</p>}
            <div className="space-y-2">
              <label htmlFor="supplier-update-status" className="text-sm font-medium">Shipment status</label>
              <Select value={status} onValueChange={(value) => {
                const selectedStatus = shipmentStatusOptions.find((option) => option.value === value);
                if (selectedStatus) setStatus(selectedStatus.value);
              }} disabled={isSubmitting}>
                <SelectTrigger id="supplier-update-status" aria-label="Shipment status"><SelectValue /></SelectTrigger>
                <SelectContent>{shipmentStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="supplier-update-tracking" className="text-sm font-medium">Tracking number</label>
              <Input id="supplier-update-tracking" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <label htmlFor="supplier-update-eta" className="text-sm font-medium">Revised estimated arrival</label>
              <Input id="supplier-update-eta" type="datetime-local" value={revisedEta} onChange={(event) => setRevisedEta(event.target.value)} required disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <label htmlFor="supplier-update-notes" className="text-sm font-medium">Update notes</label>
              <Textarea id="supplier-update-notes" value={notes} onChange={(event) => setNotes(event.target.value)} required minLength={5} rows={4} disabled={isSubmitting} />
              <p className="text-xs text-muted-foreground">Enter at least 5 characters.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUpdateDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting…' : 'Submit update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupplierShipmentCard({ shipment, warehouseName }: { shipment: ShipmentRow; warehouseName?: string }) {
  const statusDisplay = getShipmentStatusDisplay(shipment.status);
  return <button type="button" onClick={() => navigate(`/supplier/shipments/${shipment.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors hover:bg-accent/50">
    <div className="min-w-0"><p className="font-mono text-xs font-medium text-primary">{shipment.shipment_number}</p><p className="mt-1 truncate text-sm font-medium text-foreground">{warehouseName ?? 'Destination unavailable'}</p><p className="mt-1 text-xs text-muted-foreground">ETA {shipment.expected_arrival_at ? formatDate(shipment.expected_arrival_at) : 'Unavailable'}</p></div>
    <StatusBadge tone={statusDisplay.tone}>{statusDisplay.label}</StatusBadge>
  </button>;
}

function SupplierMetric({ label, value, detail, icon: Icon }: { label: string; value: number | string; detail: string; icon: typeof Ship }) {
  return <Card className="surface-card p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p></div><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-xs text-muted-foreground">{detail}</p></Card>;
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1.5 text-sm text-foreground ${mono ? 'font-mono' : ''}`}>{value}</dd></div>;
}

function formatOptionalDateTime(value: string | null) {
  return value && Number.isFinite(Date.parse(value)) ? formatDateTime(value) : '—';
}

function getInitialUpdateStatus(status: string): ShipmentStatus {
  return shipmentStatusOptions.find((option) => option.value === status)?.value ?? 'scheduled';
}

function toDateTimeLocal(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}
