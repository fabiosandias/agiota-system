import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../../lib/api';
const documentSchema = yup
    .string()
    .required('Documento é obrigatório')
    .test('document-length', 'Documento inválido', function validate(value) {
    const type = this.parent.documentType;
    const digits = (value ?? '').replace(/\D/g, '');
    if (type === 'cpf') {
        return digits.length === 11;
    }
    return digits.length === 14;
});
const addressSchema = yup.object({
    label: yup.mixed().oneOf(['primary', 'business', 'billing', 'shipping']).required(),
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
    documentType: yup.mixed().oneOf(['cpf', 'cnpj']).required(),
    document: documentSchema,
    addresses: yup
        .array(addressSchema)
        .min(1, 'Informe pelo menos um endereço')
});
const ADDRESS_LABELS = ['primary', 'business', 'billing', 'shipping'];
const defaultAddresses = [
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
const getDocumentMask = (type) => (type === 'cpf' ? '999.999.999-99' : '99.999.999/9999-99');
const sanitizeDigits = (value) => value.replace(/\D/g, '');
const formatDateForInput = (value) => {
    if (!value)
        return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }
    return parsed.toISOString().slice(0, 10);
};
const formatPostalCode = (value) => {
    if (!value)
        return '';
    const digits = sanitizeDigits(value);
    if (digits.length !== 8)
        return value;
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
};
const ClientForm = ({ defaultValues, onSubmit, isSubmitting = false, resetAfterSubmit = true, submitLabel = 'Salvar cliente', onCancel }) => {
    const formDefaults = useMemo(() => {
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
    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: formDefaults
    });
    const { control, register, handleSubmit, reset, getValues, setValue, formState: { errors, isSubmitting: formSubmitting } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: 'addresses' });
    const documentType = useWatch({ control, name: 'documentType' }) ?? 'cpf';
    const documentMask = useMemo(() => getDocumentMask(documentType), [documentType]);
    const [addressStates, setAddressStates] = useState(() => formDefaults.addresses.map((address) => ({
        unlocked: Boolean(address.street || address.city || address.district || address.number),
        error: null
    })));
    useEffect(() => {
        reset(formDefaults);
        setAddressStates(formDefaults.addresses.map((address) => ({
            unlocked: Boolean(address.street || address.city || address.district || address.number),
            error: null
        })));
    }, [formDefaults, reset]);
    useEffect(() => {
        setAddressStates((prev) => fields.map((field, index) => {
            const hasData = Boolean(field.street || field.city || field.district || field.number);
            return prev[index] ?? { unlocked: hasData, error: null };
        }));
    }, [fields]);
    const initialDocumentType = useRef(documentType);
    useEffect(() => {
        if (initialDocumentType.current !== documentType) {
            setValue('document', '');
        }
    }, [documentType, setValue]);
    const submitting = isSubmitting || formSubmitting;
    const unlockAddress = (index) => {
        setAddressStates((prev) => prev.map((state, idx) => (idx === index ? { ...state, unlocked: true, error: null } : state)));
    };
    const handleLookupPostalCode = async (index) => {
        const postalCodeValue = getValues(`addresses.${index}.postalCode`);
        const sanitized = sanitizeDigits(postalCodeValue ?? '');
        if (sanitized.length !== 8) {
            setAddressStates((prev) => prev.map((state, idx) => (idx === index ? { ...state, error: 'CEP inválido' } : state)));
            return;
        }
        try {
            const { data } = await api.get(`/v1/postal-codes/${sanitized}`);
            const address = data.data;
            setValue(`addresses.${index}.postalCode`, address.postalCode);
            setValue(`addresses.${index}.street`, address.street);
            setValue(`addresses.${index}.district`, address.district);
            setValue(`addresses.${index}.city`, address.city);
            setValue(`addresses.${index}.state`, address.state);
            setValue(`addresses.${index}.complement`, address.complement ?? '');
            unlockAddress(index);
        }
        catch (error) {
            setAddressStates((prev) => prev.map((state, idx) => idx === index
                ? {
                    ...state,
                    unlocked: true,
                    error: 'Não foi possível localizar o CEP. Preencha os dados manualmente.'
                }
                : state));
        }
    };
    const handleAddAddress = () => {
        const availableLabel = ADDRESS_LABELS.find((label) => !fields.some((field) => field.label === label));
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
    const onSubmitHandler = async (values) => {
        const sanitizedDocument = sanitizeDigits(values.document);
        const sanitizedPhone = sanitizeDigits(values.phone);
        const payload = {
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
        }
        else {
            reset({
                ...payload,
                addresses: payload.addresses.map((address) => ({
                    ...address,
                    postalCode: formatPostalCode(address.postalCode),
                    complement: address.complement ?? ''
                }))
            });
            setAddressStates(payload.addresses.map((address) => ({
                unlocked: Boolean(address.street || address.city || address.district || address.number),
                error: null
            })));
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmitHandler), className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Nome", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('firstName') })] }), errors.firstName && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.firstName.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Sobrenome", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('lastName') })] }), errors.lastName && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.lastName.message })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["E-mail", _jsx("input", { type: "email", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('email') })] }), errors.email && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.email.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Telefone", _jsx("input", { type: "text", placeholder: "(00) 00000-0000", maxLength: 15, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('phone'), onChange: (e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            let formatted = value;
                                            if (value.length > 10) {
                                                formatted = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                                            }
                                            else if (value.length > 6) {
                                                formatted = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6, 10)}`;
                                            }
                                            else if (value.length > 2) {
                                                formatted = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                            }
                                            e.target.value = formatted;
                                            register('phone').onChange(e);
                                        } })] }), errors.phone && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.phone.message })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Data de nascimento", _jsx("input", { type: "date", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('birthDate') })] }), errors.birthDate && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.birthDate.message })] }), _jsxs("div", { className: "grid gap-2 md:grid-cols-[130px,1fr]", children: [_jsx("div", { children: _jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Tipo", _jsxs("select", { className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('documentType'), children: [_jsx("option", { value: "cpf", children: "CPF" }), _jsx("option", { value: "cnpj", children: "CNPJ" })] })] }) }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Documento", _jsx("input", { type: "text", placeholder: documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00', maxLength: documentType === 'cpf' ? 14 : 18, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('document'), onChange: (e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    let formatted = value;
                                                    if (documentType === 'cpf') {
                                                        if (value.length > 9) {
                                                            formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9, 11)}`;
                                                        }
                                                        else if (value.length > 6) {
                                                            formatted = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
                                                        }
                                                        else if (value.length > 3) {
                                                            formatted = `${value.slice(0, 3)}.${value.slice(3)}`;
                                                        }
                                                    }
                                                    else {
                                                        if (value.length > 12) {
                                                            formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12, 14)}`;
                                                        }
                                                        else if (value.length > 8) {
                                                            formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8)}`;
                                                        }
                                                        else if (value.length > 5) {
                                                            formatted = `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5)}`;
                                                        }
                                                        else if (value.length > 2) {
                                                            formatted = `${value.slice(0, 2)}.${value.slice(2)}`;
                                                        }
                                                    }
                                                    e.target.value = formatted;
                                                    register('document').onChange(e);
                                                } })] }), errors.document && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.document.message })] })] })] }), _jsxs("section", { className: "space-y-4", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", children: "Endere\u00E7os" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Informe pelo menos o endere\u00E7o principal e comercial. Use \"Buscar CEP\" para preencher automaticamente." })] }), _jsx("button", { type: "button", onClick: handleAddAddress, className: "rounded-full border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-500/10", children: "+ adicionar endere\u00E7o" })] }), _jsx("div", { className: "space-y-6", children: fields.map((field, index) => {
                            const locked = !addressStates[index]?.unlocked;
                            const errorMessage = addressStates[index]?.error;
                            return (_jsxs("div", { className: "rounded-2xl border border-slate-200 p-4 shadow-sm dark:border-slate-800", children: [_jsx("input", { type: "hidden", ...register(`addresses.${index}.id`) }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase text-blue-600 dark:text-blue-300", children: field.label }), _jsx("select", { className: "rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.label`), children: ADDRESS_LABELS.map((label) => (_jsx("option", { value: label, children: label }, label))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => handleLookupPostalCode(index), className: "rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-500/10", children: "Buscar CEP" }), _jsx("button", { type: "button", onClick: () => unlockAddress(index), className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800", children: "Preencher manualmente" }), index >= 2 && (_jsx("button", { type: "button", onClick: () => remove(index), className: "rounded-lg border border-red-500 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10", children: "Remover" }))] })] }), _jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-[160px,1fr,120px]", children: [_jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["CEP", _jsx("input", { type: "text", placeholder: "00000-000", maxLength: 9, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.postalCode`), onChange: (e) => {
                                                                    const value = e.target.value.replace(/\D/g, '');
                                                                    const formatted = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5, 8)}` : value;
                                                                    e.target.value = formatted;
                                                                    register(`addresses.${index}.postalCode`).onChange(e);
                                                                } })] }), errors.addresses?.[index]?.postalCode && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.addresses[index]?.postalCode?.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Logradouro", _jsx("input", { type: "text", disabled: locked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.street`) })] }), errors.addresses?.[index]?.street && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.addresses[index]?.street?.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["N\u00FAmero", _jsx("input", { type: "text", disabled: locked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.number`) })] }), errors.addresses?.[index]?.number && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.addresses[index]?.number?.message }))] })] }), _jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-3", children: [_jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Bairro", _jsx("input", { type: "text", disabled: locked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.district`) })] }), errors.addresses?.[index]?.district && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.addresses[index]?.district?.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Cidade", _jsx("input", { type: "text", disabled: locked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.city`) })] }), errors.addresses?.[index]?.city && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.addresses[index]?.city?.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["UF", _jsx("input", { type: "text", disabled: locked, maxLength: 2, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.state`) })] }), errors.addresses?.[index]?.state && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.addresses[index]?.state?.message }))] })] }), _jsx("div", { className: "mt-4", children: _jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Complemento (opcional)", _jsx("input", { type: "text", disabled: locked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register(`addresses.${index}.complement`) })] }) }), errorMessage && (_jsx("p", { className: "mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400", children: errorMessage }))] }, field.id));
                        }) })] }), _jsxs("div", { className: onCancel ? 'flex flex-col gap-3 sm:flex-row sm:justify-end' : undefined, children: [onCancel && (_jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Cancelar" })), _jsx("button", { type: "submit", disabled: submitting, className: `${onCancel ? '' : 'w-full '}rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70`, children: submitting ? 'Salvando...' : submitLabel })] })] }));
};
export default ClientForm;
