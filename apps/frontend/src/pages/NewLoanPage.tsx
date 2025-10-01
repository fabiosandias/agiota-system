import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LoanForm, { type LoanFormValues } from '../components/forms/LoanForm';
import { api } from '../lib/api';

interface ClientOption {
  id: string;
  name: string;
}

interface LoanSummary {
  id: string;
  clientName: string;
  principalAmount: number;
  interestRate: number;
  dueDate: string;
  notes?: string | null;
}

const NewLoanPage = () => {
  const queryClient = useQueryClient();
  const { data: clientsResponse, isLoading } = useQuery<{ success: boolean; data: ClientOption[] }>({
    queryKey: ['clients', 'options'],
    queryFn: async () => {
      const response = await api.get('/clients');
      return {
        success: true,
        data: response.data.data.map((client: any) => ({ id: client.id, name: client.name }))
      };
    }
  });

  const clients = useMemo(() => clientsResponse?.data ?? [], [clientsResponse]);

  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createLoan = useMutation({
    mutationFn: async (values: LoanFormValues) => {
      const payload = {
        ...values,
        dueDate: values.dueDate
      };
      const response = await api.post('/loans', payload);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['loans'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] })
      ]);
    }
  });

  const handleSubmit = async (values: LoanFormValues) => {
    setSummary(null);
    setErrorMessage(null);

    try {
      const result = await createLoan.mutateAsync(values);
      const created = result.data;
      setSummary({
        id: created.id,
        clientName: created.client.name,
        principalAmount: Number(created.principalAmount),
        interestRate: Number(created.interestRate),
        dueDate: created.dueDate,
        notes: created.notes
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Não foi possível registrar o empréstimo. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Novo empréstimo</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Defina valor, taxa e vencimento para registrar um novo contrato de empréstimo.
        </p>
        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Carregando clientes...</p>
          ) : (
            <LoanForm clients={clients} onSubmit={handleSubmit} isSubmitting={createLoan.isPending} />
          )}
          {errorMessage && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resumo</h2>
        {summary ? (
          <dl className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <dt>Cliente</dt>
              <dd>{summary.clientName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Valor</dt>
              <dd>
                {summary.principalAmount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Juros</dt>
              <dd>{summary.interestRate.toFixed(2)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt>Vencimento</dt>
              <dd>{new Date(summary.dueDate).toLocaleDateString('pt-BR')}</dd>
            </div>
            {summary.notes ? (
              <div>
                <dt>Observações</dt>
                <dd className="mt-1 text-slate-500 dark:text-slate-400">{summary.notes}</dd>
              </div>
            ) : null}
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              Empréstimo registrado com sucesso!
            </p>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Preencha o formulário ao lado para visualizar um resumo do contrato.
          </p>
        )}
      </section>
    </div>
  );
};

export default NewLoanPage;
