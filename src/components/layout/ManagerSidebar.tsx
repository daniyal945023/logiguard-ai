import { Truck } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { isPathActive, navigate } from '@/lib/router';
import { cn } from '@/lib/utils';

import { managerNavItems } from './navigation';

interface ManagerSidebarProps {
  collapsed: boolean;
  path: string;
}

export function ManagerSidebar({ collapsed, path }: ManagerSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-border', collapsed ? 'justify-center px-0' : 'px-5')}>
        {collapsed ? <Logo className="justify-center" /> : <Logo showTagline />}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Manager navigation">
        {managerNavItems.map((item) => {
          const active = isPathActive(path, item.href, item.exact);
          return (
            <a
              key={item.href}
              href={`#${item.href}`}
              title={collapsed ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />}
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </a>
          );
        })}
      </nav>

      <div className={cn('border-t border-border p-3', collapsed && 'flex justify-center')}>
        <button
          type="button"
          onClick={() => navigate('/supplier')}
          title="Open supplier portal"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'w-auto justify-center px-2',
          )}
        >
          <Truck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && <span>Supplier portal</span>}
        </button>
      </div>
    </div>
  );
}
