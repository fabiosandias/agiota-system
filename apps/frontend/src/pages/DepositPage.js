import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { NumericFormat } from 'react-number-format';
import { api } from '../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../utils/currency';
const schema = yup.object({
    accountId: yup.string().required('Selecione uma conta'),
    amount: yup.number().positive('Informe um valor maior que zero').required('Valor é obrigatório'),
    description: yup.string().nullable()
});
const DepositPage = () => {
    const queryClient = useQueryClient();
    const { showBalance } = useBalanceVisibility();
    const { data: accountsResponse } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await api.get('/accounts');
            return response.data;
        }
    });
    const accounts = useMemo(() => accountsResponse?.data ?? [], [accountsResponse]);
    const [successMessage, setSuccessMessage] = useState(null);
    const { control, register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            accountId: '',
            amount: 0,
            description: ''
        }
    });
    const onSubmit = handleSubmit(async (values) => {
        setSuccessMessage(null);
        await api.post(`/accounts/${values.accountId}/deposit`, {
            amount: values.amount,
            description: values.description
        });
        await queryClient.invalidateQueries({ queryKey: ['accounts'] });
        await queryClient.invalidateQueries({ queryKey: ['total-balance'] });
        setSuccessMessage('Depósito realizado com sucesso!');
        reset({ accountId: values.accountId, amount: 0, description: '' });
    });
    return (_jsxs("div", { className: "mx-auto max-w-2xl space-y-10", children: [_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-2xl font-semibold text-slate-900 dark:text-slate-100", children: "Dep\u00F3sito na conta" }), _jsx("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: "Registre um dep\u00F3sito na conta da empresa para disponibilizar saldo para novos empr\u00E9stimos." }), _jsxs("form", { onSubmit: onSubmit, className: "mt-8 space-y-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Conta", _jsxs("select", { className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('accountId'), children: [_jsx("option", { value: "", children: "Selecione uma conta" }), accounts.map((account) => (_jsx("option", { value: account.id, children: account.name }, account.id)))] })] }), errors.accountId && _jsx("span", { className: "mt-1 block text-xs font-medium text-red-500", children: errors.accountId.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Valor do dep\u00F3sito", _jsx(Controller, { control: control, name: "amount", render: ({ field }) => (_jsx(NumericFormat, { value: field.value, thousandSeparator: ".", decimalSeparator: ",", prefix: "R$ ", decimalScale: 2, fixedDecimalScale: true, allowNegative: false, onValueChange: (values) => {
                                                        field.onChange(values.floatValue ?? 0);
                                                    }, className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })) })] }), errors.amount && _jsx("span", { className: "mt-1 block text-xs font-medium text-red-500", children: errors.amount.message })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-slate-600 dark:text-slate-300", children: ["Observa\u00E7\u00F5es (opcional)", _jsx("textarea", { rows: 3, className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('description') })] }), errors.description && (_jsx("span", { className: "mt-1 block text-xs font-medium text-red-500", children: errors.description.message }))] }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-70", children: isSubmitting ? 'Registrando depósito...' : 'Confirmar depósito' }), successMessage && (_jsx("p", { className: "rounded-xl bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", children: successMessage }))] })] }), _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Contas cadastradas" }), _jsx("div", { className: "mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Conta" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Saldo atual" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Saldo inicial" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: accounts.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 3, children: "Nenhuma conta cadastrada." }) })) : (accounts.map((account) => (_jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [_jsx("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: account.name }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatCurrencyWithPrivacy(Number(account.currentBalance) || 0, showBalance) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatCurrencyWithPrivacy(Number(account.initialBalance) || 0, showBalance) })] }, account.id)))) })] }) })] })] }));
};
export default DepositPage;
