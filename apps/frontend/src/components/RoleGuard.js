import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const RoleGuard = ({ children, allowedRoles, redirectTo = '/' }) => {
    const { user } = useAuth();
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
export default RoleGuard;
