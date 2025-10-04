import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
import { translateTransactionStatus } from '../../utils/translations';

interface TransactionUser {
  id: string;
  name: string;
  email: string;
}

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  previous_balance: number | null;
  new_balance: number | null;
  currency: string;
  occurred_at: string;
  account_name?: string;
  customer_name?: string;
  notes?: string;
  user: TransactionUser | null;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TRANSACTION_LABELS: Record<string, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
  LOAN_DISBURSED: 'Empréstimo',
  PAYMENT_RECEIVED: 'Recebimento',
  PARTIAL_REPAYMENT: 'Pagamento Parcial',
  FEE: 'Taxa',
  ADJUSTMENT: 'Ajuste',
  INTEREST_ACCRUED: 'Juros Acumulados'
};

const TRANSACTION_COLORS: Record<string, string> = {
  DEPOSIT: 'text-green-700 bg-green-100 dark:bg-green-900/20',
  WITHDRAWAL: 'text-red-700 bg-red-100 dark:bg-red-900/20',
  LOAN_DISBURSED: 'text-orange-700 bg-orange-100 dark:bg-orange-900/20',
  PAYMENT_RECEIVED: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/20',
  PARTIAL_REPAYMENT: 'text-blue-700 bg-blue-100 dark:bg-blue-900/20',
  FEE: 'text-purple-700 bg-purple-100 dark:bg-purple-900/20',
  ADJUSTMENT: 'text-gray-700 bg-gray-100 dark:bg-gray-900/20',
  INTEREST_ACCRUED: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/20'
};

export default function TransactionDetailModal({ transaction, isOpen, onClose }: TransactionDetailModalProps) {
  const { showBalance } = useBalanceVisibility();

  if (!isOpen || !transaction) return null;

  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const formatValue = (value: number | null) => {
    if (!showBalance || value === null) return '•••••';
    return currency.format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Detalhes da Transação
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {transaction.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tipo e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Tipo de Transação
              </label>
              <div className="mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${TRANSACTION_COLORS[transaction.type]}`}>
                  {TRANSACTION_LABELS[transaction.type] || transaction.type}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Status
              </label>
              <div className="mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                  transaction.status === 'CANCELED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  {translateTransactionStatus(transaction.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Saldos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Saldo Anterior
              </label>
              <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                {formatValue(transaction.previous_balance)}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <label className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Valor da Transação
              </label>
              <p className="text-lg font-semibold text-blue-700 dark:text-blue-300 mt-1">
                {formatValue(transaction.amount)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <label className="text-xs font-medium text-green-600 dark:text-green-400">
                Saldo Atual
              </label>
              <p className="text-lg font-semibold text-green-700 dark:text-green-300 mt-1">
                {formatValue(transaction.new_balance)}
              </p>
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Data e Hora
            </label>
            <p className="text-base text-slate-900 dark:text-white mt-1">
              {formatDate(transaction.occurred_at)}
            </p>
          </div>

          {/* Usuário */}
          {transaction.user && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Executado por
              </label>
              <p className="text-base text-slate-900 dark:text-white mt-1">
                {transaction.user.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {transaction.user.email}
              </p>
            </div>
          )}

          {/* Conta */}
          {transaction.account_name && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Conta
              </label>
              <p className="text-base text-slate-900 dark:text-white mt-1">
                {transaction.account_name}
              </p>
            </div>
          )}

          {/* Cliente */}
          {transaction.customer_name && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {transaction.type === 'PAYMENT_RECEIVED' || transaction.type === 'PARTIAL_REPAYMENT' ? 'Cliente que Pagou' :
                 transaction.type === 'LOAN_DISBURSED' ? 'Cliente que Recebeu o Empréstimo' : 'Cliente'}
              </label>
              <p className="text-base text-slate-900 dark:text-white mt-1">
                {transaction.customer_name}
              </p>
            </div>
          )}

          {/* Observações */}
          {transaction.notes && (
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Observações
              </label>
              <p className="text-base text-slate-900 dark:text-white mt-1">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
