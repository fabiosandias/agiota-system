import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../../utils/currency';
import TransactionDetailModal from './TransactionDetailModal';

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

interface TransactionsResponse {
  success: boolean;
  data: {
    items: Transaction[];
    total: number;
    has_more: boolean;
  };
}

const TRANSACTION_ICONS: Record<TransactionType, { icon: string; color: string }> = {
  LOAN_DISBURSED: { icon: '💰', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  PAYMENT_RECEIVED: { icon: '💵', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  PARTIAL_REPAYMENT: { icon: '📈', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  DEPOSIT: { icon: '⬇️', color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
  WITHDRAWAL: { icon: '⬆️', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  FEE: { icon: '📄', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  ADJUSTMENT: { icon: '⚙️', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/30' },
  INTEREST_ACCRUED: { icon: '📊', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' }
};

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  LOAN_DISBURSED: 'Empréstimo Desembolsado',
  PAYMENT_RECEIVED: 'Pagamento Recebido',
  PARTIAL_REPAYMENT: 'Pagamento Parcial',
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
  FEE: 'Taxa',
  ADJUSTMENT: 'Ajuste',
  INTEREST_ACCRUED: 'Juros Acumulados'
};

const STATUS_COLORS: Record<TransactionStatus, string> = {
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  CANCELED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

export default function LatestTransactions() {
  const { showBalance } = useBalanceVisibility();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const { data, isLoading, error } = useQuery<TransactionsResponse>({
    queryKey: ['latest-transactions'],
    queryFn: async () => {
      const response = await api.get<TransactionsResponse>('/v1/transactions?limit=10');
      return response.data;
    }
  });

  const transactions = data?.data?.items || [];

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-700 dark:text-red-300">Erro ao carregar transações</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Últimas Transações</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Histórico recente de movimentações</p>
        </div>
        <Link
          to="/transactions"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Ver todas →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Nenhuma transação encontrada</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
            As movimentações aparecerão aqui
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((transaction, index) => {
            const config = TRANSACTION_ICONS[transaction.type];
            const label = TRANSACTION_LABELS[transaction.type];
            const statusColor = STATUS_COLORS[transaction.status];
            const date = new Date(transaction.occurred_at);
            const isRecent = index < 3;

            return (
              <div
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className={`group relative flex items-center gap-4 rounded-xl border p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                  isRecent
                    ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/10'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                {/* Timeline connector */}
                {index < transactions.length - 1 && (
                  <div className="absolute left-[34px] top-[60px] h-6 w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}

                {/* Icon */}
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl ${config.color}`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                    >
                      {transaction.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {transaction.customer_name && <span>{transaction.customer_name} • </span>}
                    {transaction.account_name && <span>{transaction.account_name} • </span>}
                    <time dateTime={transaction.occurred_at}>
                      {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </p>
                  {transaction.notes && (
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-500">
                      {transaction.notes}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="flex flex-col items-end">
                  <p className={`text-lg font-bold ${transaction.type === 'PAYMENT_RECEIVED' || transaction.type === 'DEPOSIT' ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {formatCurrencyWithPrivacy(transaction.amount, showBalance)}
                  </p>
                  {transaction.reference_id && (
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {transaction.reference_id}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
}
