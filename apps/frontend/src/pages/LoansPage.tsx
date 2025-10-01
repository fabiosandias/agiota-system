import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface LoanRow {
  id: string;
  principalAmount: string;
  interestRate: string;
  dueDate: string;
  status: 'active' | 'overdue' | 'paid' | 'renegotiated' | 'due_soon' | 'written_off';
  client: {
    name: string;
    email: string | null;
  };
}

const statusStyle: Record<LoanRow['status'], string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  due_soon: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  renegotiated: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  written_off: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200'
};

const LoansPage = () => {
  const { data, isLoading } = useQuery<{ success: boolean; data: LoanRow[] }>({
    queryKey: ['loans'],
    queryFn: async () => {
      const response = await api.get('/loans');
      return response.data;
    }
  });

  const loans = useMemo(() => data?.data ?? [], [data]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Empréstimos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe os contratos registrados e seus status.</p>
        </div>
        <Link
          to="/loans/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Novo empréstimo
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Valor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Juros</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Vencimento</th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                  Carregando empréstimos...
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={5}>
                  Nenhum empréstimo cadastrado até o momento.
                </td>
              </tr>
            ) : (
              loans.map((loan) => {
                const principalFormatted = Number(loan.principalAmount).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                });
                const interestFormatted = `${Number(loan.interestRate).toFixed(2)} %`;
                const dueDateFormatted = new Date(loan.dueDate).toLocaleDateString('pt-BR');

                return (
                  <tr key={loan.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <div className="font-medium">{loan.client.name}</div>
                      {loan.client.email && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">{loan.client.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{principalFormatted}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{interestFormatted}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{dueDateFormatted}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[loan.status]}`}>
                        {loan.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default LoansPage;
