import { useEffect, useMemo, useRef, useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Controller, type Resolver, type SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../../lib/api';

export type ClientDocumentType = 'cpf' | 'cnpj';

export interface ClientAddressFormValues {
  id?: string;
  label: 'primary' | 'business' | 'billing' | 'shipping';
  postalCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

export interface ClientFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  document: string;
  documentType: ClientDocumentType;
  addresses: ClientAddressFormValues[];
}

const documentSchema = yup
  .string()
  .required('Documento é obrigatório')
  .test('document-length', 'Documento inválido', function validate(value) {
    const type = this.parent.documentType as ClientDocumentType;
    const digits = (value ?? '').replace(/\D/g, '');
    if (type === 'cpf') {
      return digits.length === 11;
    }
    return digits.length === 14;
  });

const addressSchema = yup.object({
  label: yup.mixed<ClientAddressFormValues['label']>().oneOf(['primary', 'business', 'billing', 'shipping']).required(),
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

const schema = yup.object({
  firstName: yup.string().trim().min(2, 'Nome é obrigatório').required('Nome é obrigatório'),
  lastName: yup.string().trim().min(2, 'Sobrenome é obrigatório').required('Sobrenome é obrigatório'),
  email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  phone: yup
    .string()
    .required('Telefone é obrigatório')
    .test('phone-length', 'Telefone inválido', (value) => (value ?? '').replace(/\D/g, '').length >= 10),
  birthDate: yup.string().required('Data de nascimento é obrigatória'),
  documentType: yup.mixed<ClientDocumentType>().oneOf(['cpf', 'cnpj']).required(),
  document: documentSchema,
  addresses: yup
    .array(addressSchema)
    .min(1, 'Informe pelo menos um endereço')
});

interface Props {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  resetAfterSubmit?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

const ADDRESS_LABELS: ClientAddressFormValues['label'][] = ['primary', 'business', 'billing', 'shipping'];

const defaultAddresses: ClientAddressFormValues[] = [
  {
    id: undefined,
    label: 'primary',
    postalCode: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    complement: ''
  },
  {
    id: undefined,
    label: 'business',
    postalCode: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: '',
    complement: ''
  }
];

const getDocumentMask = (type: ClientDocumentType) => (type === 'cpf' ? '999.999.999-99' : '99.999.999/9999-99');

const sanitizeDigits = (value: string) => value.replace(/\D/g, '');

const formatDateForInput = (value?: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().slice(0, 10);
};

const formatPostalCode = (value?: string | null) => {
  if (!value) return '';
  const digits = sanitizeDigits(value);
  if (digits.length !== 8) return value;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
};

interface AddressState {
  unlocked: boolean;
  error?: string | null;
}

interface PostalCodeResponse {
  postalCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

const ClientForm = ({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  resetAfterSubmit = true,
  submitLabel = 'Salvar cliente',
  onCancel
}: Props) => {
  const formDefaults: ClientFormValues = useMemo(() => {
    const baseAddresses = defaultValues?.addresses?.length
      ? defaultValues.addresses.map((address) => ({
          id: address.id,
          label: address.label,
          postalCode: formatPostalCode(address.postalCode ?? ''),
          street: address.street ?? '',
          number: address.number ?? '',
          district: address.district ?? '',
          city: address.city ?? '',
          state: (address.state ?? '').toUpperCase(),
          complement: address.complement ?? ''
        }))
      : defaultAddresses.map((address) => ({ ...address }));

    return {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      birthDate: formatDateForInput(defaultValues?.birthDate ?? ''),
      document: defaultValues?.document ?? '',
      documentType: defaultValues?.documentType ?? 'cpf',
      addresses: baseAddresses
    };
  }, [defaultValues]);

  const form = useForm<ClientFormValues>({
    resolver: yupResolver(schema) as Resolver<ClientFormValues>,
    defaultValues: formDefaults
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting: formSubmitting }
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: 'addresses' });

  const documentType = useWatch<ClientFormValues>({ control, name: 'documentType' }) ?? 'cpf';
  const documentMask = useMemo(() => getDocumentMask(documentType as ClientDocumentType), [documentType]);

  const [addressStates, setAddressStates] = useState<AddressState[]>(() =>
    formDefaults.addresses.map((address) => ({
      unlocked: Boolean(address.street || address.city || address.district || address.number),
      error: null
    }))
  );

  useEffect(() => {
    reset(formDefaults);
    setAddressStates(
      formDefaults.addresses.map((address) => ({
        unlocked: Boolean(address.street || address.city || address.district || address.number),
        error: null
      }))
    );
  }, [formDefaults, reset]);

  useEffect(() => {
    setAddressStates((prev) =>
      fields.map((field, index) => {
        const hasData = Boolean(field.street || field.city || field.district || field.number);
        return prev[index] ?? { unlocked: hasData, error: null };
      })
    );
  }, [fields]);

  const initialDocumentType = useRef(documentType);

  useEffect(() => {
    if (initialDocumentType.current !== documentType) {
      setValue('document', '');
    }
  }, [documentType, setValue]);

  const submitting = isSubmitting || formSubmitting;

  const unlockAddress = (index: number) => {
    setAddressStates((prev) =>
      prev.map((state, idx) => (idx === index ? { ...state, unlocked: true, error: null } : state))
    );
  };

  const handleLookupPostalCode = async (index: number) => {
    const postalCodeValue = getValues(`addresses.${index}.postalCode`);
    const sanitized = sanitizeDigits(postalCodeValue ?? '');

    if (sanitized.length !== 8) {
      setAddressStates((prev) =>
        prev.map((state, idx) => (idx === index ? { ...state, error: 'CEP inválido' } : state))
      );
      return;
    }

    try {
      const { data } = await api.get<{ success: boolean; data: PostalCodeResponse }>(`/v1/postal-codes/${sanitized}`);
      const address = data.data;

      setValue(`addresses.${index}.postalCode`, address.postalCode);
      setValue(`addresses.${index}.street`, address.street);
      setValue(`addresses.${index}.district`, address.district);
      setValue(`addresses.${index}.city`, address.city);
      setValue(`addresses.${index}.state`, address.state);
      setValue(`addresses.${index}.complement`, address.complement ?? '');

      unlockAddress(index);
    } catch (error) {
      setAddressStates((prev) =>
        prev.map((state, idx) =>
          idx === index
            ? {
                ...state,
                unlocked: true,
                error: 'Não foi possível localizar o CEP. Preencha os dados manualmente.'
              }
            : state
        )
      );
    }
  };

  const handleAddAddress = () => {
    const availableLabel = ADDRESS_LABELS.find(
      (label) => !fields.some((field) => field.label === label)
    );

    append({
      id: undefined,
      label: availableLabel ?? 'shipping',
      postalCode: '',
      street: '',
      number: '',
      district: '',
      city: '',
      state: '',
      complement: ''
    });

    setAddressStates((prev) => [...prev, { unlocked: false, error: null }]);
  };

  const onSubmitHandler: SubmitHandler<ClientFormValues> = async (values) => {
    const sanitizedDocument = sanitizeDigits(values.document);
    const sanitizedPhone = sanitizeDigits(values.phone);

    const payload: ClientFormValues = {
      ...values,
      document: sanitizedDocument,
      phone: sanitizedPhone,
      addresses: values.addresses.map((address) => ({
        id: address.id,
        ...address,
        postalCode: sanitizeDigits(address.postalCode),
        state: address.state.toUpperCase(),
        complement: address.complement ?? null
      }))
    };

    await onSubmit(payload);
    if (resetAfterSubmit) {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        document: '',
        documentType: values.documentType,
        addresses: defaultAddresses.map((address) => ({ ...address }))
      });
      setAddressStates(defaultAddresses.map(() => ({ unlocked: false, error: null })));
    } else {
      reset({
        ...payload,
        addresses: payload.addresses.map((address) => ({
          ...address,
          postalCode: formatPostalCode(address.postalCode),
          complement: address.complement ?? ''
        }))
      });
      setAddressStates(
        payload.addresses.map((address) => ({
          unlocked: Boolean(address.street || address.city || address.district || address.number),
          error: null
        }))
      );
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
            Data de nascimento
            <input
              type="date"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...register('birthDate')}
            />
          </label>
          {errors.birthDate && <span className="text-xs font-medium text-red-500">{errors.birthDate.message}</span>}
        </div>
        <div className="grid gap-2 md:grid-cols-[130px,1fr]">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Tipo
              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('documentType')}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              Documento
              <input
                type="text"
                placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={documentType === 'cpf' ? 14 : 18}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('document')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  let formatted = value;
                  if (documentType === 'cpf') {
                    if (value.length > 9) {
                      formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
                    } else if (value.length > 6) {
                      formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
                    } else if (value.length > 3) {
                      formatted = `${value.slice(0, 3)}.${value.slice(3)}`;
                    }
                  } else {
                    if (value.length > 12) {
                      formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
                    } else if (value.length > 8) {
                      formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
                    } else if (value.length > 5) {
                      formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
                    } else if (value.length > 2) {
                      formatted = `${value.slice(0, 2)}.${value.slice(2)}`;
                    }
                  }
                  e.target.value = formatted;
                  register('document').onChange(e);
                }}
              />
            </label>
            {errors.document && <span className="text-xs font-medium text-red-500">{errors.document.message}</span>}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Endereços</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Informe pelo menos o endereço principal e comercial. Use "Buscar CEP" para preencher automaticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddAddress}
            className="rounded-full border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-500/10"
          >
            + adicionar endereço
          </button>
        </header>

        <div className="space-y-6">
          {fields.map((field, index) => {
            const locked = !addressStates[index]?.unlocked;
            const errorMessage = addressStates[index]?.error;

            return (
              <div
                key={field.id}
                className="rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-800"
              >
                <input type="hidden" {...register(`addresses.${index}.id` as const)} />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase text-blue-600 dark:text-blue-300">
                      {field.label}
                    </span>
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      {...register(`addresses.${index}.label` as const)}
                    >
                      {ADDRESS_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLookupPostalCode(index)}
                      className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-500/10"
                    >
                      Buscar CEP
                    </button>
                    <button
                      type="button"
                      onClick={() => unlockAddress(index)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Preencher manualmente
                    </button>
                    {index >= 2 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[160px,1fr,120px]">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      CEP
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        {...register(`addresses.${index}.postalCode` as const)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5, 8)}` : value;
                          e.target.value = formatted;
                          register(`addresses.${index}.postalCode` as const).onChange(e);
                        }}
                      />
                    </label>
                    {errors.addresses?.[index]?.postalCode && (
                      <span className="text-xs font-medium text-red-500">
                        {errors.addresses[index]?.postalCode?.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Logradouro
                      <input
                        type="text"
                        disabled={locked}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        {...register(`addresses.${index}.street` as const)}
                      />
                    </label>
                    {errors.addresses?.[index]?.street && (
                      <span className="text-xs font-medium text-red-500">
                        {errors.addresses[index]?.street?.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Número
                      <input
                        type="text"
                        disabled={locked}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        {...register(`addresses.${index}.number` as const)}
                      />
                    </label>
                    {errors.addresses?.[index]?.number && (
                      <span className="text-xs font-medium text-red-500">
                        {errors.addresses[index]?.number?.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Bairro
                      <input
                        type="text"
                        disabled={locked}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        {...register(`addresses.${index}.district` as const)}
                      />
                    </label>
                    {errors.addresses?.[index]?.district && (
                      <span className="text-xs font-medium text-red-500">
                        {errors.addresses[index]?.district?.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Cidade
                      <input
                        type="text"
                        disabled={locked}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        {...register(`addresses.${index}.city` as const)}
                      />
                    </label>
                    {errors.addresses?.[index]?.city && (
                      <span className="text-xs font-medium text-red-500">
                        {errors.addresses[index]?.city?.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      UF
                      <input
                        type="text"
                        disabled={locked}
                        maxLength={2}
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        {...register(`addresses.${index}.state` as const)}
                      />
                    </label>
                    {errors.addresses?.[index]?.state && (
                      <span className="text-xs font-medium text-red-500">
                        {errors.addresses[index]?.state?.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Complemento (opcional)
                    <input
                      type="text"
                      disabled={locked}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      {...register(`addresses.${index}.complement` as const)}
                    />
                  </label>
                </div>

                {errorMessage && (
                  <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">{errorMessage}</p>
                )}
              </div>
            );
          })}
        </div>
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

export default ClientForm;
