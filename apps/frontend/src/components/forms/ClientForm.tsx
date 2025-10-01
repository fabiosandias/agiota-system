import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import InputMask from 'react-input-mask';
import type React from 'react';
import * as yup from 'yup';

export interface ClientFormValues {
  name: string;
  cpf: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

const schema = yup.object({
  name: yup.string().trim().required('Nome é obrigatório'),
  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .test('cpf-format', 'CPF incompleto', (value) => !value || value.replace(/\D/g, '').length === 11),
  phone: yup.string().nullable(),
  email: yup.string().nullable().email('E-mail inválido'),
  address: yup.string().nullable()
});

interface Props {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}

const ClientForm = ({ defaultValues, onSubmit, isSubmitting = false }: Props) => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting }
  } = useForm<ClientFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
      email: '',
      address: '',
      ...defaultValues
    }
  });

  const submitting = isSubmitting || formSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          Nome
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
          CPF
          <Controller
            control={control}
            name="cpf"
            render={({ field }) => (
              <InputMask
                mask="999.999.999-99"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
              >
                {(inputProps: unknown) => (
                  <input
                    {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                )}
              </InputMask>
            )}
          />
        </label>
        {errors.cpf && <span className="text-xs font-medium text-red-500">{errors.cpf.message}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Telefone
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <InputMask
                  mask="(99) 99999-9999"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  {(inputProps: unknown) => (
                    <input
                      {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  )}
                </InputMask>
              )}
            />
          </label>
          {errors.phone && <span className="text-xs font-medium text-red-500">{errors.phone.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            E-mail
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('email')}
            />
          </label>
          {errors.email && <span className="text-xs font-medium text-red-500">{errors.email.message}</span>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          Endereço
          <textarea
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            {...register('address')}
          />
        </label>
        {errors.address && <span className="text-xs font-medium text-red-500">{errors.address.message}</span>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
      >
        {submitting ? 'Salvando...' : 'Salvar cliente'}
      </button>
    </form>
  );
};

export default ClientForm;
