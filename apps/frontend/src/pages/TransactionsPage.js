import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import TransactionDetailModal from '../components/dashboard/TransactionDetailModal';
const TRANSACTION_LABELS = {
    LOAN_DISBURSED: 'Empréstimo',
    PAYMENT_RECEIVED: 'Recebimento',
    PARTIAL_REPAYMENT: 'Pagamento Parcial',
    DEPOSIT: 'Depósito',
    WITHDRAWAL: 'Saque',
    FEE: 'Taxa',
    ADJUSTMENT: 'Ajuste',
    INTEREST_ACCRUED: 'Juros Acumulados'
};
const TRANSACTION_COLORS = {
    LOAN_DISBURSED: 'text-orange-700 bg-orange-100 dark:bg-orange-900/20',
    PAYMENT_RECEIVED: 'text-green-700 bg-green-100 dark:bg-green-900/20',
    PARTIAL_REPAYMENT: 'text-blue-700 bg-blue-100 dark:bg-blue-900/20',
    DEPOSIT: 'text-cyan-700 bg-cyan-100 dark:bg-cyan-900/20',
    WITHDRAWAL: 'text-red-700 bg-red-100 dark:bg-red-900/20',
    FEE: 'text-purple-700 bg-purple-100 dark:bg-purple-900/20',
    ADJUSTMENT: 'text-gray-700 bg-gray-100 dark:bg-gray-900/20',
    INTEREST_ACCRUED: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20'
};
export default function TransactionsPage() {
    const { showBalance } = useBalanceVisibility();
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        clientId: '',
        userId: '',
        dateFrom: '',
        dateTo: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const { data, isLoading } = useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.type)
                params.append('type', filters.type);
            if (filters.dateFrom)
                params.append('from', filters.dateFrom);
            if (filters.dateTo)
                params.append('to', filters.dateTo);
            const response = await api.get(`/v1/transactions?${params.toString()}&limit=50`);
            return response.data;
        }
    });
    const transactions = data?.data?.items || [];
    const currency = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    const formatValue = (value) => {
        if (!showBalance)
            return '•••••';
        return currency.format(value);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: "Transa\u00E7\u00F5es" }), _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Hist\u00F3rico completo de movimenta\u00E7\u00F5es financeiras" })] }), _jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" }) }), "Filtros"] })] }), showFilters && (_jsx("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Tipo de Transa\u00E7\u00E3o" }), _jsxs("select", { value: filters.type, onChange: (e) => setFilters({ ...filters, type: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white", children: [_jsx("option", { value: "", children: "Todos" }), _jsx("option", { value: "DEPOSIT", children: "Dep\u00F3sito" }), _jsx("option", { value: "WITHDRAWAL", children: "Saque" }), _jsx("option", { value: "LOAN_DISBURSED", children: "Empr\u00E9stimo" }), _jsx("option", { value: "PAYMENT_RECEIVED", children: "Recebimento" }), _jsx("option", { value: "PARTIAL_REPAYMENT", children: "Pagamento Parcial" }), _jsx("option", { value: "FEE", children: "Taxa" }), _jsx("option", { value: "ADJUSTMENT", children: "Ajuste" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Data Inicial" }), _jsx("input", { type: "date", value: filters.dateFrom, onChange: (e) => setFilters({ ...filters, dateFrom: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Data Final" }), _jsx("input", { type: "date", value: filters.dateTo, onChange: (e) => setFilters({ ...filters, dateTo: e.target.value }), className: "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" })] }), _jsx("div", { className: "flex items-end", children: _jsx("button", { onClick: () => setFilters({ type: '', clientId: '', userId: '', dateFrom: '', dateTo: '' }), className: "w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors", children: "Limpar Filtros" }) })] }) })), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Tipo" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Cliente/Conta" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Data" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Usu\u00E1rio" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Valor" }), _jsx("th", { className: "px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-700", children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-slate-500 dark:text-slate-400", children: "Carregando transa\u00E7\u00F5es..." }) })) : transactions.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-slate-500 dark:text-slate-400", children: "Nenhuma transa\u00E7\u00E3o encontrada" }) })) : (transactions.map((transaction) => (_jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 rounded-full text-xs font-medium ${TRANSACTION_COLORS[transaction.type]}`, children: TRANSACTION_LABELS[transaction.type] }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "text-sm", children: [transaction.customer_name && (_jsx("div", { className: "font-medium text-slate-900 dark:text-white", children: transaction.customer_name })), transaction.account_name && (_jsx("div", { className: "text-slate-500 dark:text-slate-400", children: transaction.account_name }))] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white", children: formatDate(transaction.occurred_at) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400", children: transaction.user?.name || '-' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsx("span", { className: `text-sm font-semibold ${['DEPOSIT', 'PAYMENT_RECEIVED', 'PARTIAL_REPAYMENT'].includes(transaction.type)
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'}`, children: formatValue(transaction.amount) }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-center", children: _jsx("button", { onClick: () => setSelectedTransaction(transaction), className: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm", children: "Ver Detalhes" }) })] }, transaction.id)))) })] }) }) }), _jsx(TransactionDetailModal, { transaction: selectedTransaction, isOpen: !!selectedTransaction, onClose: () => setSelectedTransaction(null) })] }));
}
