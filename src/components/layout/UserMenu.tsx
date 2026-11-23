import { useState } from 'react';
import { LogOut, type LucideIcon } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { navigate } from '@/lib/router';
import { cn } from '@/lib/utils';
import { useSession } from '@/services/session';

export interface UserMenuAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}

interface UserMenuProps {
  name: string;
  role: string;
  initials: string;
  actions?: UserMenuAction[];
  className?: string;
}

export function UserMenu({ name, role, initials, actions, className }: UserMenuProps) {
  const [signingOut, setSigningOut] = useState(false);
  const { signOut } = useSession();
  const { toast } = useToast();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Sign-out failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-3 rounded-lg p-1.5 pr-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-foreground">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{role}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-border bg-popover">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions?.map((action) => (
          <DropdownMenuItem key={action.label} onSelect={action.onSelect} className="cursor-pointer gap-2">
            <action.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {action.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void handleSignOut()}
          disabled={signingOut}
          className="cursor-pointer gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
