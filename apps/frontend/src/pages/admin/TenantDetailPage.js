import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { PlanBadge, StatusBadge } from '../../components/admin/Badge';
export const TenantDetailPage = () => {
    const { id } = useParams();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    useEffect(() => {
        if (id) {
            loadTenant();
        }
    }, [id]);
    const loadTenant = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/tenants/${id}`);
            setTenant(response.data);
        }
        catch (error) {
            console.error('Erro ao carregar tenant:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: '📊' },
        { id: 'profile', label: 'Perfil', icon: '🏢' },
        { id: 'subscription', label: 'Assinatura', icon: '💳' },
        { id: 'payments', label: 'Pagamentos', icon: '💰' },
        { id: 'tickets', label: 'Tickets', icon: '🎫' },
    ];
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    if (!tenant) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-gray-600", children: "Tenant n\u00E3o encontrado" }), _jsx(Link, { to: "/admin/tenants", className: "text-blue-600 hover:text-blue-700 mt-4 inline-block", children: "Voltar para lista" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-white rounded-lg shadow p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold", children: tenant.businessName.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: tenant.businessName }), _jsxs("div", { className: "flex items-center space-x-3 mt-2", children: [_jsx(PlanBadge, { plan: tenant.plan }), _jsx(StatusBadge, { status: tenant.status })] }), _jsxs("div", { className: "mt-2 text-sm text-gray-600", children: [_jsxs("p", { children: [_jsx("strong", { children: "Admin:" }), " ", tenant.adminName, " (", tenant.adminEmail, ")"] }), _jsxs("p", { children: [_jsx("strong", { children: "Criado em:" }), ' ', new Date(tenant.createdAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })] })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium", children: "Editar" }), _jsx("button", { className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium", children: "A\u00E7\u00F5es" })] })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsx("div", { className: "border-b border-gray-200", children: _jsx("nav", { className: "flex -mb-px", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}`, children: [_jsx("span", { className: "mr-2", children: tab.icon }), tab.label] }, tab.id))) }) }), _jsxs("div", { className: "p-6", children: [activeTab === 'overview' && _jsx(OverviewTab, { tenant: tenant }), activeTab === 'profile' && _jsx(ProfileTab, { tenant: tenant }), activeTab === 'subscription' && _jsx(SubscriptionTab, { tenant: tenant }), activeTab === 'payments' && _jsx(PaymentsTab, { tenant: tenant }), activeTab === 'tickets' && _jsx(TicketsTab, { tenant: tenant })] })] })] }));
};
// Overview Tab
const OverviewTab = ({ tenant }) => {
    const stats = [
        { label: 'Total de Empréstimos', value: '0', color: 'bg-blue-100 text-blue-600' },
        { label: 'Clientes Cadastrados', value: '0', color: 'bg-green-100 text-green-600' },
        { label: 'Usuários Ativos', value: '0', color: 'bg-purple-100 text-purple-600' },
        { label: 'Valor Total Emprestado', value: 'R$ 0,00', color: 'bg-yellow-100 text-yellow-600' },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Estat\u00EDsticas" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map((stat, index) => (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: stat.label }), _jsx("p", { className: `text-2xl font-bold mt-2 ${stat.color}`, children: stat.value })] }, index))) })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsx("p", { className: "text-sm text-blue-800", children: "\uD83D\uDEA7 Estat\u00EDsticas detalhadas ser\u00E3o implementadas em breve" }) })] }));
};
// Profile Tab
const ProfileTab = ({ tenant }) => {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Informa\u00E7\u00F5es da Empresa" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nome da Empresa" }), _jsx("input", { type: "text", value: tenant.businessName, disabled: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsx("div", { className: "pt-2", children: _jsx(StatusBadge, { status: tenant.status }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nome do Administrador" }), _jsx("input", { type: "text", value: tenant.adminName, disabled: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "E-mail do Administrador" }), _jsx("input", { type: "email", value: tenant.adminEmail, disabled: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" })] })] })] }), _jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsx("p", { className: "text-sm text-yellow-800", children: "\uD83D\uDEA7 Edi\u00E7\u00E3o de perfil ser\u00E1 implementada em breve" }) })] }));
};
// Subscription Tab
const SubscriptionTab = ({ tenant }) => {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Detalhes da Assinatura" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Plano Atual" }), _jsx("div", { className: "pt-2", children: _jsx(PlanBadge, { plan: tenant.plan }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsx("div", { className: "pt-2", children: _jsx(StatusBadge, { status: tenant.status }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Data de Vencimento" }), _jsx("input", { type: "text", value: tenant.subscriptionEndsAt
                                            ? new Date(tenant.subscriptionEndsAt).toLocaleDateString('pt-BR')
                                            : 'Sem vencimento', disabled: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Valor Mensal" }), _jsx("input", { type: "text", value: tenant.plan === 'pro' ? 'R$ 99,90' : 'Grátis', disabled: true, className: "w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" })] })] })] }), _jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: _jsx("p", { className: "text-sm text-green-800", children: "\uD83D\uDEA7 Gerenciamento de assinatura ser\u00E1 implementado em breve" }) })] }));
};
// Payments Tab
const PaymentsTab = ({ tenant }) => {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Hist\u00F3rico de Pagamentos" }) }), _jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg", children: [_jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400 mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" }) }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: "Nenhum pagamento registrado" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\uD83D\uDEA7 Hist\u00F3rico de pagamentos ser\u00E1 implementado em breve" })] })] }));
};
// Tickets Tab
const TicketsTab = ({ tenant }) => {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Tickets de Suporte" }) }), _jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg", children: [_jsx("svg", { className: "mx-auto h-12 w-12 text-gray-400 mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" }) }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: "Nenhum ticket registrado" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\uD83D\uDEA7 Sistema de tickets ser\u00E1 implementado em breve" })] })] }));
};
