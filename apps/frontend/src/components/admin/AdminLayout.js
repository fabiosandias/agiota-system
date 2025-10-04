import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
export const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, logout } = useAdminAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };
    const getBreadcrumbs = () => {
        const path = location.pathname;
        const breadcrumbs = [{ label: 'Dashboard', path: '/admin' }];
        if (path.includes('/tenants')) {
            breadcrumbs.push({ label: 'Tenants', path: '/admin/tenants' });
            const match = path.match(/\/admin\/tenants\/([^/]+)/);
            if (match) {
                breadcrumbs.push({ label: 'Detalhes', path: path });
            }
        }
        else if (path.includes('/tickets')) {
            breadcrumbs.push({ label: 'Tickets', path: '/admin/tickets' });
        }
        return breadcrumbs;
    };
    const navigation = [
        {
            name: 'Dashboard',
            path: '/admin',
            icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) })),
        },
        {
            name: 'Tenants',
            path: '/admin/tenants',
            icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" }) })),
        },
        {
            name: 'Tickets',
            path: '/admin/tickets',
            icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" }) })),
        },
    ];
    const breadcrumbs = getBreadcrumbs();
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsxs("aside", { className: `fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-slate-900 w-64`, children: [_jsx("div", { className: "flex items-center justify-between h-16 px-6 border-b border-slate-800", children: _jsxs(Link, { to: "/admin", className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" }) }) }), _jsx("span", { className: "text-white font-semibold", children: "AITRON Admin" })] }) }), _jsx("nav", { className: "mt-6 px-3", children: navigation.map((item) => (_jsxs(NavLink, { to: item.path, end: item.path === '/admin', className: ({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`, children: [item.icon, _jsx("span", { className: "font-medium", children: item.name })] }, item.path))) }), _jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold", children: user?.name?.charAt(0).toUpperCase() || 'A' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-white truncate", children: user?.name }), _jsx("p", { className: "text-xs text-slate-400 truncate", children: user?.email })] })] }), _jsxs("button", { onClick: handleLogout, className: "w-full flex items-center justify-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), _jsx("span", { className: "text-sm font-medium", children: "Sair" })] })] })] }), _jsxs("div", { className: `${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all`, children: [_jsx("header", { className: "bg-white border-b border-gray-200 sticky top-0 z-30", children: _jsx("div", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "p-2 rounded-lg hover:bg-gray-100 text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }), _jsx("nav", { className: "flex items-center space-x-2 text-sm", children: breadcrumbs.map((crumb, index) => (_jsxs("div", { className: "flex items-center space-x-2", children: [index > 0 && _jsx("span", { className: "text-gray-400", children: "/" }), _jsx(Link, { to: crumb.path, className: `${index === breadcrumbs.length - 1
                                                                ? 'text-gray-900 font-medium'
                                                                : 'text-gray-500 hover:text-gray-700'}`, children: crumb.label })] }, crumb.path))) })] }), _jsx("div", { className: "flex-1 max-w-2xl mx-8", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", placeholder: "Buscar tenant por nome ou e-mail...", className: "w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsx("svg", { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) })] }) }), _jsx("div", { className: "flex items-center space-x-3", children: _jsxs("button", { className: "p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative", children: [_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" }) }), _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" })] }) })] }) }) }), _jsx("main", { className: "p-6", children: _jsx(Outlet, {}) })] })] }));
};
