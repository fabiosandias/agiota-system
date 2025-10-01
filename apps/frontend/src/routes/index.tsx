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
import LoadingScreen from '../components/LoadingScreen';
import Layout from '../components/Layout';
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
        { path: '/loans/new', element: <NewLoanPage /> },
        { path: '/clients', element: <ClientsPage /> },
        { path: '/accounts/deposit', element: <DepositPage /> },
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
