import { Radar } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/30">
        <Radar className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight text-foreground">LogiGuard AI</p>
        {showTagline && <p className="text-xs text-muted-foreground">Northstar Logistics</p>}
      </div>
    </div>
  );
}
