import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Boxes, BrainCircuit, Building2, CircleOff, LoaderCircle, Mail, MapPin, Phone, SlidersHorizontal } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber, formatShortDateTime } from '@/lib/format';
import { navigate } from '@/lib/router';
import {
  getManagerAiAssessments,
  getManagerExceptions,
  getManagerInventoryLevels,
  getManagerProducts,
  getManagerShipments,
  getManagerSuppliers,
  getManagerWarehouses,
} from '@/services/logisticsDataService';
import type {
  AiAssessmentRow,
  ExceptionRow,
  InventoryLevelRow,
  Json,
  ProductRow,
  ShipmentRow,
  WarehouseRow,
} from '@/types/database';

const EMPTY_ASSESSMENTS: AiAssessmentRow[] = [];
const EMPTY_EXCEPTIONS: ExceptionRow[] = [];
const EMPTY_SHIPMENTS: ShipmentRow[] = [];
const EMPTY_INVENTORY_LEVELS: InventoryLevelRow[] = [];
const EMPTY_PRODUCTS: ProductRow[] = [];
const EMPTY_WAREHOUSES: WarehouseRow[] = [];

function useRemoteData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load data. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  return { data, loading, error };
}

function LoadingMessage({ children }: { children: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {message}
    </div>
  );
}

interface AssessmentExtras {
  businessImpact?: string;
  recommendedActions?: string[];
  dataGaps?: string[];
}

function isJsonRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonString(record: { [key: string]: Json | undefined }, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function jsonStringArray(record: { [key: string]: Json | undefined }, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      const entries = value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()));
      if (entries.length) return entries;
    }
  }
  return undefined;
}

function assessmentExtras(raw: Json | null): AssessmentExtras {
  if (!isJsonRecord(raw)) return {};
  return {
    businessImpact: jsonString(raw, ['business_impact', 'businessImpact']),
    recommendedActions: jsonStringArray(raw, ['recommended_actions', 'recommendedActions']),
    dataGaps: jsonStringArray(raw, ['data_gaps', 'dataGaps']),
  };
}

function displayDatabaseValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function assessmentTone(value: string) {
  switch (value.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'danger' as const;
    case 'medium':
      return 'warning' as const;
    case 'low':
      return 'success' as const;
    default:
      return 'neutral' as const;
  }
}

export function ManagerAssessmentsPage() {
  const [data, setData] = useState<{
    assessments: AiAssessmentRow[];
    exceptions: ExceptionRow[];
    shipments: ShipmentRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([getManagerAiAssessments(), getManagerExceptions(), getManagerShipments()])
      .then(([assessments, exceptions, shipments]) => {
        if (active) setData({ assessments, exceptions, shipments });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load AI assessments. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const assessments = data?.assessments ?? EMPTY_ASSESSMENTS;
  const exceptions = data?.exceptions ?? EMPTY_EXCEPTIONS;
  const shipments = data?.shipments ?? EMPTY_SHIPMENTS;
  const exceptionById = useMemo(() => new Map(exceptions.map((exception) => [exception.id, exception])), [exceptions]);
  const shipmentById = useMemo(() => new Map(shipments.map((shipment) => [shipment.id, shipment])), [shipments]);
  const riskLevels = useMemo(() => [...new Set(assessments.map((assessment) => assessment.risk_level))].sort(), [assessments]);
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assessments
      .filter((assessment) => {
        const exception = exceptionById.get(assessment.exception_id);
        const shipment = exception ? shipmentById.get(exception.shipment_id) : undefined;
        const searchable = [
          assessment.id,
          assessment.summary,
          assessment.recommended_action ?? '',
          assessment.model_name ?? '',
          exception?.id ?? '',
          exception?.title ?? '',
          shipment?.shipment_number ?? '',
        ];
        return (term === '' || searchable.some((value) => value.toLowerCase().includes(term))) &&
          (risk === 'all' || assessment.risk_level === risk);
      })
      .sort((a, b) => {
        const riskComparison = (b.risk_score ?? -1) - (a.risk_score ?? -1);
        return riskComparison || b.created_at.localeCompare(a.created_at);
      });
  }, [assessments, exceptionById, query, risk, shipmentById]);

  function openException(exceptionId: string) {
    navigate(`/manager/exceptions/${exceptionId}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI assessments"
        description="Operational risk assessments associated with recorded exceptions."
        actions={!loading && !error ? <span className="text-sm text-muted-foreground">{rows.length} assessments</span> : undefined}
      />
      <Card className="surface-card border-border/80 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search exception, shipment, or assessment" />
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger aria-label="Filter by risk" className="border-border bg-background/60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk levels</SelectItem>
              {riskLevels.map((level) => <SelectItem key={level} value={level}>{displayDatabaseValue(level)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>
      {loading ? <LoadingMessage>Loading AI assessments…</LoadingMessage> : error ? <ErrorMessage message={error} /> : assessments.length === 0 ? (
        <EmptyState icon={BrainCircuit} title="No assessments available" description="No AI assessment records are currently available." />
      ) : rows.length ? <div className="space-y-4">
        {rows.map((assessment) => {
          const exception = exceptionById.get(assessment.exception_id);
          const shipment = exception ? shipmentById.get(exception.shipment_id) : undefined;
          const extras = assessmentExtras(assessment.raw_response);
          return (
            <Card key={assessment.id} className="surface-card border-border/80 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs font-medium text-primary">{assessment.id}</span>
                    <span className="text-xs text-muted-foreground">· {formatShortDateTime(assessment.created_at)}</span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold text-foreground">{exception?.title ?? 'Exception unavailable'}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Exception {exception?.id ?? assessment.exception_id}
                    {shipment ? ` · Shipment ${shipment.shipment_number}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={assessmentTone(assessment.risk_level)}>{displayDatabaseValue(assessment.risk_level)}</StatusBadge>
                  {assessment.risk_score !== null && <span className="text-xs tabular-nums text-muted-foreground">Score {formatNumber(assessment.risk_score)}</span>}
                </div>
              </div>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">{assessment.summary}</p>
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {assessment.recommended_action && <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended action</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{assessment.recommended_action}</p>
                </div>}
                {assessment.model_name && <p className="text-xs text-muted-foreground">Model: {assessment.model_name}</p>}
                {extras.businessImpact && <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business impact</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{extras.businessImpact}</p>
                </div>}
                {extras.recommendedActions && <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional recommended actions</p>
                  <ul className="mt-2 space-y-2">{extras.recommendedActions.map((action, index) => <li key={`${assessment.id}-action-${index}`} className="flex gap-2 text-sm leading-relaxed text-muted-foreground"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{action}</li>)}</ul>
                </div>}
                {extras.dataGaps && <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data gaps</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">{extras.dataGaps.map((gap, index) => <li key={`${assessment.id}-gap-${index}`}>{gap}</li>)}</ul>
                </div>}
              </div>
              {exception && <div className="mt-4 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => openException(exception.id)} className="gap-1.5 px-0 text-primary hover:text-primary">
                  Open exception <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>}
            </Card>
          );
        })}
      </div> : <EmptyState icon={BrainCircuit} title="No assessments found" description="Try a different search or risk level." />}
    </div>
  );
}

export function ManagerSuppliersPage() {
  const { data: suppliers, loading, error } = useRemoteData(getManagerSuppliers);
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const rows = (suppliers ?? []).filter((supplier) =>
    [supplier.company_name, supplier.contact_name, supplier.email, supplier.phone, supplier.address]
      .some((value) => value?.toLowerCase().includes(term) ?? false));

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Supplier directory and contact information." actions={!loading && !error ? <span className="text-sm text-muted-foreground">{rows.length} suppliers</span> : undefined} />
      <Card className="surface-card border-border/80 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search supplier, contact, or category" /></Card>
      {loading ? <LoadingMessage>Loading suppliers…</LoadingMessage> : error ? <ErrorMessage message={error} /> : rows.length ? <Card className="surface-card overflow-hidden border-border/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead className="pl-5">Supplier</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead className="pr-5" /></TableRow></TableHeader>
            <TableBody>{rows.map((supplier) => <TableRow key={supplier.id} className="cursor-pointer border-border hover:bg-accent/40" onClick={() => navigate(`/manager/suppliers/${supplier.id}`)}>
              <TableCell className="pl-5"><p className="font-medium text-foreground">{supplier.company_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{supplier.contact_name ?? '—'}</p></TableCell>
              <TableCell className="text-sm text-muted-foreground">{supplier.email ?? '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{supplier.phone ?? '—'}</TableCell>
              <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{supplier.address ?? '—'}</TableCell>
              <TableCell className="pr-5"><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </div>
      </Card> : <EmptyState icon={Building2} title={suppliers?.length ? 'No suppliers found' : 'No suppliers available'} description={suppliers?.length ? 'Try another search term.' : 'No supplier records are currently available.'} />}
    </div>
  );
}

export function ManagerSupplierDetailPage({ id }: { id: string }) {
  const { data: suppliers, loading, error } = useRemoteData(getManagerSuppliers);
  const supplier = suppliers?.find((item) => item.id === id);
  if (loading) return <LoadingMessage>Loading supplier…</LoadingMessage>;
  if (error) return <ErrorMessage message={error} />;
  if (!supplier) return <EmptyState icon={CircleOff} title="Supplier not found" description="This supplier record does not exist." action={<Button variant="outline" onClick={() => navigate('/manager/suppliers')}>Back to suppliers</Button>} />;

  return (
    <div className="space-y-6">
      <a href="#/manager/suppliers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Suppliers</a>
      <PageHeader title={supplier.company_name} description="Supplier profile and contact information." />
      <SectionCard title="Contact information" description="Details from the supplier record">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <div className="flex gap-3"><Building2 className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">Contact</p><p className="mt-1 text-sm font-medium">{supplier.contact_name ?? '—'}</p></div></div>
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">Address</p><p className="mt-1 whitespace-pre-line text-sm font-medium">{supplier.address ?? '—'}</p></div></div>
          <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">Email</p>{supplier.email ? <a className="mt-1 block text-sm text-primary hover:underline" href={`mailto:${supplier.email}`}>{supplier.email}</a> : <p className="mt-1 text-sm">—</p>}</div></div>
          <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs text-muted-foreground">Phone</p>{supplier.phone ? <a className="mt-1 block text-sm text-primary hover:underline" href={`tel:${supplier.phone}`}>{supplier.phone}</a> : <p className="mt-1 text-sm">—</p>}</div></div>
        </div>
      </SectionCard>
    </div>
  );
}

export function ManagerInventoryPage() {
  const [data, setData] = useState<{
    inventoryLevels: InventoryLevelRow[];
    products: ProductRow[];
    warehouses: WarehouseRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [warehouseId, setWarehouseId] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const inventoryLevels = data?.inventoryLevels ?? EMPTY_INVENTORY_LEVELS;
  const products = data?.products ?? EMPTY_PRODUCTS;
  const warehouses = data?.warehouses ?? EMPTY_WAREHOUSES;
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const warehouseById = useMemo(() => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse])), [warehouses]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      getManagerInventoryLevels(),
      getManagerProducts(),
      getManagerWarehouses(),
    ])
      .then(([inventoryLevels, loadedProducts, loadedWarehouses]) => {
        if (active) setData({ inventoryLevels, products: loadedProducts, warehouses: loadedWarehouses });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load inventory. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const warehouseOptions = useMemo(() => {
    const assignedIds = new Set(inventoryLevels.map((level) => level.warehouse_id));
    return warehouses.filter((warehouse) => assignedIds.has(warehouse.id));
  }, [inventoryLevels, warehouses]);

  const getMetrics = (level: InventoryLevelRow) => {
    const availableStock = Number.isFinite(level.quantity_on_hand) && Number.isFinite(level.quantity_reserved)
      ? level.quantity_on_hand - level.quantity_reserved
      : null;
    const coverageDays = availableStock !== null && Number.isFinite(level.avg_daily_demand) && level.avg_daily_demand > 0
      ? availableStock / level.avg_daily_demand
      : null;
    const reorderRequired = availableStock !== null && Number.isFinite(level.reorder_point)
      ? availableStock <= level.reorder_point
      : null;
    return { availableStock, coverageDays, reorderRequired };
  };

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return inventoryLevels
      .filter((level) => {
        const product = productById.get(level.product_id);
        const warehouse = warehouseById.get(level.warehouse_id);
        const { reorderRequired } = getMetrics(level);
        const searchable = [
          product?.sku ?? '',
          product?.name ?? '',
          product?.category ?? '',
          product?.unit_of_measure ?? '',
          warehouse?.name ?? '',
          warehouse?.location ?? '',
          warehouse?.address ?? '',
        ];
        return (term === '' || searchable.some((value) => value.toLowerCase().includes(term))) &&
          (warehouseId === 'all' || level.warehouse_id === warehouseId) &&
          (stockFilter === 'all' || (stockFilter === 'reorder_required' ? reorderRequired === true : reorderRequired === false));
      })
      .sort((a, b) => {
        const aNeedsReorder = getMetrics(a).reorderRequired === true;
        const bNeedsReorder = getMetrics(b).reorderRequired === true;
        return Number(bNeedsReorder) - Number(aNeedsReorder) ||
          (productById.get(a.product_id)?.name ?? '').localeCompare(productById.get(b.product_id)?.name ?? '');
      });
  }, [inventoryLevels, productById, query, stockFilter, warehouseById, warehouseId]);

  const reorderCount = inventoryLevels.filter((level) => getMetrics(level).reorderRequired === true).length;
  const unavailableCoverageCount = inventoryLevels.filter((level) => getMetrics(level).coverageDays === null).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Current inventory quantities, demand coverage, and reorder thresholds by warehouse."
        actions={!loading && !error ? <span className="text-sm text-muted-foreground">{reorderCount} records require reorder</span> : undefined}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="surface-card p-4"><p className="text-xs text-muted-foreground">Inventory records</p><p className="mt-1 text-2xl font-semibold">{loading || error ? '—' : inventoryLevels.length}</p></Card>
        <Card className="surface-card p-4"><p className="text-xs text-muted-foreground">Reorder required</p><p className="mt-1 text-2xl font-semibold text-amber-300">{loading || error ? '—' : reorderCount}</p></Card>
        <Card className="surface-card p-4"><p className="text-xs text-muted-foreground">Coverage unavailable</p><p className="mt-1 text-2xl font-semibold text-muted-foreground">{loading || error ? '—' : unavailableCoverageCount}</p></Card>
      </div>
      <Card className="surface-card border-border/80 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_200px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search product, SKU, or warehouse" />
          <Select value={warehouseId} onValueChange={setWarehouseId}><SelectTrigger aria-label="Filter warehouse" className="border-border bg-background/60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All warehouses</SelectItem>{warehouseOptions.map((warehouse) => <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>)}</SelectContent></Select>
          <Select value={stockFilter} onValueChange={setStockFilter}><SelectTrigger aria-label="Filter reorder status" className="border-border bg-background/60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All reorder status</SelectItem><SelectItem value="reorder_required">Reorder required</SelectItem><SelectItem value="sufficient">Stock sufficient</SelectItem></SelectContent></Select>
        </div>
      </Card>
      <SectionCard title="Warehouses" description="Warehouse locations from the operations database">
        {loading ? <LoadingMessage>Loading warehouses…</LoadingMessage> : error ? <ErrorMessage message={error} /> : warehouses.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Location</TableHead><TableHead>Address</TableHead></TableRow></TableHeader>
              <TableBody>{warehouses.map((warehouse) => <WarehouseTableRow key={warehouse.id} warehouse={warehouse} />)}</TableBody>
            </Table>
          </div>
        ) : <p className="text-sm text-muted-foreground">No warehouse records are currently available.</p>}
      </SectionCard>
      <Card className="surface-card overflow-hidden border-border/80">
        {loading ? <LoadingMessage>Loading inventory…</LoadingMessage> : error ? <ErrorMessage message={error} /> : inventoryLevels.length === 0 ? (
          <EmptyState icon={Boxes} title="No inventory records available" description="No inventory level records are currently available." />
        ) : rows.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead className="pl-5">Product</TableHead><TableHead>Warehouse</TableHead><TableHead>On hand</TableHead><TableHead>Reserved</TableHead><TableHead>Available</TableHead><TableHead>Reorder point</TableHead><TableHead>Avg. daily demand</TableHead><TableHead>Lead time</TableHead><TableHead>Coverage</TableHead><TableHead>Updated</TableHead><TableHead className="pr-5">Status</TableHead></TableRow></TableHeader><TableBody>{rows.map((level) => {
          const product = productById.get(level.product_id);
          const warehouse = warehouseById.get(level.warehouse_id);
          const { availableStock, coverageDays, reorderRequired } = getMetrics(level);
          return <TableRow key={level.id} className="border-border">
            <TableCell className="pl-5"><p className="max-w-[260px] truncate text-sm font-medium text-foreground">{product?.name ?? 'Product unavailable'}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{product?.sku ?? 'SKU unavailable'}</p><p className="mt-0.5 text-xs text-muted-foreground">{product?.category ?? '—'}{product?.unit_of_measure ? ` · ${product.unit_of_measure}` : ''}</p></TableCell>
            <TableCell className="text-sm text-muted-foreground">{warehouse?.name ?? 'Warehouse unavailable'}{warehouse?.location ? <p className="text-xs">{warehouse.location}</p> : null}</TableCell>
            <TableCell className="tabular-nums">{Number.isFinite(level.quantity_on_hand) ? formatNumber(level.quantity_on_hand) : '—'}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{Number.isFinite(level.quantity_reserved) ? formatNumber(level.quantity_reserved) : '—'}</TableCell>
            <TableCell className="font-medium tabular-nums">{availableStock === null ? '—' : formatNumber(availableStock)}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{Number.isFinite(level.reorder_point) ? formatNumber(level.reorder_point) : '—'}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{Number.isFinite(level.avg_daily_demand) ? formatNumber(level.avg_daily_demand) : '—'}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{Number.isFinite(level.lead_time_days) ? `${formatNumber(level.lead_time_days)} days` : '—'}</TableCell>
            <TableCell className="tabular-nums text-muted-foreground">{coverageDays === null || !Number.isFinite(coverageDays) ? 'Unavailable' : `${coverageDays.toFixed(1)} days`}</TableCell>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatShortDateTime(level.updated_at)}</TableCell>
            <TableCell className="pr-5">{reorderRequired === null
              ? <StatusBadge tone="neutral">Unavailable</StatusBadge>
              : <StatusBadge tone={reorderRequired ? 'warning' : 'success'}>{reorderRequired ? 'Reorder required' : 'Stock sufficient'}</StatusBadge>}</TableCell>
          </TableRow>;
        })}</TableBody></Table></div> : <EmptyState icon={Boxes} title="No inventory items found" description="Change your search or filters to see other records." />}
      </Card>
    </div>
  );
}

function WarehouseTableRow({ warehouse }: { warehouse: WarehouseRow }) {
  return (
    <TableRow className="border-border">
      <TableCell className="font-medium text-foreground">{warehouse.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{warehouse.location ?? '—'}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{warehouse.address ?? '—'}</TableCell>
    </TableRow>
  );
}

export function ManagerSettingsPage() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'notifications'>('workspace');
  const [settings, setSettings] = useState({ shipmentAlerts: true, criticalAlerts: true, supplierUpdates: true, weeklyDigest: false, compactTables: false });
  const [workspaceName, setWorkspaceName] = useState('Northstar Logistics');
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof typeof settings) {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your local workspace preferences. Changes are saved for this prototype session only." />
      <div className="flex gap-2 border-b border-border">
        {(['workspace', 'notifications'] as const).map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`border-b-2 px-3 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab}</button>)}
      </div>
      {activeTab === 'workspace' ? <SectionCard title="Workspace preferences" description="Customize how your operations workspace is presented.">
        <div className="max-w-xl space-y-5">
          <div className="space-y-2"><label htmlFor="workspace-name" className="text-sm font-medium">Workspace name</label><Input id="workspace-name" value={workspaceName} onChange={(event) => { setWorkspaceName(event.target.value); setSaved(false); }} className="border-border bg-background/60" /></div>
          <PreferenceRow title="Compact tables" description="Reduce table row height to show more records at once." checked={settings.compactTables} onChange={() => toggle('compactTables')} />
          <Button onClick={() => setSaved(true)} disabled={!workspaceName.trim()}>{saved ? 'Preferences saved' : 'Save preferences'}</Button>
          {saved && <p role="status" className="text-xs text-emerald-300">Preferences saved for this session.</p>}
        </div>
      </SectionCard> : <SectionCard title="Notification preferences" description="Choose which operational events appear in your workspace alerts.">
        <div className="max-w-2xl divide-y divide-border">
          <PreferenceRow title="Shipment alerts" description="Updates to arrival times and shipment status." checked={settings.shipmentAlerts} onChange={() => toggle('shipmentAlerts')} />
          <PreferenceRow title="Critical exceptions" description="Immediate notification for critical-risk exceptions." checked={settings.criticalAlerts} onChange={() => toggle('criticalAlerts')} />
          <PreferenceRow title="Supplier updates" description="New shipment notes submitted by supplier partners." checked={settings.supplierUpdates} onChange={() => toggle('supplierUpdates')} />
          <PreferenceRow title="Weekly operations digest" description="A weekly summary of inbound activity and outstanding issues." checked={settings.weeklyDigest} onChange={() => toggle('weeklyDigest')} />
          <div className="pt-5"><Button onClick={() => setSaved(true)}>{saved ? 'Preferences saved' : 'Save preferences'}</Button>{saved && <p role="status" className="mt-2 text-xs text-emerald-300">Preferences saved for this session.</p>}</div>
        </div>
      </SectionCard>}
      <Card className="surface-card flex items-start gap-3 p-4"><SlidersHorizontal className="mt-0.5 h-4 w-4 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">Settings are stored in memory only. Authentication, account recovery, and persistent preference storage are intentionally outside this prototype.</p></Card>
    </div>
  );
}

function PreferenceRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: () => void }) {
  return <div className="flex items-center justify-between gap-4 py-4">
    <div><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>
    <button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>;
}
