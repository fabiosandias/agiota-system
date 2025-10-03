import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import ClientForm, {
  type ClientAddressFormValues,
  type ClientDocumentType,
  type ClientFormValues
} from '../components/forms/ClientForm';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Address {
  id: string;
  label: ClientAddressFormValues['label'] | string;
  postalCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

interface Client {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  document?: string | null;
  documentType?: ClientDocumentType | null;
  phone?: string | null;
  email?: string | null;
  birthDate?: string | null;
  createdAt: string;
  addresses: Address[];
}

interface ClientsResponse {
  success: boolean;
  data: Client[];
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

const formatDocument = (document?: string | null, type?: 'cpf' | 'cnpj' | null) => {
  if (!document) return '--';
  const digits = document.replace(/\D/g, '');
  if (type === 'cnpj' || digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return document;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

const ADDRESS_LABELS: ClientAddressFormValues['label'][] = ['primary', 'business', 'billing', 'shipping'];

const ensureAddressLabel = (label: string | undefined): ClientAddressFormValues['label'] =>
  ADDRESS_LABELS.includes(label as ClientAddressFormValues['label']) ? (label as ClientAddressFormValues['label']) : 'primary';

const sortAddresses = (addresses: Address[]) => {
  const order = ADDRESS_LABELS.reduce<Record<string, number>>((acc, current, index) => {
    acc[current] = index;
    return acc;
  }, {});

  return [...addresses].sort((a, b) => {
    const aOrder = order[ensureAddressLabel(a.label)] ?? addresses.length;
    const bOrder = order[ensureAddressLabel(b.label)] ?? addresses.length;
    return aOrder - bOrder;
  });
};

const toClientFormDefaults = (client: Client): Partial<ClientFormValues> => ({
  firstName: client.firstName ?? '',
  lastName: client.lastName ?? '',
  email: client.email ?? '',
  phone: client.phone ?? '',
  birthDate: client.birthDate ?? '',
  document: client.document ?? '',
  documentType: client.documentType ?? 'cpf',
  addresses: sortAddresses(client.addresses).map((address) => ({
    id: address.id,
    label: ensureAddressLabel(address.label),
    postalCode: address.postalCode ?? '',
    street: address.street ?? '',
    number: address.number ?? '',
    district: address.district ?? '',
    city: address.city ?? '',
    state: address.state ?? '',
    complement: address.complement ?? ''
  }))
});

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

const ClientsPage = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [filters, setFilters] = useState({ name: '', city: '', district: '' });
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const { user } = useAuth();
  const canManageClients = user?.role === 'admin' || user?.role === 'operator';

  const { data, isLoading, isFetching } = useQuery<ClientsResponse>({
    queryKey: ['clients', { searchTerm, filters, page, pageSize }],
    queryFn: async () => {
      const response = await api.get('/v1/clients', {
        params: {
          search: searchTerm || undefined,
          name: filters.name || undefined,
          city: filters.city || undefined,
          district: filters.district || undefined,
          page,
          pageSize
        }
      });
      return response.data;
    }
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters, pageSize]);

  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  const clients = useMemo(() => data?.data ?? [], [data]);
  const meta = data?.meta;

  const editingDefaults = useMemo<Partial<ClientFormValues> | undefined>(
    () => (editingClient ? toClientFormDefaults(editingClient) : undefined),
    [editingClient]
  );

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const response = await api.post('/v1/clients', values);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setFeedback('Cliente cadastrado com sucesso.');
      setErrorMessage(null);
      setPage(1);
    },
    onError: () => {
      setErrorMessage('Não foi possível cadastrar o cliente. Verifique os dados informados.');
      setFeedback(null);
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, values }: { clientId: string; values: ClientFormValues }) => {
      const response = await api.put(`/v1/clients/${clientId}`, values);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await api.delete(`/v1/clients/${clientId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const handleCreate = async (values: ClientFormValues) => {
    setFeedback(null);
    setErrorMessage(null);
    await createClient.mutateAsync(values);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchTerm(pendingSearch.trim());
  };

  const handleFiltersSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      name: pendingFilters.name.trim(),
      city: pendingFilters.city.trim(),
      district: pendingFilters.district.trim()
    });
  };

  const handleChangePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  const totalPages = meta?.totalPages ?? 1;

  const primaryAddress = (client: Client) =>
    client.addresses?.find((address) => address.label === 'primary') ?? client.addresses?.[0];

  const handleStartEdit = (client: Client) => {
    if (!canManageClients) return;
    setEditingClient(client);
    setFeedback(null);
    setErrorMessage(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
  };

  const handleUpdate = async (values: ClientFormValues) => {
    if (!canManageClients || !editingClient) return;
    setFeedback(null);
    setErrorMessage(null);
    try {
      await updateClientMutation.mutateAsync({ clientId: editingClient.id, values });
      setFeedback('Cliente atualizado com sucesso.');
      setEditingClient(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o cliente.'));
    }
  };

  const handleDelete = async (client: Client) => {
    if (!canManageClients) return;
    const confirmDelete =
      typeof window !== 'undefined' && window.confirm(`Deseja realmente excluir o cliente "${client.name}"?`);
    if (!confirmDelete) {
      return;
    }

    setFeedback(null);
    setErrorMessage(null);
    setDeletingClientId(client.id);

    try {
      await deleteClientMutation.mutateAsync(client.id);
      setFeedback('Cliente removido com sucesso.');
      if (editingClient?.id === client.id) {
        setEditingClient(null);
      }
      setPage((prev) => {
        if (prev > 1 && clients.length === 1) {
          return prev - 1;
        }
        return prev;
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Não foi possível remover o cliente.'));
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="space-y-10">
      {canManageClients ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Cadastrar cliente</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Utilize o formulário abaixo para cadastrar um novo cliente e os endereços principal e comercial.
          </p>
          <div className="mt-6 space-y-4">
            <ClientForm onSubmit={handleCreate} isSubmitting={createClient.isPending} />
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
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Você possui acesso somente leitura aos cadastros de clientes. Contate um administrador para solicitar permissões adicionais.
          </p>
        </section>
      )}

      {canManageClients && editingClient && editingDefaults && (
        <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm transition dark:border-amber-500/40 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-amber-700 dark:text-amber-300">Editar cliente</h2>
              <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-200/80">
                Atualize as informações do cliente selecionado. As alterações são aplicadas imediatamente após salvar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-500/60 dark:text-amber-200 dark:hover:bg-amber-500/10"
            >
              Cancelar edição
            </button>
          </div>
          <div className="mt-6">
            <ClientForm
              defaultValues={editingDefaults}
              onSubmit={handleUpdate}
              isSubmitting={updateClientMutation.isPending}
              resetAfterSubmit={false}
              submitLabel="Atualizar cliente"
              onCancel={handleCancelEdit}
            />
          </div>
        </section>
      )}

      <section className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Clientes cadastrados</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Utilize a busca global ou os filtros para encontrar um cliente. Resultados paginados em tempo real.
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Busca global (nome, documento, e-mail, telefone)"
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

        <form
          onSubmit={handleFiltersSubmit}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4"
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nome</label>
            <input
              type="text"
              value={pendingFilters.name}
              onChange={(event) => setPendingFilters((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bairro</label>
            <input
              type="text"
              value={pendingFilters.district}
              onChange={(event) => setPendingFilters((prev) => ({ ...prev, district: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cidade</label>
            <input
              type="text"
              value={pendingFilters.city}
              onChange={(event) => setPendingFilters((prev) => ({ ...prev, city: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Aplicar filtros
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>
              Página {meta?.page ?? 1} de {totalPages} · {meta?.total ?? clients.length} clientes
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline">Itens por página</span>
              <select
                value={pageSize}
                onChange={(event) => handleChangePageSize(Number(event.target.value))}
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
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Documento</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">E-mail</th>
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
                      Carregando clientes...
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={8}>
                      Nenhum cliente encontrado para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const address = primaryAddress(client);
                    return (
                      <tr key={client.id} className="bg-white dark:bg-slate-900">
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          <div className="font-medium">{client.name}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                          {formatDocument(client.document ?? undefined, client.documentType ?? undefined)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatPhone(client.phone)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{client.email ?? '--'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{address?.city ?? '--'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{address?.state ?? '--'}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatDate(client.createdAt)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                          {canManageClients ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(client)}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                disabled={updateClientMutation.isPending && editingClient?.id === client.id}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(client)}
                                className="rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10"
                                disabled={deletingClientId === client.id && deleteClientMutation.isPending}
                              >
                                {deletingClientId === client.id && deleteClientMutation.isPending ? 'Excluindo...' : 'Excluir'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-600">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
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

export default ClientsPage;
