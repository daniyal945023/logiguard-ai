import { useEffect, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

import { ManagerLayout } from '@/components/layout/ManagerLayout';
import { SupplierLayout } from '@/components/layout/SupplierLayout';
import { navigate, usePath, matchRoute } from '@/lib/router';
import { ExceptionsPage } from '@/pages/manager/ExceptionsPage';
import { ExceptionDetailPage } from '@/pages/manager/ExceptionDetailPage';
import { ManagerAssessmentsPage, ManagerInventoryPage, ManagerSettingsPage, ManagerSupplierDetailPage, ManagerSuppliersPage } from '@/pages/manager/OperationsPages';
import { OverviewPage } from '@/pages/manager/OverviewPage';
import { ShipmentDetailPage } from '@/pages/manager/ShipmentDetailPage';
import { ShipmentsPage } from '@/pages/manager/ShipmentsPage';
import { LoginPage } from '@/pages/login/LoginPage';
import { SupplierOverviewPage, SupplierShipmentDetailPage, SupplierShipmentsPage } from '@/pages/supplier/SupplierPortalPages';
import { useSession, type UserRole } from '@/services/session';

const MANAGER_ROLES: UserRole[] = ['logistics_manager', 'admin'];
const SUPPLIER_ROLES: UserRole[] = ['supplier'];

function ProtectedPortal({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const { status, profile } = useSession();
  const authorized = status === 'authenticated' && profile && allowedRoles.includes(profile.role);
  const destination = status === 'authenticated' && profile
    ? profile.role === 'supplier' ? '/supplier' : '/manager'
    : '/login';

  useEffect(() => {
    if (status === 'unauthenticated' || status === 'error') {
      navigate('/login');
    } else if (status === 'authenticated' && profile && !allowedRoles.includes(profile.role)) {
      navigate(destination);
    }
  }, [allowedRoles, destination, profile, status]);

  if (authorized) return children;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" role="status">
      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{status === 'loading' ? 'Restoring your session…' : 'Redirecting…'}</span>
    </div>
  );
}

function App() {
  const path = usePath();

  if (path === '/' || path === '/login') return <LoginPage />;

  if (path.startsWith('/supplier')) {
    const shipmentMatch = matchRoute('/supplier/shipments/:id', path);
    const page = path === '/supplier'
      ? <SupplierOverviewPage />
      : shipmentMatch
        ? <SupplierShipmentDetailPage id={shipmentMatch.id} />
        : <SupplierShipmentsPage />;
    return (
      <ProtectedPortal allowedRoles={SUPPLIER_ROLES}>
        <SupplierLayout>{page}</SupplierLayout>
      </ProtectedPortal>
    );
  }

  if (!path.startsWith('/manager')) return <LoginPage />;

  const shipmentMatch = matchRoute('/manager/shipments/:id', path);
  const exceptionMatch = matchRoute('/manager/exceptions/:id', path);
  const supplierMatch = matchRoute('/manager/suppliers/:id', path);
  let page: ReactNode;

  if (path === '/manager' || path === '/manager/') page = <OverviewPage />;
  else if (path === '/manager/shipments') page = <ShipmentsPage />;
  else if (shipmentMatch) page = <ShipmentDetailPage id={shipmentMatch.id} />;
  else if (path === '/manager/exceptions') page = <ExceptionsPage />;
  else if (exceptionMatch) page = <ExceptionDetailPage id={exceptionMatch.id} />;
  else if (path === '/manager/assessments') page = <ManagerAssessmentsPage />;
  else if (path === '/manager/suppliers') page = <ManagerSuppliersPage />;
  else if (supplierMatch) page = <ManagerSupplierDetailPage id={supplierMatch.id} />;
  else if (path === '/manager/inventory') page = <ManagerInventoryPage />;
  else if (path === '/manager/settings') page = <ManagerSettingsPage />;
  else page = <OverviewPage />;

  return (
    <ProtectedPortal allowedRoles={MANAGER_ROLES}>
      <ManagerLayout>{page}</ManagerLayout>
    </ProtectedPortal>
  );
}

export default App;
