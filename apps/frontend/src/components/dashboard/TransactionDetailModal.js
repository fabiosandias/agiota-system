import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
const TRANSACTION_LABELS = {
    DEPOSIT: 'Depósito',
    WITHDRAWAL: 'Saque',
    LOAN_DISBURSED: 'Empréstimo',
    PAYMENT_RECEIVED: 'Recebimento',
    PARTIAL_REPAYMENT: 'Pagamento Parcial',
    FEE: 'Taxa',
    ADJUSTMENT: 'Ajuste',
    INTEREST_ACCRUED: 'Juros Acumulados'
};
const TRANSACTION_COLORS = {
    DEPOSIT: 'text-green-700 bg-green-100 dark:bg-green-900/20',
    WITHDRAWAL: 'text-red-700 bg-red-100 dark:bg-red-900/20',
    LOAN_DISBURSED: 'text-orange-700 bg-orange-100 dark:bg-orange-900/20',
    PAYMENT_RECEIVED: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/20',
    PARTIAL_REPAYMENT: 'text-blue-700 bg-blue-100 dark:bg-blue-900/20',
    FEE: 'text-purple-700 bg-purple-100 dark:bg-purple-900/20',
    ADJUSTMENT: 'text-gray-700 bg-gray-100 dark:bg-gray-900/20',
    INTEREST_ACCRUED: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20'
};
export default function TransactionDetailModal({ transaction, isOpen, onClose }) {
    const { showBalance } = useBalanceVisibility();
    if (!isOpen || !transaction)
        return null;
    const currency = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    const formatValue = (value) => {
        if (!showBalance || value === null)
            return '•••••';
        return currency.format(value);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-white", children: "Detalhes da Transa\u00E7\u00E3o" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: transaction.id })] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Tipo de Transa\u00E7\u00E3o" }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: `inline-flex px-3 py-1 rounded-full text-sm font-medium ${TRANSACTION_COLORS[transaction.type]}`, children: TRANSACTION_LABELS[transaction.type] || transaction.type }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg", children: [_jsx("label", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Saldo Anterior" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-white mt-1", children: formatValue(transaction.previous_balance) })] }), _jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg", children: [_jsx("label", { className: "text-xs font-medium text-blue-600 dark:text-blue-400", children: "Valor da Transa\u00E7\u00E3o" }), _jsx("p", { className: "text-lg font-semibold text-blue-700 dark:text-blue-300 mt-1", children: formatValue(transaction.amount) })] }), _jsxs("div", { className: "bg-green-50 dark:bg-green-900/20 p-4 rounded-lg", children: [_jsx("label", { className: "text-xs font-medium text-green-600 dark:text-green-400", children: "Saldo Atual" }), _jsx("p", { className: "text-lg font-semibold text-green-700 dark:text-green-300 mt-1", children: formatValue(transaction.new_balance) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Data e Hora" }), _jsx("p", { className: "text-base text-slate-900 dark:text-white mt-1", children: formatDate(transaction.occurred_at) })] }), transaction.user && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Executado por" }), _jsx("p", { className: "text-base text-slate-900 dark:text-white mt-1", children: transaction.user.name }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: transaction.user.email })] })), transaction.account_name && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Conta" }), _jsx("p", { className: "text-base text-slate-900 dark:text-white mt-1", children: transaction.account_name })] })), transaction.customer_name && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: transaction.type === 'PAYMENT_RECEIVED' || transaction.type === 'PARTIAL_REPAYMENT' ? 'Cliente que Pagou' :
                                        transaction.type === 'LOAN_DISBURSED' ? 'Cliente que Recebeu o Empréstimo' : 'Cliente' }), _jsx("p", { className: "text-base text-slate-900 dark:text-white mt-1", children: transaction.customer_name })] })), transaction.notes && (_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-500 dark:text-slate-400", children: "Observa\u00E7\u00F5es" }), _jsx("p", { className: "text-base text-slate-900 dark:text-white mt-1", children: transaction.notes })] }))] }), _jsx("div", { className: "flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors", children: "Fechar" }) })] }) }));
}
