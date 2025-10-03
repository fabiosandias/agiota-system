import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import UserForm, { type UserFormValues } from '../components/forms/UserForm';
import { api } from '../lib/api';

interface UserAddress {
  postalCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  complement?: string | null;
}

type UserRole = UserFormValues['role'];

interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  address?: UserAddress | null;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const formatPhone = (value?: string | null) => {
  if (!value) return '--';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  operator: 'Operador',
  viewer: 'Visualizador'
};

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

const toUserFormDefaults = (user: User): Partial<UserFormValues> => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email,
  phone: user.phone ?? '',
  role: user.role,
  address: {
    postalCode: user.address?.postalCode ?? '',
    street: user.address?.street ?? '',
    number: user.address?.number ?? '',
    district: user.address?.district ?? '',
    city: user.address?.city ?? '',
    state: user.address?.state ?? '',
    complement: user.address?.complement ?? ''
  }
});

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery<UsersResponse>({
    queryKey: ['users', { searchTerm, page, pageSize }],
    queryFn: async () => {
      const response = await api.get<UsersResponse>('/v1/users', {
        params: {
          search: searchTerm || undefined,
          page,
          pageSize
        }
      });
      return response.data;
    }
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  const users = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const editingDefaults = useMemo<Partial<UserFormValues> | undefined>(
    () => (editingUser ? toUserFormDefaults(editingUser) : undefined),
    [editingUser]
  );

  const createUser = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const response = await api.post('/v1/users', values);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: UserFormValues }) => {
      const response = await api.put(`/v1/users/${userId}`, values);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/v1/users/${userId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(pendingSearch.trim());
  };

  const handleCreate = async (values: UserFormValues) => {
    setFeedback(null);
    setErrorMessage(null);
    try {
      await createUser.mutateAsync(values);
      setFeedback('Usuário cadastrado com sucesso.');
      setPage(1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar o usuário.'));
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setFeedback(null);
    setErrorMessage(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUpdate = async (values: UserFormValues) => {
    if (!editingUser) return;
    setFeedback(null);
    setErrorMessage(null);
    try {
      await updateUser.mutateAsync({ userId: editingUser.id, values });
      setFeedback('Usuário atualizado com sucesso.');
      setEditingUser(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o usuário.'));
    }
  };

  const handleDelete = async (user: User) => {
    const confirmDelete =
      typeof window !== 'undefined' && window.confirm(`Deseja realmente excluir o usuário "${user.email}"?`);
    if (!confirmDelete) {
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    setDeletingUserId(user.id);

    try {
      await deleteUser.mutateAsync(user.id);
      setFeedback('Usuário removido com sucesso.');
      if (editingUser?.id === user.id) {
        setEditingUser(null);
      }
      setPage((prev) => {
        if (prev > 1 && users.length === 1) {
          return prev - 1;
        }
        return prev;
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover o usuário.'));
    } finally {
      setDeletingUserId(null);
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Cadastrar usuário interno</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Registre novos membros da equipe, definindo o papel e endereço principal. A senha informada será utilizada no
          primeiro acesso.
        </p>
        <div className="mt-6 space-y-4">
          <UserForm
            mode="create"
            onSubmit={handleCreate}
            isSubmitting={createUser.isPending}
            submitLabel="Cadastrar usuário"
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

      {editingUser && editingDefaults && (
        <section className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm transition dark:border-indigo-500/40 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">Editar usuário</h2>
              <p className="mt-1 text-sm text-indigo-700/80 dark:text-indigo-200/80">
                Atualize os dados pessoais e o endereço do colaborador. Deixe o campo de senha em branco para mantê-la
                inalterada.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-500/60 dark:text-indigo-200 dark:hover:bg-indigo-500/10"
            >
              Cancelar edição
            </button>
          </div>
          <div className="mt-6">
            <UserForm
              mode="edit"
              defaultValues={editingDefaults}
              onSubmit={handleUpdate}
              isSubmitting={updateUser.isPending}
              resetAfterSubmit={false}
              submitLabel="Atualizar usuário"
              onCancel={handleCancelEdit}
            />
          </div>
        </section>
      )}

      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Usuários cadastrados</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Utilize a busca para localizar usuários por nome, e-mail ou telefone. Resultados paginados.
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Buscar por nome, e-mail ou telefone"
              value={pendingSearch}
              onChange={(event) => setPendingSearch(event.target.value)}
              className="w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Buscar
            </button>
          </form>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>
              Página {meta?.page ?? 1} de {totalPages} · {meta?.total ?? users.length} usuários
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
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Função</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Cidade</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">UF</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Criado em</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading || isFetching ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                      Carregando usuários...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                      Nenhum usuário encontrado para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        <div className="font-medium">
                          {user.firstName || user.lastName
                            ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                            : (user.name ?? user.email)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{user.email}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatPhone(user.phone)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{ROLE_LABELS[user.role]}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{user.address?.city ?? '--'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{user.address?.state ?? '--'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(user)}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            disabled={updateUser.isPending && editingUser?.id === user.id}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(user)}
                            className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10"
                            disabled={deletingUserId === user.id && deleteUser.isPending}
                          >
                            {deletingUserId === user.id && deleteUser.isPending ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
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

export default UsersPage;
