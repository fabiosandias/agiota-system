import { useMemo, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { NumericFormat } from 'react-number-format';
import { api } from '../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Account = {
  id: string;
  name: string;
  initialBalance: string;
  currentBalance: string;
  createdAt: string;
};

interface DepositFormValues {
  accountId: string;
  amount: number;
  description?: string | null;
}

const schema = yup.object({
  accountId: yup.string().required('Selecione uma conta'),
  amount: yup.number().positive('Informe um valor maior que zero').required('Valor é obrigatório'),
  description: yup.string().nullable()
});

const DepositPage = () => {
  const queryClient = useQueryClient();
  const { data: accountsResponse } = useQuery<{ success: boolean; data: Account[] }>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts');
      return response.data;
    }
  });

  const accounts = useMemo(() => accountsResponse?.data ?? [], [accountsResponse]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset
  } = useForm<DepositFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      accountId: '',
      amount: 0,
      description: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccessMessage(null);

    await api.post(`/accounts/${values.accountId}/deposit`, {
      amount: values.amount,
      description: values.description
    });

    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    await queryClient.invalidateQueries({ queryKey: ['total-balance'] });
    setSuccessMessage('Depósito realizado com sucesso!');
    reset({ accountId: values.accountId, amount: 0, description: '' });
  });

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Depósito na conta</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Registre um depósito na conta da empresa para disponibilizar saldo para novos empréstimos.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Conta
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('accountId')}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            {errors.accountId && <span className="mt-1 block text-xs font-medium text-red-500">{errors.accountId.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Valor do depósito
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <NumericFormat
                    value={field.value}
                    thousandSeparator="."
                    decimalSeparator="," 
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                    allowNegative={false}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue ?? 0);
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                )}
              />
            </label>
            {errors.amount && <span className="mt-1 block text-xs font-medium text-red-500">{errors.amount.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Observações (opcional)
              <textarea
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('description')}
              />
            </label>
            {errors.description && (
              <span className="mt-1 block text-xs font-medium text-red-500">{errors.description.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-70"
          >
            {isSubmitting ? 'Registrando depósito...' : 'Confirmar depósito'}
          </button>

          {successMessage && (
            <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {successMessage}
            </p>
          )}
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contas cadastradas</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Conta</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Saldo atual</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Saldo inicial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {accounts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500 dark:text-slate-400" colSpan={3}>
                    Nenhuma conta cadastrada.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{account.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                      {(Number(account.currentBalance) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-300">
                      {(Number(account.initialBalance) || 0).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </td>
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

export default DepositPage;
