import { ChevronsLeft, ChevronsRight, Menu, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { isPathActive, navigate, usePath } from '@/lib/router';
import { cn } from '@/lib/utils';
import { getManagerExceptions } from '@/services/logisticsDataService';
import { getInitials, getRoleLabel, useSession } from '@/services/session';

import { ManagerSidebar } from './ManagerSidebar';
import { UserMenu } from './UserMenu';
import { managerNavItems } from './navigation';

interface ManagerLayoutProps {
  children: ReactNode;
}

export function ManagerLayout({ children }: ManagerLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const path = usePath();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-muted transition-[width] duration-300 md:flex md:flex-col',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
        )}
      >
        <ManagerSidebar collapsed={collapsed} path={path} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-border bg-muted p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <ManagerSidebar collapsed={false} path={path} />
        </SheetContent>
      </Sheet>

      <div className={cn('transition-[padding] duration-300', collapsed ? 'md:pl-[76px]' : 'md:pl-64')}>
        <ManagerTopBar collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} onOpenMobileNav={() => setMobileOpen(true)} path={path} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

interface ManagerTopBarProps {
  collapsed: boolean;
  path: string;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

function ManagerTopBar({ collapsed, path, onToggleSidebar, onOpenMobileNav }: ManagerTopBarProps) {
  const { profile, session, status } = useSession();
  const [criticalOpen, setCriticalOpen] = useState<number | null>(null);
  const [criticalCountError, setCriticalCountError] = useState(false);
  const currentSection = managerNavItems.find((item) => isPathActive(path, item.href, item.exact));
  const accountName = profile?.full_name ?? session?.user.email ?? 'Account';

  useEffect(() => {
    let active = true;
    setCriticalOpen(null);
    setCriticalCountError(false);
    void getManagerExceptions()
      .then((exceptions) => {
        if (!active) return;
        const count = exceptions.filter((exception) =>
          exception.severity.toLowerCase() === 'critical' &&
          ['open', 'acknowledged'].includes(exception.status.toLowerCase()),
        ).length;
        setCriticalOpen(count);
      })
      .catch(() => {
        if (active) setCriticalCountError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const criticalAlertLabel = criticalCountError
    ? 'Critical exception count unavailable'
    : criticalOpen === null
      ? 'Loading critical exception count'
      : `${criticalOpen} critical exceptions open`;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </Button>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden truncate text-muted-foreground sm:inline">Northstar Logistics</span>
          <span className="hidden text-muted-foreground/50 sm:inline">/</span>
          <span className="truncate font-medium text-foreground">{currentSection?.label ?? 'Portal'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate('/manager/exceptions')}
          aria-label={criticalAlertLabel}
          title={criticalAlertLabel}
        >
          <TriangleAlert className="h-5 w-5 text-muted-foreground" />
          {criticalOpen !== null && criticalOpen > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
        </Button>
        <UserMenu
          name={accountName}
          role={profile ? getRoleLabel(profile.role) : status === 'error' ? 'Profile unavailable' : 'Loading account'}
          initials={getInitials(profile?.full_name ?? session?.user.email ?? '')}
        />
      </div>
    </header>
  );
}
