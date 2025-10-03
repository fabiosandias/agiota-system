import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
const statusStyle = {
    active: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300', label: 'Ativo' },
    due_soon: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', label: 'Vence em breve' },
    overdue: { bg: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300', label: 'Atrasado' },
    paid: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', label: 'Pago' },
    defaulted: { bg: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200', label: 'Inadimplente' }
};
const LoansPage = () => {
    const { user } = useAuth();
    const canManageLoans = user?.role === 'admin' || user?.role === 'operator';
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingSearch, setPendingSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { data, isLoading } = useQuery({
        queryKey: ['loans', { searchTerm, statusFilter, page, pageSize }],
        queryFn: async () => {
            const response = await api.get('/v1/loans', {
                params: {
                    search: searchTerm || undefined,
                    status: statusFilter === 'all' ? undefined : statusFilter,
                    page,
                    pageSize
                }
            });
            return response.data;
        }
    });
    const loans = useMemo(() => data?.data ?? [], [data]);
    const meta = data?.meta;
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchTerm(pendingSearch.trim());
        setPage(1);
    };
    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return (_jsx("div", { className: "space-y-6", children: _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Empr\u00E9stimos" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Acompanhe os contratos registrados e seus status." })] }), canManageLoans && (_jsx(Link, { to: "/loans/new", className: "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400", children: "+ Novo empr\u00E9stimo" }))] }), _jsxs("div", { className: "mt-6 flex flex-col gap-3 sm:flex-row", children: [_jsxs("form", { onSubmit: handleSearchSubmit, className: "flex flex-1 gap-2", children: [_jsx("input", { type: "text", placeholder: "Buscar por cliente ou documento...", className: "flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", value: pendingSearch, onChange: (e) => setPendingSearch(e.target.value) }), _jsx("button", { type: "submit", className: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700", children: "Buscar" })] }), _jsxs("select", { className: "rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", value: statusFilter, onChange: (e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }, children: [_jsx("option", { value: "all", children: "Todos os status" }), _jsx("option", { value: "active", children: "Ativo" }), _jsx("option", { value: "due_soon", children: "Vence em breve" }), _jsx("option", { value: "overdue", children: "Atrasado" }), _jsx("option", { value: "paid", children: "Pago" }), _jsx("option", { value: "defaulted", children: "Inadimplente" })] })] }), _jsx("div", { className: "mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Cliente" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Valor Principal" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Taxa de Juros" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Parcelas" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Vencimento" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: isLoading ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 6, children: "Carregando empr\u00E9stimos..." }) })) : loans.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 6, children: searchTerm || statusFilter !== 'all'
                                                ? 'Nenhum empréstimo encontrado com os filtros aplicados.'
                                                : 'Nenhum empréstimo cadastrado até o momento.' }) })) : (loans.map((loan) => {
                                        const paidInstallments = loan.installments.filter((i) => i.status === 'paid').length;
                                        const totalInstallments = loan.installments.length;
                                        return (_jsxs("tr", { className: "bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50", children: [_jsxs("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: [_jsx("div", { className: "font-medium", children: loan.client.name }), loan.client.document && (_jsx("span", { className: "text-xs text-slate-400 dark:text-slate-500", children: loan.client.document }))] }), _jsx("td", { className: "px-4 py-3 font-medium text-slate-700 dark:text-slate-200", children: currency.format(Number(loan.principalAmount)) }), _jsxs("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: [Number(loan.interestRate).toFixed(2), "%"] }), _jsxs("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: [paidInstallments, "/", totalInstallments] }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: new Date(loan.dueDate).toLocaleDateString('pt-BR') }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[loan.status].bg}`, children: statusStyle[loan.status].label }) })] }, loan.id));
                                    })) })] }) }) }), meta && meta.totalPages > 1 && (_jsxs("div", { className: "mt-6 flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: ["Mostrando ", (meta.page - 1) * meta.pageSize + 1, " a ", Math.min(meta.page * meta.pageSize, meta.total), " de ", meta.total, " empr\u00E9stimos"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800", children: "Anterior" }), _jsxs("span", { className: "flex items-center px-3 text-sm text-slate-600 dark:text-slate-300", children: ["P\u00E1gina ", meta.page, " de ", meta.totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(meta.totalPages, p + 1)), disabled: page === meta.totalPages, className: "rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800", children: "Pr\u00F3xima" })] })] }))] }) }));
};
export default LoansPage;
