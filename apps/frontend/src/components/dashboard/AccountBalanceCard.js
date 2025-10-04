import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../../utils/currency';
export default function AccountBalanceCard() {
    const { showBalance } = useBalanceVisibility();
    const [selectedAccountId, setSelectedAccountId] = useState('');
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
    // Buscar saldo da conta selecionada
    const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
        queryKey: ['account-balance', selectedAccountId],
        queryFn: async () => {
            const response = await api.get(`/v1/accounts/${selectedAccountId}/balance`);
            return response.data;
        },
        enabled: !!selectedAccountId
    });
    const balance = balanceData?.data;
    const lastUpdated = balance?.lastUpdated ? new Date(balance.lastUpdated) : null;
    return (_jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h3", { className: "text-lg font-bold text-slate-900 dark:text-slate-100", children: "Saldo Consolidado" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Selecione uma conta para visualizar" })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Conta" }), _jsx("select", { value: selectedAccountId, onChange: (e) => setSelectedAccountId(e.target.value), disabled: isLoadingAccounts, className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20", children: isLoadingAccounts ? (_jsx("option", { children: "Carregando contas..." })) : accounts.length === 0 ? (_jsx("option", { children: "Nenhuma conta encontrada" })) : (accounts.map((account) => (_jsxs("option", { value: account.id, children: [account.name, " (", account.type === 'checking' ? 'Corrente' : 'Poupança', ")"] }, account.id)))) })] }), isLoadingBalance ? (_jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6", children: [_jsx("div", { className: "h-6 w-32 animate-pulse rounded bg-blue-400/50" }), _jsx("div", { className: "mt-4 h-10 w-48 animate-pulse rounded bg-blue-400/50" }), _jsx("div", { className: "mt-3 h-4 w-40 animate-pulse rounded bg-blue-400/50" })] })) : balance ? (_jsx("div", { className: "rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-blue-100", children: "Saldo Dispon\u00EDvel" }), _jsx("p", { className: "mt-2 text-3xl font-bold", children: formatCurrencyWithPrivacy(Number(balance.balance), showBalance) }), lastUpdated && (_jsxs("p", { className: "mt-3 text-xs text-blue-100", children: ["\u00DAltima atualiza\u00E7\u00E3o:", ' ', lastUpdated.toLocaleDateString('pt-BR'), " \u00E0s", ' ', lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })] }))] }), _jsx("div", { className: "rounded-lg bg-white/20 p-2 backdrop-blur-sm", children: _jsx("svg", { className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" }) }) })] }) })) : (_jsx("div", { className: "rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-700", children: _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Selecione uma conta" }) })), balance && (_jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "rounded-lg bg-slate-100 p-3 dark:bg-slate-800", children: [_jsx("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Tipo de Conta" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100", children: accounts.find(a => a.id === selectedAccountId)?.type === 'checking' ? 'Corrente' : 'Poupança' })] }), _jsxs("div", { className: "rounded-lg bg-slate-100 p-3 dark:bg-slate-800", children: [_jsx("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Moeda" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100", children: balance.currency })] })] }))] }));
}
