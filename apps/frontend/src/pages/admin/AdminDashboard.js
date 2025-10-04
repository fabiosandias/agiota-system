import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { PlanBadge, StatusBadge } from '../../components/admin/Badge';
export const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        suspendedTenants: 0,
        totalRevenue: 0,
        openTickets: 0,
        proTenants: 0,
        freeTenants: 0,
    });
    const [recentTenants, setRecentTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadDashboard();
    }, []);
    const loadDashboard = async () => {
        try {
            setLoading(true);
            // Buscar todos os tenants para calcular estatísticas
            const response = await api.get('/admin/tenants');
            const tenants = response.data.tenants || [];
            // Calcular estatísticas
            const activeTenants = tenants.filter((t) => t.status === 'active').length;
            const suspendedTenants = tenants.filter((t) => t.status === 'suspended').length;
            const proTenants = tenants.filter((t) => t.plan === 'pro').length;
            const freeTenants = tenants.filter((t) => t.plan === 'free').length;
            setStats({
                totalTenants: tenants.length,
                activeTenants,
                suspendedTenants,
                totalRevenue: proTenants * 99.9, // R$ 99,90 por tenant PRO
                openTickets: 0, // TODO: implementar quando tickets estiver pronto
                proTenants,
                freeTenants,
            });
            // Pegar os 5 tenants mais recentes
            const sorted = [...tenants].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentTenants(sorted.slice(0, 5));
        }
        catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const statCards = [
        {
            label: 'Total de Tenants',
            value: stats.totalTenants,
            icon: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" }) })),
            color: 'bg-blue-500',
        },
        {
            label: 'Tenants Ativos',
            value: stats.activeTenants,
            icon: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) })),
            color: 'bg-green-500',
        },
        {
            label: 'Tenants Suspensos',
            value: stats.suspendedTenants,
            icon: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" }) })),
            color: 'bg-red-500',
        },
        {
            label: 'Receita Mensal (MRR)',
            value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: (_jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) })),
            color: 'bg-yellow-500',
        },
    ];
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dashboard" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Vis\u00E3o geral da plataforma AITRON Financeira" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: statCards.map((stat, index) => (_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: stat.label }), _jsx("p", { className: "text-2xl font-bold text-gray-900 mt-2", children: stat.value })] }), _jsx("div", { className: `${stat.color} rounded-lg p-3 text-white`, children: stat.icon })] }) }, index))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Distribui\u00E7\u00E3o de Planos" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(PlanBadge, { plan: "pro" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Plano PRO" })] }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: stats.proTenants })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full", style: {
                                                        width: `${stats.totalTenants > 0 ? (stats.proTenants / stats.totalTenants) * 100 : 0}%`,
                                                    } }) })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(PlanBadge, { plan: "free" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: "Plano FREE" })] }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: stats.freeTenants })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-blue-500 h-2 rounded-full", style: {
                                                        width: `${stats.totalTenants > 0 ? (stats.freeTenants / stats.totalTenants) * 100 : 0}%`,
                                                    } }) })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "A\u00E7\u00F5es R\u00E1pidas" }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Link, { to: "/admin/tenants?action=new", className: "flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-blue-600 rounded-lg p-2 text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }) }), _jsx("span", { className: "font-medium text-gray-900", children: "Criar Novo Tenant" })] }), _jsx("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] }), _jsxs(Link, { to: "/admin/tenants", className: "flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-gray-600 rounded-lg p-2 text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 10h16M4 14h16M4 18h16" }) }) }), _jsx("span", { className: "font-medium text-gray-900", children: "Ver Todos os Tenants" })] }), _jsx("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] }), _jsxs(Link, { to: "/admin/tickets", className: "flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-gray-600 rounded-lg p-2 text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" }) }) }), _jsx("span", { className: "font-medium text-gray-900", children: "Ver Tickets de Suporte" })] }), _jsx("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Tenants Recentes" }), _jsx(Link, { to: "/admin/tenants", className: "text-sm font-medium text-blue-600 hover:text-blue-700", children: "Ver todos" })] }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Empresa" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Admin" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Plano" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Criado em" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: recentTenants.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-500", children: "Nenhum tenant cadastrado" }) })) : (recentTenants.map((tenant) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "font-medium text-gray-900", children: tenant.businessName }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm text-gray-600", children: tenant.adminEmail }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx(PlanBadge, { plan: tenant.plan }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx(StatusBadge, { status: tenant.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-600", children: new Date(tenant.createdAt).toLocaleDateString('pt-BR') }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm", children: _jsx(Link, { to: `/admin/tenants/${tenant.id}`, className: "text-blue-600 hover:text-blue-700 font-medium", children: "Ver detalhes" }) })] }, tenant.id)))) })] }) })] })] }));
};
