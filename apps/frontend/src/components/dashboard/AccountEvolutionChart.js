import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
export default function AccountEvolutionChart() {
    const { showBalance } = useBalanceVisibility();
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [visibleMetrics, setVisibleMetrics] = useState({
        cash: true,
        principal: true,
        projectedInterest: true,
        partial: true
    });
    const [interval, setInterval] = useState('month');
    // Buscar todas as contas
    const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await api.get('/v1/accounts');
            return response.data;
        }
    });
    const accounts = accountsData?.data || [];
    // Auto-selecionar primeira conta quando carregada
    if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
    }
    // Buscar evolução da conta selecionada
    const { data: evolutionData, isLoading: isLoadingEvolution } = useQuery({
        queryKey: ['account-evolution', selectedAccountId, interval],
        queryFn: async () => {
            const to = new Date().toISOString().split('T')[0];
            const from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 6 meses atrás
            const response = await api.get(`/v1/accounts/${selectedAccountId}/evolution?from=${from}&to=${to}&interval=${interval}`);
            return response.data;
        },
        enabled: !!selectedAccountId
    });
    const points = evolutionData?.data?.points || [];
    const toggleMetric = (metric) => {
        setVisibleMetrics((prev) => ({
            ...prev,
            [metric]: !prev[metric]
        }));
    };
    const formatCurrency = (value) => {
        if (!showBalance)
            return '****';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };
    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload)
            return null;
        return (_jsxs("div", { className: "rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800", children: [_jsx("p", { className: "mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100", children: formatDate(label) }), payload.map((entry, index) => (_jsxs("div", { className: "flex items-center justify-between gap-4 text-sm", children: [_jsxs("span", { style: { color: entry.color }, children: [entry.name, ":"] }), _jsx("span", { className: "font-semibold", children: formatCurrency(entry.value) })] }, index)))] }));
    };
    return (_jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-slate-100", children: "Evolu\u00E7\u00E3o Parcial por Conta" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Visualize o crescimento do patrim\u00F4nio ao longo do tempo" })] }), _jsxs("div", { className: "mb-6 grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Conta" }), _jsx("select", { value: selectedAccountId, onChange: (e) => setSelectedAccountId(e.target.value), disabled: isLoadingAccounts, className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", children: isLoadingAccounts ? (_jsx("option", { children: "Carregando contas..." })) : accounts.length === 0 ? (_jsx("option", { children: "Nenhuma conta encontrada" })) : (accounts.map((account) => (_jsx("option", { value: account.id, children: account.name }, account.id)))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Intervalo" }), _jsx("div", { className: "mt-2 flex gap-2", children: ['day', 'week', 'month'].map((int) => (_jsx("button", { onClick: () => setInterval(int), className: `flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${interval === int
                                        ? 'border-blue-600 bg-blue-600 text-white'
                                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'}`, children: int === 'day' ? 'Dia' : int === 'week' ? 'Semana' : 'Mês' }, int))) })] })] }), _jsxs("div", { className: "mb-6 flex flex-wrap gap-2", children: [_jsx("button", { onClick: () => toggleMetric('partial'), className: `rounded-full border px-4 py-2 text-sm font-medium transition ${visibleMetrics.partial
                            ? 'border-purple-600 bg-purple-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`, children: "\uD83D\uDC8E Valor Parcial" }), _jsx("button", { onClick: () => toggleMetric('cash'), className: `rounded-full border px-4 py-2 text-sm font-medium transition ${visibleMetrics.cash
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`, children: "\uD83D\uDCB5 Caixa" }), _jsx("button", { onClick: () => toggleMetric('principal'), className: `rounded-full border px-4 py-2 text-sm font-medium transition ${visibleMetrics.principal
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`, children: "\uD83D\uDCCA Principal em Aberto" }), _jsx("button", { onClick: () => toggleMetric('projectedInterest'), className: `rounded-full border px-4 py-2 text-sm font-medium transition ${visibleMetrics.projectedInterest
                            ? 'border-orange-600 bg-orange-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`, children: "\uD83D\uDCC8 Juros Projetados" })] }), isLoadingEvolution ? (_jsx("div", { className: "flex h-96 items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" }), _jsx("p", { className: "mt-4 text-sm text-slate-600 dark:text-slate-400", children: "Carregando dados..." })] }) })) : points.length === 0 ? (_jsx("div", { className: "flex h-96 items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800", children: _jsx("span", { className: "text-3xl", children: "\uD83D\uDCCA" }) }), _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Nenhum dado dispon\u00EDvel" })] }) })) : (_jsx("div", { className: "mt-4", style: { height: 400 }, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: points, margin: { top: 10, right: 30, left: 0, bottom: 0 }, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "colorPartial", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#9333ea", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#9333ea", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "colorCash", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#10b981", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#10b981", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "colorPrincipal", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })] }), _jsxs("linearGradient", { id: "colorInterest", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#f97316", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#f97316", stopOpacity: 0 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "date", tickFormatter: formatDate, stroke: "#64748b", style: { fontSize: 12 } }), _jsx(YAxis, { tickFormatter: (value) => formatCurrency(value), stroke: "#64748b", style: { fontSize: 12 } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Legend, {}), visibleMetrics.partial && (_jsx(Area, { type: "monotone", dataKey: "partial_value", name: "Valor Parcial", stroke: "#9333ea", strokeWidth: 3, fill: "url(#colorPartial)" })), visibleMetrics.cash && (_jsx(Area, { type: "monotone", dataKey: "cash_balance", name: "Caixa", stroke: "#10b981", strokeWidth: 2, fill: "url(#colorCash)" })), visibleMetrics.principal && (_jsx(Area, { type: "monotone", dataKey: "principal_outstanding", name: "Principal em Aberto", stroke: "#3b82f6", strokeWidth: 2, fill: "url(#colorPrincipal)" })), visibleMetrics.projectedInterest && (_jsx(Area, { type: "monotone", dataKey: "interest_projected_remaining", name: "Juros Projetados", stroke: "#f97316", strokeWidth: 2, fill: "url(#colorInterest)" }))] }) }) }))] }));
}
