import { useEffect, useMemo, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Controller, type Resolver, type SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../../lib/api';

type UserRole = 'admin' | 'operator' | 'viewer';

type FormMode = 'create' | 'edit';

type PostalCodeResponse = {
  postalCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
};

export interface UserAddressFormValues {
  postalCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  address: UserAddressFormValues;
}

interface Props {
  mode?: FormMode;
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  resetAfterSubmit?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

const addressSchema = yup.object({
  postalCode: yup
    .string()
    .required('CEP é obrigatório')
    .test('cep-length', 'CEP inválido', (value) => (value ?? '').replace(/\D/g, '').length === 8),
  street: yup.string().trim().required('Logradouro é obrigatório'),
  number: yup.string().trim().required('Número é obrigatório'),
  district: yup.string().trim().required('Bairro é obrigatório'),
  city: yup.string().trim().required('Cidade é obrigatória'),
  state: yup
    .string()
    .trim()
    .required('UF é obrigatória')
    .test('state-length', 'UF deve ter 2 letras', (value) => (value ?? '').trim().length === 2),
  complement: yup.string().nullable()
});

const schema = yup
  .object({
    firstName: yup.string().trim().min(2, 'Nome é obrigatório').required('Nome é obrigatório'),
    lastName: yup.string().trim().min(2, 'Sobrenome é obrigatório').required('Sobrenome é obrigatório'),
    email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    phone: yup
      .string()
      .required('Telefone é obrigatório')
      .test('phone-length', 'Telefone inválido', (value) => (value ?? '').replace(/\D/g, '').length >= 10),
    role: yup.mixed<UserRole>().oneOf(['admin', 'operator', 'viewer']).required('Selecione a função'),
    password: yup
      .string()
      .transform((value) => (value ? value.trim() : ''))
      .when('$requirePassword', {
        is: true,
        then: (schema) => schema.min(8, 'Senha deve ter ao menos 8 caracteres').required('Senha é obrigatória'),
        otherwise: (schema) => schema.optional().test({
          name: 'password-length',
          message: 'Senha deve ter ao menos 8 caracteres',
          test: (value) => !value || value.length >= 8
        })
      }),
    address: addressSchema
  })
  .required();

const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

const hasAddressData = (address: UserAddressFormValues) =>
  Boolean(address.street || address.city || address.district || address.number);

const formatPostalCode = (value?: string | null) => {
  if (!value) return '';
  const digits = sanitizeDigits(value);
  if (digits.length !== 8) return value;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
};

const UserForm = ({
  mode = 'create',
  defaultValues,
  onSubmit,
  isSubmitting = false,
  resetAfterSubmit = true,
  submitLabel = 'Salvar usuário',
  onCancel
}: Props) => {
  const formDefaults = useMemo<UserFormValues>(() => ({
    firstName: defaultValues?.firstName ?? '',
    lastName: defaultValues?.lastName ?? '',
    email: defaultValues?.email ?? '',
    phone: defaultValues?.phone ?? '',
    role: defaultValues?.role ?? 'operator',
    password: '',
    address: {
      postalCode: formatPostalCode(defaultValues?.address?.postalCode ?? ''),
      street: defaultValues?.address?.street ?? '',
      number: defaultValues?.address?.number ?? '',
      district: defaultValues?.address?.district ?? '',
      city: defaultValues?.address?.city ?? '',
      state: (defaultValues?.address?.state ?? '').toUpperCase(),
      complement: defaultValues?.address?.complement ?? ''
    }
  }), [defaultValues]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting: formSubmitting }
  } = useForm<UserFormValues>({
    resolver: yupResolver(schema) as Resolver<UserFormValues>,
    defaultValues: formDefaults,
    context: { requirePassword: mode === 'create' }
  });

  const [addressLocked, setAddressLocked] = useState(() => !hasAddressData(formDefaults.address));
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    reset(formDefaults);
    setAddressLocked(!hasAddressData(formDefaults.address));
    setAddressError(null);
  }, [formDefaults, reset]);

  const submitting = isSubmitting || formSubmitting;

  const handleLookupPostalCode = async () => {
    const postalCode = sanitizeDigits(getValues('address.postalCode') ?? '');

    if (postalCode.length !== 8) {
      setAddressError('CEP inválido');
      return;
    }

    try {
      const { data } = await api.get<{ success: boolean; data: PostalCodeResponse }>(`/v1/postal-codes/${postalCode}`);
      const address = data.data;

      setValue('address.postalCode', address.postalCode);
      setValue('address.street', address.street);
      setValue('address.district', address.district);
      setValue('address.city', address.city);
      setValue('address.state', address.state);
      setValue('address.complement', address.complement ?? '');
      setAddressLocked(false);
      setAddressError(null);
    } catch (error) {
      setAddressLocked(false);
      setAddressError('Não foi possível localizar o CEP. Preencha os dados manualmente.');
    }
  };

  const onSubmitHandler: SubmitHandler<UserFormValues> = async (values) => {
    const payload: UserFormValues = {
      ...values,
      phone: sanitizeDigits(values.phone),
      password: values.password?.trim() ? values.password.trim() : undefined,
      address: {
        postalCode: sanitizeDigits(values.address.postalCode),
        street: values.address.street,
        number: values.address.number,
        district: values.address.district,
        city: values.address.city,
        state: values.address.state.toUpperCase(),
        complement: values.address.complement?.trim() ? values.address.complement.trim() : null
      }
    };

    await onSubmit(payload);

    if (resetAfterSubmit) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'operator',
        password: '',
        address: {
          postalCode: '',
          street: '',
          number: '',
          district: '',
          city: '',
          state: '',
          complement: ''
        }
      });
      setAddressLocked(true);
      setAddressError(null);
    } else {
      reset({
        ...payload,
        password: '',
        address: {
          ...payload.address,
          postalCode: formatPostalCode(payload.address.postalCode),
          complement: payload.address.complement ?? ''
        }
      });
      setAddressLocked(false);
      setAddressError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Nome
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('firstName')}
            />
          </label>
          {errors.firstName && <span className="text-xs font-medium text-red-500">{errors.firstName.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Sobrenome
            <input
              type="text"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('lastName')}
            />
          </label>
          {errors.lastName && <span className="text-xs font-medium text-red-500">{errors.lastName.message}</span>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Telefone
            <input
              type="text"
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('phone')}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                let formatted = value;
                if (value.length > 10) {
                  formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                } else if (value.length > 6) {
                  formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6, 10)}`;
                } else if (value.length > 2) {
                  formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                }
                e.target.value = formatted;
                register('phone').onChange(e);
              }}
            />
          </label>
          {errors.phone && <span className="text-xs font-medium text-red-500">{errors.phone.message}</span>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            Função
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('role')}
            >
              <option value="admin">Administrador</option>
              <option value="operator">Operador</option>
              <option value="viewer">Visualizador</option>
            </select>
          </label>
          {errors.role && <span className="text-xs font-medium text-red-500">{errors.role.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
            {mode === 'create' ? 'Senha temporária' : 'Nova senha (opcional)'}
            <input
              type="password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('password')}
            />
          </label>
          {errors.password && <span className="text-xs font-medium text-red-500">{errors.password.message}</span>}
        </div>
      </div>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Endereço principal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Utilize a busca de CEP para preencher automaticamente ou desbloqueie os campos para edição manual.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLookupPostalCode}
              className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              Buscar CEP
            </button>
            <button
              type="button"
              onClick={() => {
                setAddressLocked(false);
                setAddressError(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Preencher manualmente
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[160px,1fr,1fr]">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              CEP
              <input
                type="text"
                placeholder="00000-000"
                maxLength={9}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('address.postalCode')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const formatted = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5, 8)}` : value;
                  e.target.value = formatted;
                  register('address.postalCode').onChange(e);
                }}
              />
            </label>
            {errors.address?.postalCode && (
              <span className="text-xs font-medium text-red-500">{errors.address.postalCode.message}</span>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Logradouro
              <input
                type="text"
                disabled={addressLocked}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('address.street')}
              />
            </label>
            {errors.address?.street && (
              <span className="text-xs font-medium text-red-500">{errors.address.street.message}</span>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Número
              <input
                type="text"
                disabled={addressLocked}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('address.number')}
              />
            </label>
            {errors.address?.number && (
              <span className="text-xs font-medium text-red-500">{errors.address.number.message}</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Bairro
              <input
                type="text"
                disabled={addressLocked}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('address.district')}
              />
            </label>
            {errors.address?.district && (
              <span className="text-xs font-medium text-red-500">{errors.address.district.message}</span>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Cidade
              <input
                type="text"
                disabled={addressLocked}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('address.city')}
              />
            </label>
            {errors.address?.city && (
              <span className="text-xs font-medium text-red-500">{errors.address.city.message}</span>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              UF
              <input
                type="text"
                maxLength={2}
                disabled={addressLocked}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('address.state')}
              />
            </label>
            {errors.address?.state && (
              <span className="text-xs font-medium text-red-500">{errors.address.state.message}</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Complemento (opcional)
            <input
              type="text"
              disabled={addressLocked}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('address.complement')}
            />
          </label>
        </div>

        {addressError && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{addressError}</p>
        )}
      </section>

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

export default UserForm;
