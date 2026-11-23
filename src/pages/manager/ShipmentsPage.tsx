import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, PackageSearch } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/format';
import { navigate } from '@/lib/router';
import {
  getManagerShipments,
  getManagerSuppliers,
  getManagerWarehouses,
} from '@/services/logisticsDataService';
import type { ShipmentRow, SupplierRow, WarehouseRow } from '@/types/database';

function displayValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shipmentTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('delay') || normalized.includes('hold') || normalized.includes('cancel')) return 'danger' as const;
  if (normalized.includes('received') || normalized.includes('complete')) return 'success' as const;
  if (normalized.includes('transit') || normalized.includes('dispatch')) return 'info' as const;
  return 'neutral' as const;
}

function LoadingState() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      Loading shipments…
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message}</div>;
}

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([getManagerShipments(), getManagerSuppliers(), getManagerWarehouses()])
      .then(([shipmentRows, supplierRows, warehouseRows]) => {
        if (!active) return;
        setShipments(shipmentRows);
        setSuppliers(supplierRows);
        setWarehouses(warehouseRows);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load shipments. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const supplierById = useMemo(() => new Map(suppliers.map((item) => [item.id, item])), [suppliers]);
  const warehouseById = useMemo(() => new Map(warehouses.map((item) => [item.id, item])), [warehouses]);
  const statuses = useMemo(() => [...new Set(shipments.map((item) => item.status))].sort(), [shipments]);
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return shipments
      .filter((item) => {
        const supplier = supplierById.get(item.supplier_id);
        const warehouse = warehouseById.get(item.warehouse_id);
        const searchable = [
          item.shipment_number,
          item.tracking_number ?? '',
          supplier?.company_name ?? '',
          supplier?.contact_name ?? '',
          supplier?.email ?? '',
          warehouse?.name ?? '',
          warehouse?.location ?? '',
          item.carrier_name ?? '',
          item.transport_mode ?? '',
        ];
        return (term === '' || searchable.some((field) => field.toLowerCase().includes(term))) &&
          (status === 'all' || item.status === status);
      })
      .sort((a, b) => (a.expected_arrival_at ?? '').localeCompare(b.expected_arrival_at ?? ''));
  }, [query, shipments, status, supplierById, warehouseById]);

  function resetFilters() {
    setQuery('');
    setStatus('all');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbound shipments"
        description="Track inbound shipments using their current database records."
        actions={!loading && !error ? <span className="text-sm text-muted-foreground">{rows.length} of {shipments.length} shipments</span> : undefined}
      />

      <Card className="surface-card border-border/80 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search shipment, tracking, supplier, warehouse, carrier"
            className="lg:max-w-md lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-3 lg:ml-auto lg:flex lg:w-auto">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full border-border bg-background/60 lg:w-44" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((value) => <SelectItem key={value} value={value}>{displayValue(value)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(query !== '' || status !== 'all') && (
              <Button variant="ghost" className="col-span-2 h-9 lg:col-span-1" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : shipments.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No shipments available" description="No shipment records are currently available." />
      ) : rows.length === 0 ? (
        <Card className="surface-card overflow-hidden border-border/80">
          <EmptyState
            icon={PackageSearch}
            title="No shipments match these filters"
            description="Try a different search or status."
            action={<Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <Card className="surface-card overflow-hidden border-border/80">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="pl-5">Shipment</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Expected arrival</TableHead>
                  <TableHead>Actual arrival</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead className="pr-5">Transport mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    onClick={() => navigate(`/manager/shipments/${shipment.id}`)}
                    className="cursor-pointer border-border transition-colors hover:bg-accent/40"
                  >
                    <TableCell className="pl-5">
                      <a
                        href={`#/manager/shipments/${shipment.id}`}
                        className="font-mono text-sm font-medium text-foreground hover:text-primary"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {shipment.shipment_number}
                      </a>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{shipment.tracking_number ?? '—'}</TableCell>
                    <TableCell className="text-sm text-foreground">{supplierById.get(shipment.supplier_id)?.company_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{warehouseById.get(shipment.warehouse_id)?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums">{shipment.expected_arrival_at ? formatDateTime(shipment.expected_arrival_at) : '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums">{shipment.actual_arrival_at ? formatDateTime(shipment.actual_arrival_at) : '—'}</TableCell>
                    <TableCell><StatusBadge tone={shipmentTone(shipment.status)}>{displayValue(shipment.status)}</StatusBadge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{shipment.carrier_name ?? '—'}</TableCell>
                    <TableCell className="pr-5 text-sm text-muted-foreground">{shipment.transport_mode ? displayValue(shipment.transport_mode) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
