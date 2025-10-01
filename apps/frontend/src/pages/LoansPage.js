import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
const statusStyle = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    due_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    renegotiated: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
    written_off: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200'
};
const LoansPage = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['loans'],
        queryFn: async () => {
            const response = await api.get('/loans');
            return response.data;
        }
    });
    const loans = useMemo(() => data?.data ?? [], [data]);
    return (_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Empr\u00E9stimos" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Acompanhe os contratos registrados e seus status." })] }), _jsx(Link, { to: "/loans/new", className: "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400", children: "Novo empr\u00E9stimo" })] }), _jsx("div", { className: "mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Cliente" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Valor" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Juros" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Vencimento" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: isLoading ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 5, children: "Carregando empr\u00E9stimos..." }) })) : loans.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 5, children: "Nenhum empr\u00E9stimo cadastrado at\u00E9 o momento." }) })) : (loans.map((loan) => {
                                const principalFormatted = Number(loan.principalAmount).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                });
                                const interestFormatted = `${Number(loan.interestRate).toFixed(2)} %`;
                                const dueDateFormatted = new Date(loan.dueDate).toLocaleDateString('pt-BR');
                                return (_jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [_jsxs("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: [_jsx("div", { className: "font-medium", children: loan.client.name }), loan.client.email && (_jsx("span", { className: "text-xs text-slate-400 dark:text-slate-500", children: loan.client.email }))] }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: principalFormatted }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: interestFormatted }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: dueDateFormatted }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[loan.status]}`, children: loan.status.replace('_', ' ') }) })] }, loan.id));
                            })) })] }) })] }));
};
export default LoansPage;
