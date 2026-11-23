import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ChevronRight, LoaderCircle, Plus, ShieldCheck } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime, formatNumber } from '@/lib/format';
import { navigate } from '@/lib/router';
import { exceptionTypeMeta, riskLevelMeta } from '@/lib/status';
import { createManagerException, getManagerExceptions, getManagerShipments } from '@/services/logisticsDataService';
import type { ExceptionRow, ShipmentRow } from '@/types/database';
import type { ExceptionType, RiskLevel } from '@/types/logistics';

type ExceptionData = {
  exceptions: ExceptionRow[];
  shipments: ShipmentRow[];
};

const EMPTY_EXCEPTIONS: ExceptionRow[] = [];
const EMPTY_SHIPMENTS: ShipmentRow[] = [];
const EXCEPTION_TYPES = Object.entries(exceptionTypeMeta) as [ExceptionType, string][];
const SEVERITIES = Object.entries(riskLevelMeta) as [RiskLevel, (typeof riskLevelMeta)[RiskLevel]][];

function displayValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function severityTone(value: string) {
  switch (value.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'danger' as const;
    case 'medium':
      return 'warning' as const;
    case 'low':
      return 'info' as const;
    default:
      return 'neutral' as const;
  }
}

function statusTone(value: string) {
  if (value.toLowerCase() === 'resolved') return 'success' as const;
  if (value.toLowerCase() === 'open') return 'warning' as const;
  return 'info' as const;
}

export function ExceptionsPage() {
  const [data, setData] = useState<ExceptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [type, setType] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shipmentId, setShipmentId] = useState('');
  const [exceptionType, setExceptionType] = useState<ExceptionType | ''>('');
  const [newSeverity, setNewSeverity] = useState<RiskLevel | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedExposure, setEstimatedExposure] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([getManagerExceptions(), getManagerShipments()])
      .then(([exceptions, shipments]) => {
        if (active) setData({ exceptions, shipments });
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load exceptions. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const shipments = data?.shipments ?? EMPTY_SHIPMENTS;
  const exceptions = data?.exceptions ?? EMPTY_EXCEPTIONS;
  const shipmentById = useMemo(() => new Map(shipments.map((shipment) => [shipment.id, shipment])), [shipments]);
  const statuses = useMemo(() => [...new Set(exceptions.map((exception) => exception.status))].sort(), [exceptions]);
  const severities = useMemo(() => [...new Set(exceptions.map((exception) => exception.severity))].sort(), [exceptions]);
  const types = useMemo(() => [...new Set(exceptions.map((exception) => exception.exception_type))].sort(), [exceptions]);
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return exceptions
      .filter((exception) => {
        const shipment = shipmentById.get(exception.shipment_id);
        const searchable = [
          exception.title,
          exception.description ?? '',
          exception.exception_type,
          exception.id,
          shipment?.shipment_number ?? '',
        ];
        return (term === '' || searchable.some((field) => field.toLowerCase().includes(term))) &&
          (status === 'all' || exception.status === status) &&
          (severity === 'all' || exception.severity === severity) &&
          (type === 'all' || exception.exception_type === type);
      })
      .sort((a, b) => {
        const aResolved = a.status.toLowerCase() === 'resolved';
        const bResolved = b.status.toLowerCase() === 'resolved';
        return Number(aResolved) - Number(bResolved) || b.detected_at.localeCompare(a.detected_at);
      });
  }, [exceptions, query, severity, shipmentById, status, type]);

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setSeverity('all');
    setType('all');
  }

  function resetForm() {
    setShipmentId('');
    setExceptionType('');
    setNewSeverity('');
    setTitle('');
    setDescription('');
    setEstimatedExposure('');
    setSubmissionError(null);
  }

  async function handleRaiseException(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;

    if (!shipmentId || !exceptionType || !newSeverity || !title.trim()) {
      setSubmissionError('Select a shipment, exception type, and severity, and enter a title.');
      return;
    }

    let parsedExposure: number | undefined;
    if (estimatedExposure.trim()) {
      parsedExposure = Number(estimatedExposure);
      if (!Number.isFinite(parsedExposure) || parsedExposure < 0) {
        setSubmissionError('Estimated exposure must be a non-negative number.');
        return;
      }
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      await createManagerException({
        shipmentId,
        exceptionType,
        severity: newSeverity,
        title,
        description,
        estimatedExposure: parsedExposure,
      });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Exception raised', description: 'The exception was added to the operations database.' });
      setRefreshKey((current) => current + 1);
    } catch (cause) {
      setSubmissionError(cause instanceof Error ? cause.message : 'Could not raise the exception. Please try again.');
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  const hasFilters = query !== '' || status !== 'all' || severity !== 'all' || type !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exceptions"
        description="Operational issues requiring review across inbound shipments."
        actions={<>
          {!loading && !error && <span className="text-sm text-muted-foreground">{rows.length} of {exceptions.length} exceptions</span>}
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} disabled={loading || shipments.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> Raise Exception
          </Button>
        </>}
      />

      <Card className="surface-card border-border/80 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, description, or shipment number" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 border-border bg-background/60" aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((value) => <SelectItem key={value} value={value}>{displayValue(value)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="h-9 border-border bg-background/60" aria-label="Filter by severity"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All severities</SelectItem>{severities.map((value) => <SelectItem key={value} value={value}>{displayValue(value)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 border-border bg-background/60" aria-label="Filter by type"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All types</SelectItem>{types.map((value) => <SelectItem key={value} value={value}>{displayValue(value)}</SelectItem>)}</SelectContent>
          </Select>
          {hasFilters && <Button variant="ghost" className="h-9" onClick={resetFilters}>Reset</Button>}
        </div>
      </Card>

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading exceptions…
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : exceptions.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No exceptions available" description="No exception records are currently available." />
      ) : rows.length === 0 ? (
        <Card className="surface-card overflow-hidden border-border/80">
          <EmptyState icon={ShieldCheck} title="No exceptions match these filters" description="Adjust the filters or clear them to see all exceptions." action={<Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>} />
        </Card>
      ) : (
        <Card className="surface-card overflow-hidden border-border/80">
          <div className="divide-y divide-border">
            {rows.map((exception) => {
              const shipment = shipmentById.get(exception.shipment_id);
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
                  <span className={`h-11 w-1 shrink-0 rounded-full ${severityTone(exception.severity) === 'danger' ? 'bg-rose-500' : severityTone(exception.severity) === 'warning' ? 'bg-amber-400' : severityTone(exception.severity) === 'info' ? 'bg-sky-400' : 'bg-slate-400'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{exception.id}</span><span aria-hidden="true">·</span>
                      <span>{displayValue(exception.exception_type)}</span><span aria-hidden="true">·</span>
                      <span>{formatDateTime(exception.detected_at)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-foreground group-hover:text-primary">{exception.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{shipment?.shipment_number ?? 'Shipment unavailable'}</p>
                    {exception.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{exception.description}</p>}
                    {exception.estimated_exposure !== null && <p className="mt-1 text-xs text-muted-foreground">Estimated exposure: {formatNumber(exception.estimated_exposure)}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge tone={severityTone(exception.severity)}>{displayValue(exception.severity)}</StatusBadge>
                    <StatusBadge tone={statusTone(exception.status)} showDot={false} className="hidden sm:inline-flex">{displayValue(exception.status)}</StatusBadge>
                  </div>
                  <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setDialogOpen(open);
          if (!open) resetForm();
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={handleRaiseException} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Raise an exception</DialogTitle>
              <DialogDescription>Report an operational issue associated with an inbound shipment.</DialogDescription>
            </DialogHeader>
            {submissionError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{submissionError}</p>}
            {shipments.length === 0 ? (
              <p role="alert" className="text-sm text-muted-foreground">No shipments are available. Load shipments before raising an exception.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="exception-shipment" className="text-sm font-medium">Shipment <span className="text-destructive">*</span></label>
                  <Select value={shipmentId} onValueChange={setShipmentId} disabled={isSubmitting}>
                    <SelectTrigger id="exception-shipment" aria-label="Shipment"><SelectValue placeholder="Select a shipment" /></SelectTrigger>
                    <SelectContent>
                      {shipments.map((shipment) => <SelectItem key={shipment.id} value={shipment.id}>{shipment.shipment_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="exception-type" className="text-sm font-medium">Exception type <span className="text-destructive">*</span></label>
                    <Select value={exceptionType} onValueChange={(value) => {
                      const selectedType = EXCEPTION_TYPES.find(([option]) => option === value);
                      if (selectedType) setExceptionType(selectedType[0]);
                    }} disabled={isSubmitting}>
                      <SelectTrigger id="exception-type" aria-label="Exception type"><SelectValue placeholder="Select a type" /></SelectTrigger>
                      <SelectContent>{EXCEPTION_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="exception-severity" className="text-sm font-medium">Severity <span className="text-destructive">*</span></label>
                    <Select value={newSeverity} onValueChange={(value) => {
                      const selectedSeverity = SEVERITIES.find(([option]) => option === value);
                      if (selectedSeverity) setNewSeverity(selectedSeverity[0]);
                    }} disabled={isSubmitting}>
                      <SelectTrigger id="exception-severity" aria-label="Severity"><SelectValue placeholder="Select severity" /></SelectTrigger>
                      <SelectContent>{SEVERITIES.map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="exception-title" className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                  <Input id="exception-title" value={title} onChange={(event) => setTitle(event.target.value)} required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="exception-description" className="text-sm font-medium">Description</label>
                  <Textarea id="exception-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="exception-exposure" className="text-sm font-medium">Estimated exposure</label>
                  <Input id="exception-exposure" type="number" min="0" step="any" inputMode="decimal" value={estimatedExposure} onChange={(event) => setEstimatedExposure(event.target.value)} disabled={isSubmitting} />
                  <p className="text-xs text-muted-foreground">Optional; enter a non-negative amount.</p>
                </div>
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || shipments.length === 0}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting…' : 'Submit exception'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
