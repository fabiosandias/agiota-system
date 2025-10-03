import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import AccountForm, { type AccountFormValues, type AccountType } from '../components/forms/AccountForm';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Account {
  id: string;
  name: string;
  bankName?: string | null;
  branch?: string | null;
  accountNumber?: string | null;
  type: AccountType;
  openingBalance: string | number;
  currentBalance: string | number;
  createdAt: string;
  userId?: string | null;
}

interface AccountsResponse {
  success: boolean;
  data: Account[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (typeof data?.error === 'string' && data.error.trim().length > 0) {
      return data.error;
    }
    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
  }
  return fallback;
};

const toAccountFormDefaults = (account: Account): Partial<AccountFormValues> => ({
  name: account.name,
  bankName: account.bankName ?? '',
  branch: account.branch ?? '',
  accountNumber: account.accountNumber ?? '',
  type: account.type,
  openingBalance: Number(account.openingBalance)
});

const AccountsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AccountType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const canManageAccounts = user?.role === 'admin' || user?.role === 'operator';

  const { data, isLoading, isFetching } = useQuery<AccountsResponse>({
    queryKey: ['accounts', { searchTerm, typeFilter, page, pageSize }],
    queryFn: async () => {
      const response = await api.get<AccountsResponse>('/v1/accounts', {
        params: {
          search: searchTerm || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page,
          pageSize
        }
      });
      return response.data;
    }
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, typeFilter]);

  const accounts = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const editingDefaults = useMemo<Partial<AccountFormValues> | undefined>(
    () => (editingAccount ? toAccountFormDefaults(editingAccount) : undefined),
    [editingAccount]
  );

  const createAccount = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      const response = await api.post('/v1/accounts', values);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  const updateAccount = useMutation({
    mutationFn: async ({ accountId, values }: { accountId: string; values: AccountFormValues }) => {
      const response = await api.put(`/v1/accounts/${accountId}`, values);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/v1/accounts/${accountId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    }
  });

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(pendingSearch.trim());
  };

  const handleCreate = async (values: AccountFormValues) => {
    if (!canManageAccounts) return;
    setFeedback(null);
    setErrorMessage(null);
    try {
      await createAccount.mutateAsync(values);
      setFeedback('Conta cadastrada com sucesso.');
      setPage(1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar a conta.'));
    }
  };

  const handleStartEdit = (account: Account) => {
    if (!canManageAccounts) return;
    setEditingAccount(account);
    setFeedback(null);
    setErrorMessage(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const handleUpdate = async (values: AccountFormValues) => {
    if (!canManageAccounts || !editingAccount) return;
    setFeedback(null);
    setErrorMessage(null);
    try {
      await updateAccount.mutateAsync({ accountId: editingAccount.id, values });
      setFeedback('Conta atualizada com sucesso.');
      setEditingAccount(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar a conta.'));
    }
  };

  const handleDelete = async (account: Account) => {
    if (!canManageAccounts) return;
    const confirmDelete =
      typeof window !== 'undefined' && window.confirm(`Deseja realmente excluir a conta "${account.name}"?`);
    if (!confirmDelete) {
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    setDeletingAccountId(account.id);

    try {
      await deleteAccount.mutateAsync(account.id);
      setFeedback('Conta removida com sucesso.');
      if (editingAccount?.id === account.id) {
        setEditingAccount(null);
      }
      setPage((prev) => {
        if (prev > 1 && accounts.length === 1) {
          return prev - 1;
        }
        return prev;
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover a conta.'));
    } finally {
      setDeletingAccountId(null);
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-10">
      {canManageAccounts ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Cadastrar conta financeira</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie as contas utilizadas para registrar empréstimos, recebimentos e depósitos. É possível cadastrar contas da empresa ou compartilhadas.
          </p>
          <div className="mt-6 space-y-4">
            <AccountForm
              mode="create"
              onSubmit={handleCreate}
              isSubmitting={createAccount.isPending}
              submitLabel="Cadastrar conta"
            />
            {feedback && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300">
                {feedback}
              </p>
            )}
            {errorMessage && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
                {errorMessage}
              </p>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Contas financeiras</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Você possui acesso somente leitura às contas financeiras. Entre em contato com um administrador para realizar alterações.
          </p>
        </section>
      )}

      {canManageAccounts && editingAccount && editingDefaults && (
        <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm transition dark:border-emerald-500/40 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">Editar conta</h2>
              <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/80">
                Ajuste os dados da conta selecionada. O saldo inicial não pode ser alterado após a criação.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-emerald-500/60 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
            >
              Cancelar edição
            </button>
          </div>
          <div className="mt-6">
            <AccountForm
              mode="edit"
              defaultValues={editingDefaults}
              onSubmit={handleUpdate}
              isSubmitting={updateAccount.isPending}
              resetAfterSubmit={false}
              submitLabel="Atualizar conta"
              onCancel={handleCancelEdit}
            />
          </div>
        </section>
      )}

      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Contas cadastradas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Busque por nome, banco ou número da conta. Use o filtro para visualizar apenas contas correntes ou poupança.
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Buscar por nome, banco ou número"
              value={pendingSearch}
              onChange={(event) => setPendingSearch(event.target.value)}
              className="w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">Todos os tipos</option>
              <option value="checking">Conta corrente</option>
              <option value="savings">Conta poupança</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Aplicar
            </button>
          </form>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>
              Página {meta?.page ?? 1} de {totalPages} · {meta?.total ?? accounts.length} contas
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline">Itens por página</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Banco</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Agência</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Conta</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Saldo atual</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Criado em</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading || isFetching ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                      Carregando contas...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                      Nenhuma conta encontrada para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{account.name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{account.bankName ?? '--'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{account.branch ?? '--'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{account.accountNumber ?? '--'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                        {account.type === 'checking' ? 'Conta corrente' : 'Conta poupança'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-300">
                        {currency.format(Number(account.currentBalance))}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{new Date(account.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                        {canManageAccounts ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(account)}
                              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              disabled={updateAccount.isPending && editingAccount?.id === account.id}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(account)}
                              className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10"
                              disabled={deletingAccountId === account.id && deleteAccount.isPending}
                            >
                              {deletingAccountId === account.id && deleteAccount.isPending ? 'Excluindo...' : 'Excluir'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-600">--</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountsPage;
