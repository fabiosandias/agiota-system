import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
const schema = yup
    .object({
    name: yup.string().trim().min(2, 'Nome é obrigatório').required('Nome é obrigatório'),
    bankName: yup.string().trim().min(2, 'Banco é obrigatório').required('Banco é obrigatório'),
    branch: yup.string().trim().min(1, 'Agência é obrigatória').required('Agência é obrigatória'),
    accountNumber: yup.string().trim().min(1, 'Conta é obrigatória').required('Conta é obrigatória'),
    type: yup.mixed().oneOf(['checking', 'savings']).required('Selecione o tipo de conta'),
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
const AccountForm = ({ mode = 'create', defaultValues, onSubmit, isSubmitting = false, resetAfterSubmit = true, submitLabel = 'Salvar conta', onCancel }) => {
    const formDefaults = useMemo(() => ({
        name: defaultValues?.name ?? '',
        bankName: defaultValues?.bankName ?? '',
        branch: defaultValues?.branch ?? '',
        accountNumber: defaultValues?.accountNumber ?? '',
        type: defaultValues?.type ?? 'checking',
        openingBalance: defaultValues?.openingBalance ?? 0
    }), [defaultValues]);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting: formSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: formDefaults,
        context: { requireOpeningBalance: mode === 'create' }
    });
    useEffect(() => {
        reset(formDefaults);
    }, [formDefaults, reset]);
    const submitting = isSubmitting || formSubmitting;
    const onSubmitHandler = async (values) => {
        const payload = {
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
        }
        else {
            reset({
                ...payload,
                openingBalance: mode === 'create' ? payload.openingBalance ?? 0 : formDefaults.openingBalance
            });
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmitHandler), className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Nome da conta", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('name') })] }), errors.name && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.name.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Banco", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('bankName') })] }), errors.bankName && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.bankName.message })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Ag\u00EAncia", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('branch') })] }), errors.branch && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.branch.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["N\u00FAmero da conta", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('accountNumber') })] }), errors.accountNumber && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.accountNumber.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Tipo de conta", _jsxs("select", { className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('type'), children: [_jsx("option", { value: "checking", children: "Conta corrente" }), _jsx("option", { value: "savings", children: "Conta poupan\u00E7a" })] })] }), errors.type && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.type.message })] })] }), mode === 'create' && (_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Saldo inicial", _jsx("input", { type: "number", step: "0.01", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('openingBalance', { valueAsNumber: true }) })] }), errors.openingBalance && (_jsx("span", { className: "text-xs font-medium text-red-500", children: errors.openingBalance.message }))] })), _jsxs("div", { className: onCancel ? 'flex flex-col gap-3 sm:flex-row sm:justify-end' : undefined, children: [onCancel && (_jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Cancelar" })), _jsx("button", { type: "submit", disabled: submitting, className: `${onCancel ? '' : 'w-full '}rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70`, children: submitting ? 'Salvando...' : submitLabel })] })] }));
};
export default AccountForm;
