import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { NumericFormat } from 'react-number-format';
import * as yup from 'yup';
const schema = yup.object({
    clientId: yup.string().trim().required('Cliente é obrigatório'),
    principalAmount: yup.number().moreThan(0, 'Valor deve ser maior que zero').required(),
    interestRate: yup.number().moreThan(0, 'Taxa deve ser maior que zero').required(),
    dueDate: yup.string().required('Data de vencimento é obrigatória'),
    notes: yup.string().nullable()
});
const LoanForm = ({ clients, defaultValues, onSubmit, isSubmitting = false }) => {
    const { control, register, handleSubmit, formState: { errors, isSubmitting: formSubmitting } } = useForm({
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
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-5", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Cliente", _jsxs("select", { className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('clientId'), children: [_jsx("option", { value: "", children: "Selecione um cliente" }), clients.map((client) => (_jsx("option", { value: client.id, children: client.name }, client.id)))] })] }), errors.clientId && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.clientId.message })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Valor solicitado", _jsx(Controller, { control: control, name: "principalAmount", render: ({ field }) => (_jsx(NumericFormat, { value: field.value, thousandSeparator: ".", decimalSeparator: ",", prefix: "R$ ", decimalScale: 2, fixedDecimalScale: true, allowNegative: false, onValueChange: (values) => {
                                                field.onChange(values.floatValue ?? 0);
                                            }, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })) })] }), errors.principalAmount && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.principalAmount.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Taxa de juros (%)", _jsx(Controller, { control: control, name: "interestRate", render: ({ field }) => (_jsx(NumericFormat, { value: field.value, suffix: " %", decimalScale: 2, decimalSeparator: ",", thousandSeparator: ".", allowNegative: false, onValueChange: (values) => {
                                                field.onChange(values.floatValue ?? 0);
                                            }, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })) })] }), errors.interestRate && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.interestRate.message })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Data de vencimento", _jsx("input", { type: "date", className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('dueDate') })] }), errors.dueDate && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.dueDate.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Observa\u00E7\u00F5es", _jsx("textarea", { rows: 3, className: "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('notes') })] }), errors.notes && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.notes.message })] }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: submitting ? 'Salvando...' : 'Confirmar empréstimo' })] }));
};
export default LoanForm;
