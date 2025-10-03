import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../../lib/api';
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
    role: yup.mixed().oneOf(['admin', 'operator', 'viewer']).required('Selecione a função'),
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
const sanitizeDigits = (value) => value.replace(/\D/g, '');
const hasAddressData = (address) => Boolean(address.street || address.city || address.district || address.number);
const formatPostalCode = (value) => {
    if (!value)
        return '';
    const digits = sanitizeDigits(value);
    if (digits.length !== 8)
        return value;
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
};
const UserForm = ({ mode = 'create', defaultValues, onSubmit, isSubmitting = false, resetAfterSubmit = true, submitLabel = 'Salvar usuário', onCancel }) => {
    const formDefaults = useMemo(() => ({
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
    const { control, register, handleSubmit, reset, getValues, setValue, formState: { errors, isSubmitting: formSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: formDefaults,
        context: { requirePassword: mode === 'create' }
    });
    const [addressLocked, setAddressLocked] = useState(() => !hasAddressData(formDefaults.address));
    const [addressError, setAddressError] = useState(null);
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
            const { data } = await api.get(`/v1/postal-codes/${postalCode}`);
            const address = data.data;
            setValue('address.postalCode', address.postalCode);
            setValue('address.street', address.street);
            setValue('address.district', address.district);
            setValue('address.city', address.city);
            setValue('address.state', address.state);
            setValue('address.complement', address.complement ?? '');
            setAddressLocked(false);
            setAddressError(null);
        }
        catch (error) {
            setAddressLocked(false);
            setAddressError('Não foi possível localizar o CEP. Preencha os dados manualmente.');
        }
    };
    const onSubmitHandler = async (values) => {
        const payload = {
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
        }
        else {
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
                                        } })] }), errors.phone && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.phone.message })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Fun\u00E7\u00E3o", _jsxs("select", { className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('role'), children: [_jsx("option", { value: "admin", children: "Administrador" }), _jsx("option", { value: "operator", children: "Operador" }), _jsx("option", { value: "viewer", children: "Visualizador" })] })] }), errors.role && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.role.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: [mode === 'create' ? 'Senha temporária' : 'Nova senha (opcional)', _jsx("input", { type: "password", autoComplete: "new-password", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('password') })] }), errors.password && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.password.message })] })] }), _jsxs("section", { className: "space-y-4", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-700 dark:text-slate-200", children: "Endere\u00E7o principal" }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Utilize a busca de CEP para preencher automaticamente ou desbloqueie os campos para edi\u00E7\u00E3o manual." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: handleLookupPostalCode, className: "rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-500/10", children: "Buscar CEP" }), _jsx("button", { type: "button", onClick: () => {
                                            setAddressLocked(false);
                                            setAddressError(null);
                                        }, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800", children: "Preencher manualmente" })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-[160px,1fr,1fr]", children: [_jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["CEP", _jsx("input", { type: "text", placeholder: "00000-000", maxLength: 9, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.postalCode'), onChange: (e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    const formatted = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5, 8)}` : value;
                                                    e.target.value = formatted;
                                                    register('address.postalCode').onChange(e);
                                                } })] }), errors.address?.postalCode && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.postalCode.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Logradouro", _jsx("input", { type: "text", disabled: addressLocked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.street') })] }), errors.address?.street && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.street.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["N\u00FAmero", _jsx("input", { type: "text", disabled: addressLocked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.number') })] }), errors.address?.number && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.number.message }))] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Bairro", _jsx("input", { type: "text", disabled: addressLocked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.district') })] }), errors.address?.district && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.district.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Cidade", _jsx("input", { type: "text", disabled: addressLocked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.city') })] }), errors.address?.city && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.city.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["UF", _jsx("input", { type: "text", maxLength: 2, disabled: addressLocked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.state') })] }), errors.address?.state && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.state.message }))] })] }), _jsx("div", { children: _jsxs("label", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400", children: ["Complemento (opcional)", _jsx("input", { type: "text", disabled: addressLocked, className: "mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.complement') })] }) }), addressError && (_jsx("p", { className: "text-xs font-semibold text-amber-600 dark:text-amber-400", children: addressError }))] }), _jsxs("div", { className: onCancel ? 'flex flex-col gap-3 sm:flex-row sm:justify-end' : undefined, children: [onCancel && (_jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Cancelar" })), _jsx("button", { type: "submit", disabled: submitting, className: `${onCancel ? '' : 'w-full '}rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70`, children: submitting ? 'Salvando...' : submitLabel })] })] }));
};
export default UserForm;
