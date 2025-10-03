import { useEffect, useMemo } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

export type AccountType = 'checking' | 'savings';

type FormMode = 'create' | 'edit';

export interface AccountFormValues {
  name: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  type: AccountType;
  openingBalance?: number;
}

interface Props {
  mode?: FormMode;
  defaultValues?: Partial<AccountFormValues>;
  onSubmit: (values: AccountFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  resetAfterSubmit?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

const schema = yup
  .object({
    name: yup.string().trim().min(2, 'Nome é obrigatório').required('Nome é obrigatório'),
    bankName: yup.string().trim().min(2, 'Banco é obrigatório').required('Banco é obrigatório'),
    branch: yup.string().trim().min(1, 'Agência é obrigatória').required('Agência é obrigatória'),
    accountNumber: yup.string().trim().min(1, 'Conta é obrigatória').required('Conta é obrigatória'),
    type: yup.mixed<AccountType>().oneOf(['checking', 'savings']).required('Selecione o tipo de conta'),
    openingBalance: yup
      .number()
      .transform((value) => (Number.isFinite(value) ? value : NaN))
      .when('$requireOpeningBalance', {
        is: true,
        then: (schema) => schema.min(0, 'Valor inválido').required('Informe o saldo inicial'),
        otherwise: (schema) => schema.min(0, 'Valor inválido').optional()
      })
  })
  .required();

const AccountForm = ({
  mode = 'create',
  defaultValues,
  onSubmit,
  isSubmitting = false,
  resetAfterSubmit = true,
  submitLabel = 'Salvar conta',
  onCancel
}: Props) => {
  const formDefaults = useMemo<AccountFormValues>(() => ({
    name: defaultValues?.name ?? '',
    bankName: defaultValues?.bankName ?? '',
    branch: defaultValues?.branch ?? '',
    accountNumber: defaultValues?.accountNumber ?? '',
    type: defaultValues?.type ?? 'checking',
    openingBalance: defaultValues?.openingBalance ?? 0
  }), [defaultValues]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: formSubmitting }
  } = useForm<AccountFormValues>({
    resolver: yupResolver(schema) as Resolver<AccountFormValues>,
    defaultValues: formDefaults,
    context: { requireOpeningBalance: mode === 'create' }
  });

  useEffect(() => {
    reset(formDefaults);
  }, [formDefaults, reset]);

  const submitting = isSubmitting || formSubmitting;

  const onSubmitHandler: SubmitHandler<AccountFormValues> = async (values) => {
    const payload: AccountFormValues = {
      ...values,
      openingBalance: mode === 'create' ? values.openingBalance ?? 0 : undefined
    };

    await onSubmit(payload);

    if (resetAfterSubmit) {
      reset({
        name: '',
        bankName: '',
        branch: '',
        accountNumber: '',
        type: 'checking',
        openingBalance: 0
      });
    } else {
      reset({
        ...payload,
        openingBalance: mode === 'create' ? payload.openingBalance ?? 0 : formDefaults.openingBalance
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Nome da conta
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('name')}
            />
          </label>
          {errors.name && <span className="text-xs font-medium text-red-500">{errors.name.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Banco
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('bankName')}
            />
          </label>
          {errors.bankName && <span className="text-xs font-medium text-red-500">{errors.bankName.message}</span>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Agência
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('branch')}
            />
          </label>
          {errors.branch && <span className="text-xs font-medium text-red-500">{errors.branch.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Número da conta
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('accountNumber')}
            />
          </label>
          {errors.accountNumber && <span className="text-xs font-medium text-red-500">{errors.accountNumber.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Tipo de conta
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('type')}
            >
              <option value="checking">Conta corrente</option>
              <option value="savings">Conta poupança</option>
            </select>
          </label>
          {errors.type && <span className="text-xs font-medium text-red-500">{errors.type.message}</span>}
        </div>
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Saldo inicial
            <input
              type="number"
              step="0.01"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('openingBalance', { valueAsNumber: true })}
            />
          </label>
          {errors.openingBalance && (
            <span className="text-xs font-medium text-red-500">{errors.openingBalance.message}</span>
          )}
        </div>
      )}

      <div className={onCancel ? 'flex flex-col gap-3 sm:flex-row sm:justify-end' : undefined}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`${onCancel ? '' : 'w-full '}rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70`}
        >
          {submitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default AccountForm;
