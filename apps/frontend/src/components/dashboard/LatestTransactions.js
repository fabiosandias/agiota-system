import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../../utils/currency';
import TransactionDetailModal from './TransactionDetailModal';
const TRANSACTION_ICONS = {
    LOAN_DISBURSED: { icon: '💰', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    PAYMENT_RECEIVED: { icon: '💵', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    PARTIAL_REPAYMENT: { icon: '📈', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    DEPOSIT: { icon: '⬇️', color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    WITHDRAWAL: { icon: '⬆️', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    FEE: { icon: '📄', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    ADJUSTMENT: { icon: '⚙️', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30' },
    INTEREST_ACCRUED: { icon: '📊', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' }
};
const TRANSACTION_LABELS = {
    LOAN_DISBURSED: 'Empréstimo Desembolsado',
    PAYMENT_RECEIVED: 'Pagamento Recebido',
    PARTIAL_REPAYMENT: 'Pagamento Parcial',
    DEPOSIT: 'Depósito',
    WITHDRAWAL: 'Saque',
    FEE: 'Taxa',
    ADJUSTMENT: 'Ajuste',
    INTEREST_ACCRUED: 'Juros Acumulados'
};
const STATUS_COLORS = {
    CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    CANCELED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};
export default function LatestTransactions() {
    const { showBalance } = useBalanceVisibility();
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const { data, isLoading, error } = useQuery({
        queryKey: ['latest-transactions'],
        queryFn: async () => {
            const response = await api.get('/v1/transactions?limit=10');
            return response.data;
        }
    });
    const transactions = data?.data?.items || [];
    if (error) {
        return (_jsx("div", { className: "rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20", children: _jsx("p", { className: "text-red-700 dark:text-red-300", children: "Erro ao carregar transa\u00E7\u00F5es" }) }));
    }
    return (_jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "mb-6 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-slate-100", children: "\u00DAltimas Transa\u00E7\u00F5es" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Hist\u00F3rico recente de movimenta\u00E7\u00F5es" })] }), _jsx(Link, { to: "/transactions", className: "text-sm font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300", children: "Ver todas \u2192" })] }), isLoading ? (_jsx("div", { className: "space-y-4", children: [...Array(5)].map((_, i) => (_jsxs("div", { className: "flex items-center gap-4 rounded-xl bg-slate-100 p-4 dark:bg-slate-800", children: [_jsx("div", { className: "h-12 w-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx("div", { className: "h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" }), _jsx("div", { className: "h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" })] }), _jsx("div", { className: "h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" })] }, i))) })) : transactions.length === 0 ? (_jsxs("div", { className: "py-12 text-center", children: [_jsx("div", { className: "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800", children: _jsx("span", { className: "text-3xl", children: "\uD83D\uDCCA" }) }), _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Nenhuma transa\u00E7\u00E3o encontrada" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-500", children: "As movimenta\u00E7\u00F5es aparecer\u00E3o aqui" })] })) : (_jsx("div", { className: "space-y-2", children: transactions.map((transaction, index) => {
                    const config = TRANSACTION_ICONS[transaction.type];
                    const label = TRANSACTION_LABELS[transaction.type];
                    const statusColor = STATUS_COLORS[transaction.status];
                    const date = new Date(transaction.occurred_at);
                    const isRecent = index < 3;
                    return (_jsxs("div", { onClick: () => setSelectedTransaction(transaction), className: `group relative flex items-center gap-4 rounded-xl border p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${isRecent
                            ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/10'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`, children: [index < transactions.length - 1 && (_jsx("div", { className: "absolute left-[34px] top-[60px] h-6 w-0.5 bg-slate-200 dark:bg-slate-700" })), _jsx("div", { className: `flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl ${config.color}`, children: config.icon }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: label }), _jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`, children: transaction.status })] }), _jsxs("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-400", children: [transaction.customer_name && _jsxs("span", { children: [transaction.customer_name, " \u2022 "] }), transaction.account_name && _jsxs("span", { children: [transaction.account_name, " \u2022 "] }), _jsxs("time", { dateTime: transaction.occurred_at, children: [date.toLocaleDateString('pt-BR'), " \u00E0s ", date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })] })] }), transaction.notes && (_jsx("p", { className: "mt-1 truncate text-xs text-slate-500 dark:text-slate-500", children: transaction.notes }))] }), _jsxs("div", { className: "flex flex-col items-end", children: [_jsx("p", { className: `text-lg font-bold ${transaction.type === 'PAYMENT_RECEIVED' || transaction.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`, children: formatCurrencyWithPrivacy(transaction.amount, showBalance) }), transaction.reference_id && (_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-500", children: transaction.reference_id }))] })] }, transaction.id));
                }) })), _jsx(TransactionDetailModal, { transaction: selectedTransaction, isOpen: !!selectedTransaction, onClose: () => setSelectedTransaction(null) })] }));
}
