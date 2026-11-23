import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleOff, ClipboardCheck, LoaderCircle } from 'lucide-react';

import { InfoItem } from '@/components/common/InfoItem';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { navigate } from '@/lib/router';
import { formatDateTime, formatNumber } from '@/lib/format';
import {
  acknowledgeManagerException,
  getManagerAiAssessments,
  getManagerExceptions,
  getManagerShipments,
  getManagerSuppliers,
  resolveManagerException,
} from '@/services/logisticsDataService';
import type {
  AiAssessmentRow,
  ExceptionRow,
  Json,
  ShipmentRow,
  SupplierRow,
} from '@/types/database';

interface ExceptionDetailData {
  exception: ExceptionRow;
  shipment: ShipmentRow | undefined;
  supplier: SupplierRow | undefined;
  assessments: AiAssessmentRow[];
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'notFound' }
  | { status: 'ready'; data: ExceptionDetailData };

interface AssessmentExtras {
  businessImpact?: string;
  recommendedActions?: string[];
  dataGaps?: string[];
  supplierCommunication?: {
    channel?: string;
    subject?: string;
    body?: string;
  };
}

function displayValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function riskTone(value: string) {
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

function statusTone(value: string) {
  if (value.toLowerCase() === 'resolved') return 'success' as const;
  if (value.toLowerCase() === 'open') return 'warning' as const;
  return 'info' as const;
}

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(record: { [key: string]: Json | undefined }, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function getStringArray(record: { [key: string]: Json | undefined }, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (strings.length) return strings;
    }
  }
  return undefined;
}

function parseAssessmentExtras(raw: Json | null): AssessmentExtras {
  if (!isRecord(raw)) return {};

  const extras: AssessmentExtras = {
    businessImpact: getString(raw, ['business_impact', 'businessImpact']),
    recommendedActions: getStringArray(raw, ['recommended_actions', 'recommendedActions']),
    dataGaps: getStringArray(raw, ['data_gaps', 'dataGaps']),
  };

  const communicationValue = raw.supplier_communication ?? raw.supplierCommunication;
  if (isRecord(communicationValue)) {
    const channel = getString(communicationValue, ['channel']);
    const subject = getString(communicationValue, ['subject']);
    const body = getString(communicationValue, ['body', 'message']);
    if (channel || subject || body) {
      extras.supplierCommunication = { channel, subject, body };
    }
  }

  return extras;
}

export function ExceptionDetailPage({ id }: { id: string }) {
  const [state, setState] = useState<DetailState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });

    async function load() {
      try {
        const [exceptions, shipments, suppliers, assessments] = await Promise.all([
          getManagerExceptions(),
          getManagerShipments(),
          getManagerSuppliers(),
          getManagerAiAssessments(),
        ]);
        if (!active) return;

        const exception = exceptions.find((item) => item.id === id);
        if (!exception) {
          setState({ status: 'notFound' });
          return;
        }

        const shipment = shipments.find((item) => item.id === exception.shipment_id);
        setState({
          status: 'ready',
          data: {
            exception,
            shipment,
            supplier: shipment ? suppliers.find((item) => item.id === shipment.supplier_id) : undefined,
            assessments: assessments.filter((item) => item.exception_id === exception.id)
              .sort((a, b) => b.created_at.localeCompare(a.created_at)),
          },
        });
      } catch (cause) {
        if (active) {
          setState({
            status: 'error',
            message: cause instanceof Error ? cause.message : 'Could not load exception details. Please try again.',
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
    return (
      <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading exception…
      </div>
    );
  }
  if (state.status === 'error') {
    return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{state.message}</div>;
  }
  if (state.status === 'notFound') {
    return (
      <div className="space-y-5">
        <Button variant="ghost" onClick={() => navigate('/manager/exceptions')} className="gap-2"><ArrowLeft className="h-4 w-4" /> Exceptions</Button>
        <Card className="surface-card p-8 text-center">
          <CircleOff className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Exception not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">No exception record exists for this reference.</p>
        </Card>
      </div>
    );
  }

  return <ExceptionDetailContent data={state.data} />;
}

function ExceptionDetailContent({ data }: { data: ExceptionDetailData }) {
  const { shipment, supplier, assessments } = data;
  const [exception, setException] = useState(data.exception);
  const [actionInProgress, setActionInProgress] = useState<'acknowledge' | 'resolve' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const actionLock = useRef(false);
  const resolved = exception.status.toLowerCase() === 'resolved';
  const acknowledged = exception.status.toLowerCase() !== 'open';

  useEffect(() => {
    setException(data.exception);
  }, [data.exception]);

  async function updateException(action: 'acknowledge' | 'resolve') {
    if (actionLock.current || resolved) return;
    actionLock.current = true;
    setActionInProgress(action);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = action === 'acknowledge'
        ? await acknowledgeManagerException(exception.id)
        : await resolveManagerException(exception.id);
      setException(updated);
      setActionSuccess(action === 'acknowledge' ? 'Exception acknowledged.' : 'Exception resolved.');
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Could not update the exception. Please try again.');
    } finally {
      actionLock.current = false;
      setActionInProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <a href="#/manager/exceptions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Exceptions
      </a>

      <PageHeader
        eyebrow={`${displayValue(exception.exception_type)} · ${formatDateTime(exception.detected_at)}`}
        title={exception.title}
        description={exception.description ?? 'No description is available for this exception.'}
        actions={
          <div className="flex gap-2">
            <StatusBadge tone={riskTone(exception.severity)}>{displayValue(exception.severity)}</StatusBadge>
            <StatusBadge tone={statusTone(exception.status)}>{displayValue(exception.status)}</StatusBadge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.9fr)]">
        <div className="space-y-6">
          <SectionCard title="Related shipment" description={supplier?.company_name ?? 'Supplier unavailable'}>
            {shipment ? (
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <InfoItem label="Shipment number">
                  <a href={`#/manager/shipments/${shipment.id}`} className="font-mono text-primary hover:underline">{shipment.shipment_number}</a>
                </InfoItem>
                <InfoItem label="Shipment status"><StatusBadge tone={statusTone(shipment.status)}>{displayValue(shipment.status)}</StatusBadge></InfoItem>
                <InfoItem label="Carrier">{shipment.carrier_name ?? '—'}</InfoItem>
                <InfoItem label="Tracking number"><span className="font-mono">{shipment.tracking_number ?? '—'}</span></InfoItem>
                <InfoItem label="Expected arrival">{shipment.expected_arrival_at ? formatDateTime(shipment.expected_arrival_at) : '—'}</InfoItem>
                <InfoItem label="Supplier contact">{supplier?.contact_name ?? '—'}</InfoItem>
              </dl>
            ) : <p className="text-sm text-muted-foreground">The related shipment record is unavailable.</p>}
          </SectionCard>

          <SectionCard title="Exception information" description="Details from the exception record">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <InfoItem label="Estimated exposure">{exception.estimated_exposure === null ? '—' : formatNumber(exception.estimated_exposure)}</InfoItem>
              <InfoItem label="Assigned to">{exception.assigned_to ?? '—'}</InfoItem>
              <InfoItem label="Detected at">{formatDateTime(exception.detected_at)}</InfoItem>
              <InfoItem label="Resolved at">{exception.resolved_at ? formatDateTime(exception.resolved_at) : '—'}</InfoItem>
            </dl>
          </SectionCard>

          <SectionCard title="AI risk assessment" description="Assessments associated with this exception">
            {assessments.length ? (
              <div className="space-y-4">
                {assessments.map((assessment) => {
                  const extras = parseAssessmentExtras(assessment.raw_response);
                  return (
                    <Card key={assessment.id} className="border-border bg-background/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge tone={riskTone(assessment.risk_level)}>{displayValue(assessment.risk_level)}</StatusBadge>
                          {assessment.risk_score !== null && <span className="text-xs text-muted-foreground">Score {formatNumber(assessment.risk_score)}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDateTime(assessment.created_at)}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{assessment.summary}</p>
                      {assessment.recommended_action && (
                        <p className="mt-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Recommended action: </span>{assessment.recommended_action}</p>
                      )}
                      {assessment.model_name && <p className="mt-2 text-xs text-muted-foreground">Model: {assessment.model_name}</p>}
                      {extras.businessImpact && (
                        <div className="mt-4 rounded-lg border border-border bg-card p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Business impact</p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{extras.businessImpact}</p>
                        </div>
                      )}
                      {extras.recommendedActions && (
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Additional recommended actions</p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {extras.recommendedActions.map((action, index) => <li key={`${assessment.id}-action-${index}`}>{action}</li>)}
                          </ul>
                        </div>
                      )}
                      {extras.dataGaps && (
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data gaps</p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {extras.dataGaps.map((gap, index) => <li key={`${assessment.id}-gap-${index}`}>{gap}</li>)}
                          </ul>
                        </div>
                      )}
                      {extras.supplierCommunication && (
                        <div className="mt-4 rounded-lg border border-border bg-card p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Supplier communication</p>
                          {extras.supplierCommunication.channel && <p className="mt-2 text-sm text-foreground">Channel: {extras.supplierCommunication.channel}</p>}
                          {extras.supplierCommunication.subject && <p className="mt-2 text-sm font-medium text-foreground">{extras.supplierCommunication.subject}</p>}
                          {extras.supplierCommunication.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{extras.supplierCommunication.body}</p>}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground">No AI assessment is linked to this exception.</p>}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Manager actions" description="Persistent exception updates">
            {resolved ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-foreground">
                This exception was resolved{exception.resolved_at ? ` on ${formatDateTime(exception.resolved_at)}` : ''}.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Update the exception status. Changes are saved to the operations database.</p>
                {actionError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
                {actionSuccess && <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">{actionSuccess}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionInProgress !== null || acknowledged}
                    onClick={() => void updateException('acknowledge')}
                    className="gap-2"
                  >
                    {actionInProgress === 'acknowledge' ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ClipboardCheck className="h-4 w-4" />}
                    {actionInProgress === 'acknowledge' ? 'Saving…' : acknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionInProgress !== null}
                    onClick={() => void updateException('resolve')}
                  >
                    {actionInProgress === 'resolve' && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    {actionInProgress === 'resolve' ? 'Saving…' : 'Resolve exception'}
                  </Button>
                </div>
              </div>
            )}
          </SectionCard>

          <Card className="surface-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exception record</p>
            <p className="mt-2 break-all font-mono text-sm text-foreground">{exception.id}</p>
            <p className="mt-2 text-xs text-muted-foreground">Last updated {formatDateTime(exception.updated_at)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
