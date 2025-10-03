import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '../lib/api';
const schema = yup.object({
    clientId: yup.string().required('Selecione um cliente'),
    accountId: yup.string().required('Selecione uma conta'),
    principalAmount: yup
        .number()
        .positive('Valor deve ser positivo')
        .required('Valor principal é obrigatório')
        .typeError('Informe um valor válido'),
    interestRate: yup
        .number()
        .min(0, 'Taxa não pode ser negativa')
        .max(100, 'Taxa não pode ser maior que 100%')
        .required('Taxa de juros é obrigatória')
        .typeError('Informe uma taxa válida'),
    dueDate: yup.string().required('Data de vencimento é obrigatória'),
    installments: yup
        .number()
        .integer('Parcelas deve ser número inteiro')
        .positive('Parcelas deve ser positivo')
        .required('Número de parcelas é obrigatório')
        .typeError('Informe um número válido'),
    notes: yup.string().optional()
});
const NewLoanPage = () => {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            principalAmount: 0,
            interestRate: 0,
            installments: 1,
            dueDate: new Date().toISOString().split('T')[0],
            notes: ''
        }
    });
    const { data: clientsData } = useQuery({
        queryKey: ['clients', 'all'],
        queryFn: async () => {
            const response = await api.get('/v1/clients', {
                params: { pageSize: 100 }
            });
            return response.data;
        }
    });
    const { data: accountsData } = useQuery({
        queryKey: ['accounts', 'all'],
        queryFn: async () => {
            const response = await api.get('/v1/accounts', {
                params: { pageSize: 100 }
            });
            return response.data;
        }
    });
    const clients = clientsData?.data ?? [];
    const accounts = accountsData?.data ?? [];
    const principalAmount = watch('principalAmount') || 0;
    const interestRate = watch('interestRate') || 0;
    const installments = watch('installments') || 1;
    const totalAmount = principalAmount * (1 + interestRate / 100);
    const installmentAmount = totalAmount / installments;
    const createLoan = useMutation({
        mutationFn: async (values) => {
            const dueDateISO = new Date(values.dueDate + 'T00:00:00').toISOString();
            const response = await api.post('/v1/loans', { ...values, dueDate: dueDateISO });
            return response.data;
        },
        onSuccess: () => {
            setFeedback('Empréstimo criado com sucesso!');
            setErrorMessage(null);
            setTimeout(() => navigate('/loans'), 1500);
        },
        onError: (error) => {
            setFeedback(null);
            if (isAxiosError(error)) {
                const data = error.response?.data;
                setErrorMessage(data?.error || data?.message || 'Não foi possível criar o empréstimo');
            }
            else {
                setErrorMessage('Não foi possível criar o empréstimo');
            }
        }
    });
    const onSubmit = handleSubmit(async (values) => {
        await createLoan.mutateAsync(values);
    });
    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("button", { onClick: () => navigate('/loans'), className: "mb-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400", children: "\u2190 Voltar para empr\u00E9stimos" }), _jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-slate-100", children: "Novo Empr\u00E9stimo" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Preencha os dados para criar um novo contrato de empr\u00E9stimo." })] }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-6", children: [_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Informa\u00E7\u00F5es do Empr\u00E9stimo" }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "Cliente *" }), _jsxs("select", { ...register('clientId'), className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", children: [_jsx("option", { value: "", children: "Selecione um cliente" }), clients.map((client) => (_jsxs("option", { value: client.id, children: [client.name, " ", client.document ? `(${client.document})` : ''] }, client.id)))] }), errors.clientId && _jsx("span", { className: "mt-1 text-xs text-red-500", children: errors.clientId.message })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "Conta de Origem *" }), _jsxs("select", { ...register('accountId'), className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", children: [_jsx("option", { value: "", children: "Selecione uma conta" }), accounts.map((account) => (_jsxs("option", { value: account.id, children: [account.name, " (Saldo: ", currency.format(Number(account.currentBalance)), ")"] }, account.id)))] }), errors.accountId && _jsx("span", { className: "mt-1 text-xs text-red-500", children: errors.accountId.message })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "Valor Principal (R$) *" }), _jsx("input", { type: "number", step: "0.01", ...register('principalAmount'), className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", placeholder: "10000.00" }), errors.principalAmount && _jsx("span", { className: "mt-1 text-xs text-red-500", children: errors.principalAmount.message })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "Taxa de Juros (%) *" }), _jsx("input", { type: "number", step: "0.01", ...register('interestRate'), className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", placeholder: "5.00" }), errors.interestRate && _jsx("span", { className: "mt-1 text-xs text-red-500", children: errors.interestRate.message })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "Data de Vencimento *" }), _jsx("input", { type: "date", ...register('dueDate'), className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" }), errors.dueDate && _jsx("span", { className: "mt-1 text-xs text-red-500", children: errors.dueDate.message })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "N\u00FAmero de Parcelas *" }), _jsx("input", { type: "number", ...register('installments'), className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", placeholder: "12", min: "1" }), errors.installments && _jsx("span", { className: "mt-1 text-xs text-red-500", children: errors.installments.message })] })] }), _jsxs("div", { className: "mt-6", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300", children: "Observa\u00E7\u00F5es (opcional)" }), _jsx("textarea", { ...register('notes'), rows: 3, className: "w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", placeholder: "Informa\u00E7\u00F5es adicionais sobre o empr\u00E9stimo..." })] })] }), _jsxs("section", { className: "rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100", children: "Resumo do Empr\u00E9stimo" }), _jsxs("div", { className: "grid gap-4 md:grid-cols-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: "Valor Principal" }), _jsx("p", { className: "text-xl font-bold text-blue-900 dark:text-blue-100", children: currency.format(principalAmount) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: "Valor Total (com juros)" }), _jsx("p", { className: "text-xl font-bold text-blue-900 dark:text-blue-100", children: currency.format(totalAmount) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: "Valor da Parcela" }), _jsx("p", { className: "text-xl font-bold text-blue-900 dark:text-blue-100", children: currency.format(installmentAmount) })] })] })] }), feedback && _jsx("div", { className: "rounded-xl bg-green-50 p-4 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: feedback }), errorMessage && _jsx("div", { className: "rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", onClick: () => navigate('/loans'), className: "flex-1 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "flex-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: isSubmitting ? 'Criando empréstimo...' : 'Criar empréstimo' })] })] })] }));
};
export default NewLoanPage;
