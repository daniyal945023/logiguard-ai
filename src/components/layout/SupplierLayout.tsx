import { useEffect, useState, type ReactNode } from 'react';
import { Truck } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { isPathActive, usePath } from '@/lib/router';
import { cn } from '@/lib/utils';
import { getInitials, getRoleLabel, useSession } from '@/services/session';
import { getSupplierRecord } from '@/services/logisticsDataService';

import { UserMenu } from './UserMenu';
import { supplierNavItems } from './navigation';

interface SupplierLayoutProps {
  children: ReactNode;
}

export function SupplierLayout({ children }: SupplierLayoutProps) {
  const path = usePath();
  const { profile, session, status } = useSession();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyNameError, setCompanyNameError] = useState(false);
  const accountName = profile?.full_name ?? session?.user.email ?? 'Account';

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);

  useEffect(() => {
    let active = true;
    setCompanyName(null);
    setCompanyNameError(false);
    if (profile?.role === 'supplier') {
      void getSupplierRecord()
        .then((supplier) => {
          if (active) setCompanyName(supplier.company_name);
        })
        .catch(() => {
          if (active) setCompanyNameError(true);
        });
    }

    return () => {
      active = false;
    };
  }, [profile?.id, profile?.role]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Logo showTagline />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Supplier navigation">
              {supplierNavItems.map((item) => (
                <a
                  key={item.href}
                  href={`#${item.href}`}
                  aria-current={isPathActive(path, item.href, item.exact) ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isPathActive(path, item.href, item.exact)
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span title={companyNameError ? 'Supplier company name could not be loaded' : undefined} className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground lg:inline-flex">
              <Truck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {companyName ?? 'Supplier workspace'}
            </span>
            <UserMenu
              name={accountName}
              role={profile ? getRoleLabel(profile.role) : status === 'error' ? 'Profile unavailable' : 'Loading account'}
              initials={getInitials(profile?.full_name ?? session?.user.email ?? '')}
            />
          </div>
        </div>

        <nav className="flex gap-1 border-t border-border px-4 py-2 md:hidden" aria-label="Supplier navigation mobile">
          {supplierNavItems.map((item) => (
            <a
              key={item.href}
              href={`#${item.href}`}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium',
                isPathActive(path, item.href, item.exact) ? 'bg-primary/12 text-primary' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
