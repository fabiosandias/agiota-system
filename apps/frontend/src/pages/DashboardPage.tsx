import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../utils/currency';
import LatestTransactions from '../components/dashboard/LatestTransactions';
import AccountBalanceCard from '../components/dashboard/AccountBalanceCard';
import AccountEvolutionChart from '../components/dashboard/AccountEvolutionChart';
import PageHeader from '../components/PageHeader';

interface LoanSummary {
  id: string;
  principalAmount: string;
  status: 'active' | 'due_soon' | 'overdue' | 'paid' | 'renegotiated' | 'written_off';
}

interface AccountSummary {
  id: string;
  name: string;
  currentBalance: string;
}

const DashboardPage = () => {
  const { showBalance } = useBalanceVisibility();
  const { data: loansData, isLoading: loadingLoans } = useQuery<{ success: boolean; data: LoanSummary[] }>({
    queryKey: ['loans'],
    queryFn: async () => {
      const response = await api.get('/loans');
      return response.data;
    }
  });

  const { data: accountsData, isLoading: loadingAccounts } = useQuery<{ success: boolean; data: AccountSummary[] }>({
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

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" showBackButton={false} />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Empréstimos ativos</span>
          <p className="mt-4 text-3xl font-semibold text-blue-700 dark:text-blue-300">
            {loadingLoans ? '...' : activeLoans}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Em atraso</span>
          <p className="mt-4 text-3xl font-semibold text-red-600 dark:text-red-400">
            {loadingLoans ? '...' : overdueLoans}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Quitados</span>
          <p className="mt-4 text-3xl font-semibold text-emerald-600 dark:text-emerald-300">
            {loadingLoans ? '...' : paidLoans}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo disponível</span>
          <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50">
            {loadingAccounts ? '...' : formatCurrencyWithPrivacy(availableBalance, showBalance)}
          </p>
        </div>
      </section>

      {/* Grid com Account Balance e Latest Transactions */}
      <section className="grid gap-6 lg:grid-cols-2">
        <AccountBalanceCard />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resumo Financeiro</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Total liberado em empréstimos: {loadingLoans ? '...' : formatCurrencyWithPrivacy(totalPrincipal, showBalance)}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Contas</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {loadingAccounts ? '...' : accounts.length}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Empréstimos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {loadingLoans ? '...' : loans.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gráfico de Evolução */}
      <AccountEvolutionChart />

      {/* Últimas Transações */}
      <LatestTransactions />
    </div>
  );
};

export default DashboardPage;
