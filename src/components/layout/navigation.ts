import { BrainCircuit, Boxes, Factory, LayoutDashboard, Settings, Ship, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const managerNavItems: NavItem[] = [
  { label: 'Overview', href: '/manager', icon: LayoutDashboard, exact: true },
  { label: 'Inbound Shipments', href: '/manager/shipments', icon: Ship },
  { label: 'Exceptions', href: '/manager/exceptions', icon: TriangleAlert },
  { label: 'AI Assessments', href: '/manager/assessments', icon: BrainCircuit },
  { label: 'Suppliers', href: '/manager/suppliers', icon: Factory },
  { label: 'Inventory', href: '/manager/inventory', icon: Boxes },
  { label: 'Settings', href: '/manager/settings', icon: Settings },
];

export const supplierNavItems: Omit<NavItem, 'icon'>[] = [
  { label: 'Overview', href: '/supplier', exact: true },
  { label: 'Shipments', href: '/supplier/shipments' },
];
