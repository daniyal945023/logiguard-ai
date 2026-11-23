import { cn } from '@/lib/utils';
import { riskLevelMeta } from '@/lib/status';
import type { RiskLevel } from '@/types/logistics';

import { StatusBadge } from './StatusBadge';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
}

export function RiskBadge({ level, score, className }: RiskBadgeProps) {
  const meta = riskLevelMeta[level];
  return (
    <StatusBadge tone={meta.tone} className={cn(className)}>
      {meta.label}
      {score !== undefined && <span className="tabular-nums opacity-70">{score}</span>}
    </StatusBadge>
  );
}

interface RiskScoreMeterProps {
  score: number;
  level: RiskLevel;
  className?: string;
}

export function RiskScoreMeter({ score, level, className }: RiskScoreMeterProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', riskLevelMeta[level].color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums text-foreground">{score}</span>
    </div>
  );
}
