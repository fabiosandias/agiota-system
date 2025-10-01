import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ClientForm, { type ClientFormValues } from '../components/forms/ClientForm';
import { api } from '../lib/api';

interface Client {
  id: string;
  name: string;
  cpf: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: string;
}

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (value?: string | null) => {
  if (!value) return '--';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) return value;
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const ClientsPage = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: Client[] }>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return response.data;
    }
  });

  const clients = useMemo(() => data?.data ?? [], [data]);

  const createClient = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const response = await api.post('/clients', values);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['clients', 'options'] })
      ]);
      setFeedback('Cliente cadastrado com sucesso.');
    },
    onError: () => {
      setErrorMessage('Não foi possível cadastrar o cliente. Verifique os dados informados.');
    }
  });

  const handleCreate = async (values: ClientFormValues) => {
    setFeedback(null);
    setErrorMessage(null);
    await createClient.mutateAsync(values);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Cadastrar cliente</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Utilize o formulário abaixo para cadastrar um novo cliente com validação de CPF e telefone.
        </p>
        <div className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
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

      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Clientes cadastrados</h2>
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">CPF</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">E-mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500 dark:text-slate-400" colSpan={4}>
                    Carregando clientes...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-slate-500 dark:text-slate-400" colSpan={4}>
                    Nenhum cliente cadastrado ainda.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <div className="font-medium">{client.name}</div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Cadastrado em {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatCpf(client.cpf)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{formatPhone(client.phone)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">{client.email ?? '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ClientsPage;
