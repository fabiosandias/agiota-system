import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../lib/api';

interface Client {
  id: string;
  name: string;
  document?: string | null;
}

interface Account {
  id: string;
  name: string;
  currentBalance: string | number;
}

interface LoanFormValues {
  clientId: string;
  accountId: string;
  principalAmount: number;
  interestRate: number;
  dueDate: string;
  installments: number;
  notes?: string;
}

const schema = yup.object({
  clientId: yup.string().required('Selecione um cliente'),
  accountId: yup.string().required('Selecione uma conta'),
  principalAmount: yup
    .number()
    .positive('Valor deve ser positivo')
    .required('Valor principal é obrigatório')
    .typeError('Informe um valor válido'),
  interestRate: yup
    .number()
    .min(0, 'Taxa não pode ser negativa')
    .max(100, 'Taxa não pode ser maior que 100%')
    .required('Taxa de juros é obrigatória')
    .typeError('Informe uma taxa válida'),
  dueDate: yup.string().required('Data de vencimento é obrigatória'),
  installments: yup
    .number()
    .integer('Parcelas deve ser número inteiro')
    .positive('Parcelas deve ser positivo')
    .required('Número de parcelas é obrigatório')
    .typeError('Informe um número válido'),
  notes: yup.string().optional()
});

const NewLoanPage = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<LoanFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      principalAmount: 0,
      interestRate: 0,
      installments: 1,
      dueDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Client[] }>('/v1/clients', {
        params: { pageSize: 100 }
      });
      return response.data;
    }
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts', 'all'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: Account[] }>('/v1/accounts', {
        params: { pageSize: 100 }
      });
      return response.data;
    }
  });

  const clients = clientsData?.data ?? [];
  const accounts = accountsData?.data ?? [];

  const principalAmount = watch('principalAmount') || 0;
  const interestRate = watch('interestRate') || 0;
  const installments = watch('installments') || 1;

  const totalAmount = principalAmount * (1 + interestRate / 100);
  const installmentAmount = totalAmount / installments;

  const createLoan = useMutation({
    mutationFn: async (values: LoanFormValues) => {
      const dueDateISO = new Date(values.dueDate + 'T00:00:00').toISOString();
      const response = await api.post('/v1/loans', { ...values, dueDate: dueDateISO });
      return response.data;
    },
    onSuccess: () => {
      setFeedback('Empréstimo criado com sucesso!');
      setErrorMessage(null);
      setTimeout(() => navigate('/loans'), 1500);
    },
    onError: (error) => {
      setFeedback(null);
      if (isAxiosError(error)) {
        const data = error.response?.data as { error?: string; message?: string } | undefined;
        setErrorMessage(data?.error || data?.message || 'Não foi possível criar o empréstimo');
      } else {
        setErrorMessage('Não foi possível criar o empréstimo');
      }
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    await createLoan.mutateAsync(values);
  });

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate('/loans')} className="mb-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">
          ← Voltar para empréstimos
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Novo Empréstimo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados para criar um novo contrato de empréstimo.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Informações do Empréstimo</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Cliente *</label>
              <select {...register('clientId')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name} {client.document ? `(${client.document})` : ''}</option>
                ))}
              </select>
              {errors.clientId && <span className="mt-1 text-xs text-red-500">{errors.clientId.message}</span>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Conta de Origem *</label>
              <select {...register('accountId')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name} (Saldo: {currency.format(Number(account.currentBalance))})</option>
                ))}
              </select>
              {errors.accountId && <span className="mt-1 text-xs text-red-500">{errors.accountId.message}</span>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Valor Principal (R$) *</label>
              <input type="number" step="0.01" {...register('principalAmount')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="10000.00" />
              {errors.principalAmount && <span className="mt-1 text-xs text-red-500">{errors.principalAmount.message}</span>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Taxa de Juros (%) *</label>
              <input type="number" step="0.01" {...register('interestRate')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="5.00" />
              {errors.interestRate && <span className="mt-1 text-xs text-red-500">{errors.interestRate.message}</span>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Data de Vencimento *</label>
              <input type="date" {...register('dueDate')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
              {errors.dueDate && <span className="mt-1 text-xs text-red-500">{errors.dueDate.message}</span>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Número de Parcelas *</label>
              <input type="number" {...register('installments')} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="12" min="1" />
              {errors.installments && <span className="mt-1 text-xs text-red-500">{errors.installments.message}</span>}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">Observações (opcional)</label>
            <textarea {...register('notes')} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" placeholder="Informações adicionais sobre o empréstimo..." />
          </div>
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
          <h3 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">Resumo do Empréstimo</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Valor Principal</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{currency.format(principalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Valor Total (com juros)</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{currency.format(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Valor da Parcela</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{currency.format(installmentAmount)}</p>
            </div>
          </div>
        </section>

        {feedback && <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300">{feedback}</div>}
        {errorMessage && <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">{errorMessage}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/loans')} className="flex-1 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70">{isSubmitting ? 'Criando empréstimo...' : 'Criar empréstimo'}</button>
        </div>
      </form>
    </div>
  );
};

export default NewLoanPage;
