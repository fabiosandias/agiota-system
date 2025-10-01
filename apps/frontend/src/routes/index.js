import { jsx as _jsx } from "react/jsx-runtime";
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
const AppRoutes = () => {
    return useRoutes([
        {
            element: _jsx(ProtectedLayout, {}),
            children: [
                { path: '/', element: _jsx(DashboardPage, {}) },
                { path: '/loans', element: _jsx(LoansPage, {}) },
                { path: '/loans/new', element: _jsx(NewLoanPage, {}) },
                { path: '/clients', element: _jsx(ClientsPage, {}) },
                { path: '/accounts/deposit', element: _jsx(DepositPage, {}) },
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
