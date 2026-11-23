import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/status';

const iconToneStyles: Record<Tone, string> = {
  neutral: 'bg-slate-500/10 text-slate-300',
  info: 'bg-sky-500/10 text-sky-300',
  accent: 'bg-teal-400/10 text-teal-300',
  success: 'bg-emerald-500/10 text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-300',
  orange: 'bg-orange-500/10 text-orange-300',
  danger: 'bg-rose-500/10 text-rose-300',
};

interface MetricCardProps {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone?: Tone;
}

export function MetricCard({ label, value, hint, icon: Icon, tone = 'accent' }: MetricCardProps) {
  return (
    <Card className="surface-card border-border/80 p-5 transition-colors hover:border-slate-600">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconToneStyles[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}
