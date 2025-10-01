import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { NumericFormat } from 'react-number-format';
import type React from 'react';
import * as yup from 'yup';

export interface LoanFormValues {
  clientId: string;
  principalAmount: number;
  interestRate: number;
  dueDate: string;
  notes?: string | null;
}

const schema = yup.object({
  clientId: yup.string().trim().required('Cliente é obrigatório'),
  principalAmount: yup.number().moreThan(0, 'Valor deve ser maior que zero').required(),
  interestRate: yup.number().moreThan(0, 'Taxa deve ser maior que zero').required(),
  dueDate: yup.string().required('Data de vencimento é obrigatória'),
  notes: yup.string().nullable()
});

interface Props {
  clients: Array<{ id: string; name: string }>;
  defaultValues?: Partial<LoanFormValues>;
  onSubmit: (values: LoanFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}

const LoanForm = ({ clients, defaultValues, onSubmit, isSubmitting = false }: Props) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting }
  } = useForm<LoanFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: '',
      principalAmount: 0,
      interestRate: 0,
      dueDate: '',
      notes: '',
      ...defaultValues
    }
  });

  const submitting = isSubmitting || formSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          Cliente
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            {...register('clientId')}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
        {errors.clientId && <span className="text-xs font-medium text-red-500">{errors.clientId.message}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Valor solicitado
            <Controller
              control={control}
              name="principalAmount"
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
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              )}
            />
          </label>
          {errors.principalAmount && <span className="text-xs font-medium text-red-500">{errors.principalAmount.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Taxa de juros (%)
            <Controller
              control={control}
              name="interestRate"
              render={({ field }) => (
                <NumericFormat
                  value={field.value}
                  suffix=" %"
                  decimalScale={2}
                  decimalSeparator="," 
                  thousandSeparator="."
                  allowNegative={false}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue ?? 0);
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              )}
            />
          </label>
          {errors.interestRate && <span className="text-xs font-medium text-red-500">{errors.interestRate.message}</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          Data de vencimento
          <input
            type="date"
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            {...register('dueDate')}
          />
        </label>
        {errors.dueDate && <span className="text-xs font-medium text-red-500">{errors.dueDate.message}</span>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          Observações
          <textarea
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            {...register('notes')}
          />
        </label>
        {errors.notes && <span className="text-xs font-medium text-red-500">{errors.notes.message}</span>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
      >
        {submitting ? 'Salvando...' : 'Confirmar empréstimo'}
      </button>
    </form>
  );
};

export default LoanForm;
