import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import LoansPage from '../pages/LoansPage';
import NewLoanPage from '../pages/NewLoanPage';
import ClientsPage from '../pages/ClientsPage';
import ClientDetailPage from '../pages/ClientDetailPage';
import DepositPage from '../pages/DepositPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProfilePage from '../pages/ProfilePage';
import UsersPage from '../pages/UsersPage';
import AccountsPage from '../pages/AccountsPage';
import TransactionsPage from '../pages/TransactionsPage';
import SettingsPage from '../pages/SettingsPage';
import LoadingScreen from '../components/LoadingScreen';
import Layout from '../components/Layout';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../contexts/AuthContext';

// Admin imports
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TenantsPage } from '../pages/admin/TenantsPage';
import { TenantDetailPage } from '../pages/admin/TenantDetailPage';
import { TicketsPage } from '../pages/admin/TicketsPage';
import { AdminLayout } from '../components/admin/AdminLayout';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const ProtectedLayout = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const GuestLayout = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AdminProtectedLayout = () => {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout />;
};

const AdminGuestLayout = () => {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return useRoutes([
    // Admin routes (Super Admin)
    {
      element: <AdminProtectedLayout />,
      children: [
        { path: '/admin', element: <AdminDashboard /> },
        { path: '/admin/tenants', element: <TenantsPage /> },
        { path: '/admin/tenants/:id', element: <TenantDetailPage /> },
        { path: '/admin/tickets', element: <TicketsPage /> },
      ]
    },
    {
      element: <AdminGuestLayout />,
      children: [
        { path: '/admin/login', element: <AdminLoginPage /> }
      ]
    },
    // Tenant routes
    {
      element: <ProtectedLayout />,
      children: [
        { path: '/', element: <DashboardPage /> },
        { path: '/loans', element: <LoansPage /> },
        {
          path: '/loans/new',
          element: (
            <RoleGuard allowedRoles={['admin', 'operator']}>
              <NewLoanPage />
            </RoleGuard>
          )
        },
        { path: '/clients', element: <ClientsPage /> },
        { path: '/clients/:id', element: <ClientDetailPage /> },
        {
          path: '/transactions',
          element: (
            <RoleGuard allowedRoles={['admin', 'viewer']}>
              <TransactionsPage />
            </RoleGuard>
          )
        },
        {
          path: '/accounts',
          element: (
            <RoleGuard allowedRoles={['admin', 'operator']}>
              <AccountsPage />
            </RoleGuard>
          )
        },
        {
          path: '/accounts/deposit',
          element: (
            <RoleGuard allowedRoles={['admin', 'operator']}>
              <DepositPage />
            </RoleGuard>
          )
        },
        {
          path: '/admin/users',
          element: (
            <RoleGuard allowedRoles={['admin']}>
              <UsersPage />
            </RoleGuard>
          )
        },
        {
          path: '/settings',
          element: (
            <RoleGuard allowedRoles={['admin']}>
              <SettingsPage />
            </RoleGuard>
          )
        },
        { path: '/profile', element: <ProfilePage /> }
      ]
    },
    {
      element: <GuestLayout />,
      children: [
        { path: '/login', element: <LoginPage /> },
        { path: '/forgot-password', element: <ForgotPasswordPage /> },
        { path: '/reset-password', element: <ResetPasswordPage /> }
      ]
    },
    { path: '*', element: <Navigate to="/" replace /> }
  ]);
};

export default AppRoutes;
