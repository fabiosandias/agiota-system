import { jsx as _jsx } from "react/jsx-runtime";
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
        return _jsx(LoadingScreen, {});
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return (_jsx(Layout, { children: _jsx(Outlet, {}) }));
};
const GuestLayout = () => {
    const { user, isInitializing } = useAuth();
    if (isInitializing) {
        return _jsx(LoadingScreen, {});
    }
    if (user) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(Outlet, {});
};
const AdminProtectedLayout = () => {
    const { user, loading } = useAdminAuth();
    if (loading) {
        return _jsx(LoadingScreen, {});
    }
    if (!user) {
        return _jsx(Navigate, { to: "/admin/login", replace: true });
    }
    return _jsx(AdminLayout, {});
};
const AdminGuestLayout = () => {
    const { user, loading } = useAdminAuth();
    if (loading) {
        return _jsx(LoadingScreen, {});
    }
    if (user) {
        return _jsx(Navigate, { to: "/admin", replace: true });
    }
    return _jsx(Outlet, {});
};
const AppRoutes = () => {
    return useRoutes([
        // Admin routes (Super Admin)
        {
            element: _jsx(AdminProtectedLayout, {}),
            children: [
                { path: '/admin', element: _jsx(AdminDashboard, {}) },
                { path: '/admin/tenants', element: _jsx(TenantsPage, {}) },
                { path: '/admin/tenants/:id', element: _jsx(TenantDetailPage, {}) },
                { path: '/admin/tickets', element: _jsx(TicketsPage, {}) },
            ]
        },
        {
            element: _jsx(AdminGuestLayout, {}),
            children: [
                { path: '/admin/login', element: _jsx(AdminLoginPage, {}) }
            ]
        },
        // Tenant routes
        {
            element: _jsx(ProtectedLayout, {}),
            children: [
                { path: '/', element: _jsx(DashboardPage, {}) },
                { path: '/loans', element: _jsx(LoansPage, {}) },
                {
                    path: '/loans/new',
                    element: (_jsx(RoleGuard, { allowedRoles: ['admin', 'operator'], children: _jsx(NewLoanPage, {}) }))
                },
                { path: '/clients', element: _jsx(ClientsPage, {}) },
                { path: '/clients/:id', element: _jsx(ClientDetailPage, {}) },
                {
                    path: '/transactions',
                    element: (_jsx(RoleGuard, { allowedRoles: ['admin', 'viewer'], children: _jsx(TransactionsPage, {}) }))
                },
                {
                    path: '/accounts',
                    element: (_jsx(RoleGuard, { allowedRoles: ['admin', 'operator'], children: _jsx(AccountsPage, {}) }))
                },
                {
                    path: '/accounts/deposit',
                    element: (_jsx(RoleGuard, { allowedRoles: ['admin', 'operator'], children: _jsx(DepositPage, {}) }))
                },
                {
                    path: '/admin/users',
                    element: (_jsx(RoleGuard, { allowedRoles: ['admin'], children: _jsx(UsersPage, {}) }))
                },
                { path: '/profile', element: _jsx(ProfilePage, {}) }
            ]
        },
        {
            element: _jsx(GuestLayout, {}),
            children: [
                { path: '/login', element: _jsx(LoginPage, {}) },
                { path: '/forgot-password', element: _jsx(ForgotPasswordPage, {}) },
                { path: '/reset-password', element: _jsx(ResetPasswordPage, {}) }
            ]
        },
        { path: '*', element: _jsx(Navigate, { to: "/", replace: true }) }
    ]);
};
export default AppRoutes;
