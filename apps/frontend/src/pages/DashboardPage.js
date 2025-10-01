import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
const DashboardPage = () => {
    const { data: loansData, isLoading: loadingLoans } = useQuery({
        queryKey: ['loans'],
        queryFn: async () => {
            const response = await api.get('/loans');
            return response.data;
        }
    });
    const { data: accountsData, isLoading: loadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await api.get('/accounts');
            return response.data;
        }
    });
    const loans = loansData?.data ?? [];
    const accounts = accountsData?.data ?? [];
    const totalPrincipal = loans.reduce((acc, loan) => acc + Number(loan.principalAmount), 0);
    const activeLoans = loans.filter((loan) => ['active', 'due_soon', 'renegotiated'].includes(loan.status)).length;
    const overdueLoans = loans.filter((loan) => loan.status === 'overdue').length;
    const paidLoans = loans.filter((loan) => loan.status === 'paid').length;
    const availableBalance = accounts.reduce((acc, account) => acc + Number(account.currentBalance), 0);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-4", children: [_jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Empr\u00E9stimos ativos" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-blue-700 dark:text-blue-300", children: loadingLoans ? '...' : activeLoans })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Em atraso" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-red-600 dark:text-red-400", children: loadingLoans ? '...' : overdueLoans })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Quitados" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-emerald-600 dark:text-emerald-300", children: loadingLoans ? '...' : paidLoans })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Saldo dispon\u00EDvel" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50", children: loadingAccounts
                                    ? '...'
                                    : availableBalance.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }) })] })] }), _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Movimenta\u00E7\u00E3o de caixa" }), _jsxs("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: ["Total liberado em empr\u00E9stimos: ", loadingLoans
                                ? '...'
                                : totalPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })] }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Esse painel exibir\u00E1 gr\u00E1ficos assim que as transa\u00E7\u00F5es estiverem dispon\u00EDveis na API." })] }), _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("h2", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: ["Contas", _jsx("span", { className: "ml-2 text-xs font-medium text-slate-400 dark:text-slate-500", children: "Saldo consolidado" })] }), _jsx("div", { className: "mt-4 space-y-3", children: loadingAccounts ? (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Carregando contas..." })) : accounts.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Nenhuma conta cadastrada." })) : (accounts.map((account) => (_jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm transition dark:border-slate-700 dark:bg-slate-950/50", children: [_jsx("span", { className: "font-medium text-slate-600 dark:text-slate-300", children: account.name }), _jsx("span", { className: "text-slate-900 dark:text-slate-100", children: Number(account.currentBalance).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }) })] }, account.id)))) })] })] }));
};
export default DashboardPage;
