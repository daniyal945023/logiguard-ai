import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface InfoItemProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function InfoItem({ label, children, className }: InfoItemProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}
