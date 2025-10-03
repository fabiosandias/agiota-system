import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import LoansPage from '../pages/LoansPage';
import NewLoanPage from '../pages/NewLoanPage';
import ClientsPage from '../pages/ClientsPage';
import DepositPage from '../pages/DepositPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProfilePage from '../pages/ProfilePage';
import UsersPage from '../pages/UsersPage';
import AccountsPage from '../pages/AccountsPage';
import LoadingScreen from '../components/LoadingScreen';
import Layout from '../components/Layout';
import RoleGuard from '../components/RoleGuard';
import { useAuth } from '../contexts/AuthContext';

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

const AppRoutes = () => {
  return useRoutes([
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
