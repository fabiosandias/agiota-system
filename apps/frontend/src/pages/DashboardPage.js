import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../utils/currency';
import LatestTransactions from '../components/dashboard/LatestTransactions';
import AccountBalanceCard from '../components/dashboard/AccountBalanceCard';
import AccountEvolutionChart from '../components/dashboard/AccountEvolutionChart';
const DashboardPage = () => {
    const { showBalance } = useBalanceVisibility();
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
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "grid gap-6 md:grid-cols-2 xl:grid-cols-4", children: [_jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Empr\u00E9stimos ativos" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-blue-700 dark:text-blue-300", children: loadingLoans ? '...' : activeLoans })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Em atraso" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-red-600 dark:text-red-400", children: loadingLoans ? '...' : overdueLoans })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Quitados" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-emerald-600 dark:text-emerald-300", children: loadingLoans ? '...' : paidLoans })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("span", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Saldo dispon\u00EDvel" }), _jsx("p", { className: "mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50", children: loadingAccounts ? '...' : formatCurrencyWithPrivacy(availableBalance, showBalance) })] })] }), _jsxs("section", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(AccountBalanceCard, {}), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Resumo Financeiro" }), _jsxs("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: ["Total liberado em empr\u00E9stimos: ", loadingLoans ? '...' : formatCurrencyWithPrivacy(totalPrincipal, showBalance)] }), _jsxs("div", { className: "mt-6 grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Total de Contas" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100", children: loadingAccounts ? '...' : accounts.length })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Total Empr\u00E9stimos" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100", children: loadingLoans ? '...' : loans.length })] })] })] })] }), _jsx(AccountEvolutionChart, {}), _jsx(LatestTransactions, {})] }));
};
export default DashboardPage;
