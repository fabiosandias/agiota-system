import { FormEvent, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Client {
  id: string;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Account {
  id: string;
  name: string;
}

interface Installment {
  id: string;
  sequence: number;
  dueDate: string;
  totalDue: string | number;
  paidAmount: string | number;
  status: 'pending' | 'paid' | 'overdue';
}

interface Loan {
  id: string;
  principalAmount: string | number;
  interestRate: string | number;
  dueDate: string;
  status: 'active' | 'due_soon' | 'overdue' | 'paid' | 'defaulted';
  notes?: string | null;
  createdAt: string;
  client: Client;
  account: Account;
  installments: Installment[];
}

interface LoansResponse {
  success: boolean;
  data: Loan[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const statusStyle: Record<Loan['status'], { bg: string; label: string }> = {
  active: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300', label: 'Ativo' },
  due_soon: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', label: 'Vence em breve' },
  overdue: { bg: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300', label: 'Atrasado' },
  paid: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', label: 'Pago' },
  defaulted: { bg: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200', label: 'Inadimplente' }
};

const LoansPage = () => {
  const { user } = useAuth();
  const canManageLoans = user?.role === 'admin' || user?.role === 'operator';

  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Loan['status']>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery<LoansResponse>({
    queryKey: ['loans', { searchTerm, statusFilter, page, pageSize }],
    queryFn: async () => {
      const response = await api.get<LoansResponse>('/v1/loans', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          pageSize
        }
      });
      return response.data;
    }
  });

  const loans = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(pendingSearch.trim());
    setPage(1);
  };

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Empréstimos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Acompanhe os contratos registrados e seus status.
            </p>
          </div>
          {canManageLoans && (
            <Link
              to="/loans/new"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              + Novo empréstimo
            </Link>
          )}
        </div>

        {/* Filtros e Busca */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <input
              type="text"
              placeholder="Buscar por cliente ou documento..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Buscar
            </button>
          </form>

          <select
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="due_soon">Vence em breve</option>
            <option value="overdue">Atrasado</option>
            <option value="paid">Pago</option>
            <option value="defaulted">Inadimplente</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Valor Principal</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Taxa de Juros</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Parcelas</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Vencimento</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                      Carregando empréstimos...
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={6}>
                      {searchTerm || statusFilter !== 'all'
                        ? 'Nenhum empréstimo encontrado com os filtros aplicados.'
                        : 'Nenhum empréstimo cadastrado até o momento.'}
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => {
                    const paidInstallments = loan.installments.filter((i) => i.status === 'paid').length;
                    const totalInstallments = loan.installments.length;

                    return (
                      <tr key={loan.id} className="bg-white transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          <div className="font-medium">{loan.client.name}</div>
                          {loan.client.document && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">{loan.client.document}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                          {currency.format(Number(loan.principalAmount))}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                          {Number(loan.interestRate).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                          {paidInstallments}/{totalInstallments}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                          {new Date(loan.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[loan.status].bg}`}>
                            {statusStyle[loan.status].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação */}
        {meta && meta.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mostrando {(meta.page - 1) * meta.pageSize + 1} a {Math.min(meta.page * meta.pageSize, meta.total)} de {meta.total} empréstimos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Anterior
              </button>
              <span className="flex items-center px-3 text-sm text-slate-600 dark:text-slate-300">
                Página {meta.page} de {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default LoansPage;
