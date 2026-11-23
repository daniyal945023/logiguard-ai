import type { ReactNode } from 'react';

import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  meta?: string;
  badge?: ReactNode;
  tone?: 'default' | 'accent' | 'danger';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const dotStyles = {
  default: 'bg-slate-500 ring-slate-700',
  accent: 'bg-primary ring-primary/30',
  danger: 'bg-rose-400 ring-rose-400/30',
};

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < items.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-border" aria-hidden="true" />}
          <span
            className={cn('relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-card', dotStyles[item.tone ?? 'default'])}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.badge}
            </div>
            {item.description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatDateTime(item.timestamp)}
              {item.meta && <span> · {item.meta}</span>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
