import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import TransactionDetailModal from '../components/dashboard/TransactionDetailModal';
import { translateTransactionType, translateTransactionStatus } from '../utils/translations';

type TransactionType =
  | 'LOAN_DISBURSED'
  | 'PAYMENT_RECEIVED'
  | 'PARTIAL_REPAYMENT'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'FEE'
  | 'ADJUSTMENT'
  | 'INTEREST_ACCRUED';

type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'FAILED';

interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  previous_balance: number | null;
  new_balance: number | null;
  currency: string;
  occurred_at: string;
  account_id?: string;
  account_name?: string;
  loan_id?: string;
  customer_name?: string;
  reference_id?: string;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  LOAN_DISBURSED: 'Empréstimo',
  PAYMENT_RECEIVED: 'Recebimento',
  PARTIAL_REPAYMENT: 'Pagamento Parcial',
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
  FEE: 'Taxa',
  ADJUSTMENT: 'Ajuste',
  INTEREST_ACCRUED: 'Juros Acumulados'
};

const TRANSACTION_COLORS: Record<TransactionType, string> = {
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('from', filters.dateFrom);
      if (filters.dateTo) params.append('to', filters.dateTo);

      const response = await api.get(`/v1/transactions?${params.toString()}&limit=50`);
      return response.data;
    }
  });

  const transactions: Transaction[] = data?.data?.items || [];

  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const formatValue = (value: number) => {
    if (!showBalance) return '•••••';
    return currency.format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transações</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Histórico completo de movimentações financeiras
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Transação
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="DEPOSIT">Depósito</option>
                <option value="WITHDRAWAL">Saque</option>
                <option value="LOAN_DISBURSED">Empréstimo</option>
                <option value="PAYMENT_RECEIVED">Recebimento</option>
                <option value="PARTIAL_REPAYMENT">Pagamento Parcial</option>
                <option value="FEE">Taxa</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ type: '', clientId: '', userId: '', dateFrom: '', dateTo: '' })}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cliente/Conta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Carregando transações...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${TRANSACTION_COLORS[transaction.type]}`}>
                        {TRANSACTION_LABELS[transaction.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {transaction.customer_name && (
                          <div className="font-medium text-slate-900 dark:text-white">
                            {transaction.customer_name}
                          </div>
                        )}
                        {transaction.account_name && (
                          <div className="text-slate-500 dark:text-slate-400">
                            {transaction.account_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {formatDate(transaction.occurred_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {transaction.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-semibold ${
                        ['DEPOSIT', 'PAYMENT_RECEIVED', 'PARTIAL_REPAYMENT'].includes(transaction.type)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatValue(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
