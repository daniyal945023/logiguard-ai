import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/status';

const toneStyles: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-slate-500/10 text-slate-300 ring-slate-400/20', dot: 'bg-slate-400' },
  info: { badge: 'bg-sky-500/10 text-sky-300 ring-sky-400/25', dot: 'bg-sky-400' },
  accent: { badge: 'bg-teal-400/10 text-teal-300 ring-teal-400/25', dot: 'bg-teal-400' },
  success: { badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25', dot: 'bg-emerald-400' },
  warning: { badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/25', dot: 'bg-amber-400' },
  orange: { badge: 'bg-orange-500/10 text-orange-300 ring-orange-400/25', dot: 'bg-orange-400' },
  danger: { badge: 'bg-rose-500/10 text-rose-300 ring-rose-400/25', dot: 'bg-rose-400' },
};

interface StatusBadgeProps {
  tone: Tone;
  children: ReactNode;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ tone, children, className, showDot = true }: StatusBadgeProps) {
  const styles = toneStyles[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles.badge,
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}
