import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import InputMask from 'react-input-mask';
import * as yup from 'yup';
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
const ClientForm = ({ defaultValues, onSubmit, isSubmitting = false }) => {
    const { control, register, handleSubmit, formState: { errors, isSubmitting: formSubmitting } } = useForm({
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
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Nome", _jsx("input", { type: "text", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('name') })] }), errors.name && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.name.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["CPF", _jsx(Controller, { control: control, name: "cpf", render: ({ field }) => (_jsx(InputMask, { mask: "999.999.999-99", value: field.value ?? '', onChange: field.onChange, onBlur: field.onBlur, children: (inputProps) => (_jsx("input", { ...inputProps, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })) })) })] }), errors.cpf && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.cpf.message })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Telefone", _jsx(Controller, { control: control, name: "phone", render: ({ field }) => (_jsx(InputMask, { mask: "(99) 99999-9999", value: field.value ?? '', onChange: field.onChange, onBlur: field.onBlur, children: (inputProps) => (_jsx("input", { ...inputProps, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })) })) })] }), errors.phone && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.phone.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["E-mail", _jsx("input", { type: "email", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('email') })] }), errors.email && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.email.message })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Endere\u00E7o", _jsx("textarea", { rows: 3, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address') })] }), errors.address && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.address.message })] }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: submitting ? 'Salvando...' : 'Salvar cliente' })] }));
};
export default ClientForm;
