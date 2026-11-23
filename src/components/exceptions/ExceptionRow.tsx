import { ChevronRight } from 'lucide-react';

import { RiskBadge } from '@/components/common/RiskBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { exceptionStatusMeta, exceptionTypeMeta, riskLevelMeta } from '@/lib/status';
import { formatShortDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Exception, Shipment } from '@/types/logistics';

interface ExceptionRowProps {
  exception: Exception;
  shipment?: Shipment;
  supplierName?: string;
}

export function ExceptionRow({ exception, shipment, supplierName }: ExceptionRowProps) {
  return (
    <a
      href={`#/manager/exceptions/${exception.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/50"
    >
      <span className={cn('h-11 w-1 shrink-0 rounded-full', riskLevelMeta[exception.severity].color)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{exception.id}</span>
          <span aria-hidden="true">·</span>
          <span>{exceptionTypeMeta[exception.type]}</span>
          <span aria-hidden="true">·</span>
          <span>{formatShortDateTime(exception.detectedAt)}</span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">{exception.title}</p>
        {(shipment || supplierName) && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[shipment?.id, supplierName].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <RiskBadge level={exception.severity} />
        <StatusBadge tone={exceptionStatusMeta[exception.status].tone} showDot={false} className="hidden sm:inline-flex">
          {exceptionStatusMeta[exception.status].label}
        </StatusBadge>
      </div>
      <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" aria-hidden="true" />
    </a>
  );
}
