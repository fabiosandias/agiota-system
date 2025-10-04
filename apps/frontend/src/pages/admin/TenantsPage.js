import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PlanBadge, StatusBadge } from '../../components/admin/Badge';
export const TenantsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tenants, setTenants] = useState([]);
    const [filteredTenants, setFilteredTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    useEffect(() => {
        loadTenants();
        // Se tiver action=new na URL, abrir modal
        if (searchParams.get('action') === 'new') {
            setShowCreateModal(true);
        }
    }, [searchParams]);
    useEffect(() => {
        // Aplicar filtros
        let filtered = [...tenants];
        // Filtro de busca
        if (search) {
            filtered = filtered.filter((t) => t.businessName.toLowerCase().includes(search.toLowerCase()) ||
                t.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
                t.adminName.toLowerCase().includes(search.toLowerCase()));
        }
        // Filtro de plano
        if (filterPlan !== 'all') {
            filtered = filtered.filter((t) => t.plan === filterPlan);
        }
        // Filtro de status
        if (filterStatus !== 'all') {
            filtered = filtered.filter((t) => t.status === filterStatus);
        }
        setFilteredTenants(filtered);
    }, [tenants, search, filterPlan, filterStatus]);
    const loadTenants = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/tenants');
            setTenants(response.data.tenants || []);
        }
        catch (error) {
            console.error('Erro ao carregar tenants:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateTenant = () => {
        setShowCreateModal(true);
        setSearchParams({ action: 'new' });
    };
    const handleCloseModal = () => {
        setShowCreateModal(false);
        setSearchParams({});
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Tenants" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Gerenciar empresas na plataforma" })] }), _jsxs("button", { onClick: handleCreateTenant, className: "flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }), _jsx("span", { className: "font-medium", children: "Novo Tenant" })] })] }), _jsx("div", { className: "bg-white rounded-lg shadow p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Buscar" }), _jsx("input", { type: "text", placeholder: "Nome da empresa, e-mail ou admin...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Plano" }), _jsxs("select", { value: filterPlan, onChange: (e) => setFilterPlan(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "free", children: "Free" }), _jsx("option", { value: "pro", children: "Pro" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "Todos" }), _jsx("option", { value: "active", children: "Ativo" }), _jsx("option", { value: "past_due", children: "Vencido" }), _jsx("option", { value: "suspended", children: "Suspenso" }), _jsx("option", { value: "canceled", children: "Cancelado" })] })] })] }) }), _jsxs("div", { className: "flex items-center justify-between text-sm text-gray-600", children: [_jsxs("p", { children: ["Mostrando ", _jsx("strong", { children: filteredTenants.length }), " de", ' ', _jsx("strong", { children: tenants.length }), " tenants"] }), (search || filterPlan !== 'all' || filterStatus !== 'all') && (_jsx("button", { onClick: () => {
                            setSearch('');
                            setFilterPlan('all');
                            setFilterStatus('all');
                        }, className: "text-blue-600 hover:text-blue-700 font-medium", children: "Limpar filtros" }))] }), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Empresa" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Administrador" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Plano" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Vencimento" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Criado em" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: filteredTenants.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-12 text-center", children: _jsxs("div", { className: "text-gray-400", children: [_jsx("svg", { className: "mx-auto h-12 w-12 mb-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" }) }), _jsx("p", { className: "text-sm font-medium", children: "Nenhum tenant encontrado" }), _jsx("p", { className: "text-xs mt-1", children: search || filterPlan !== 'all' || filterStatus !== 'all'
                                                        ? 'Tente ajustar os filtros'
                                                        : 'Crie o primeiro tenant para começar' })] }) }) })) : (filteredTenants.map((tenant) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "font-medium text-gray-900", children: tenant.businessName }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900", children: tenant.adminName }), _jsx("div", { className: "text-xs text-gray-500", children: tenant.adminEmail })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx(PlanBadge, { plan: tenant.plan }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx(StatusBadge, { status: tenant.status }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-600", children: tenant.subscriptionEndsAt
                                                ? new Date(tenant.subscriptionEndsAt).toLocaleDateString('pt-BR')
                                                : '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-600", children: new Date(tenant.createdAt).toLocaleDateString('pt-BR') }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsx(Link, { to: `/admin/tenants/${tenant.id}`, className: "text-blue-600 hover:text-blue-700 font-medium text-sm", children: "Ver detalhes" }) })] }, tenant.id)))) })] }) }) }), showCreateModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-2xl w-full p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Criar Novo Tenant" }), _jsx("button", { onClick: handleCloseModal, className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4", children: _jsx("p", { className: "text-sm text-blue-800", children: "\uD83D\uDEA7 Formul\u00E1rio de cria\u00E7\u00E3o de tenant ser\u00E1 implementado em breve" }) }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: handleCloseModal, className: "px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition", children: "Fechar" }) })] }) }))] }));
};
