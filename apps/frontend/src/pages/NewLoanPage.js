import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LoanForm from '../components/forms/LoanForm';
import { api } from '../lib/api';
const NewLoanPage = () => {
    const queryClient = useQueryClient();
    const { data: clientsResponse, isLoading } = useQuery({
        queryKey: ['clients', 'options'],
        queryFn: async () => {
            const response = await api.get('/clients');
            return {
                success: true,
                data: response.data.data.map((client) => ({ id: client.id, name: client.name }))
            };
        }
    });
    const clients = useMemo(() => clientsResponse?.data ?? [], [clientsResponse]);
    const [summary, setSummary] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const createLoan = useMutation({
        mutationFn: async (values) => {
            const payload = {
                ...values,
                dueDate: values.dueDate
            };
            const response = await api.post('/loans', payload);
            return response.data;
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['loans'] }),
                queryClient.invalidateQueries({ queryKey: ['accounts'] })
            ]);
        }
    });
    const handleSubmit = async (values) => {
        setSummary(null);
        setErrorMessage(null);
        try {
            const result = await createLoan.mutateAsync(values);
            const created = result.data;
            setSummary({
                id: created.id,
                clientName: created.client.name,
                principalAmount: Number(created.principalAmount),
                interestRate: Number(created.interestRate),
                dueDate: created.dueDate,
                notes: created.notes
            });
        }
        catch (error) {
            console.error(error);
            setErrorMessage('Não foi possível registrar o empréstimo. Verifique os dados e tente novamente.');
        }
    };
    return (_jsxs("div", { className: "grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]", children: [_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Novo empr\u00E9stimo" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Defina valor, taxa e vencimento para registrar um novo contrato de empr\u00E9stimo." }), _jsxs("div", { className: "mt-6", children: [isLoading ? (_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Carregando clientes..." })) : (_jsx(LoanForm, { clients: clients, onSubmit: handleSubmit, isSubmitting: createLoan.isPending })), errorMessage && (_jsx("p", { className: "mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage }))] })] }), _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Resumo" }), summary ? (_jsxs("dl", { className: "mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { children: "Cliente" }), _jsx("dd", { children: summary.clientName })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { children: "Valor" }), _jsx("dd", { children: summary.principalAmount.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { children: "Juros" }), _jsxs("dd", { children: [summary.interestRate.toFixed(2), "%"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("dt", { children: "Vencimento" }), _jsx("dd", { children: new Date(summary.dueDate).toLocaleDateString('pt-BR') })] }), summary.notes ? (_jsxs("div", { children: [_jsx("dt", { children: "Observa\u00E7\u00F5es" }), _jsx("dd", { className: "mt-1 text-slate-500 dark:text-slate-400", children: summary.notes })] })) : null, _jsx("p", { className: "rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300", children: "Empr\u00E9stimo registrado com sucesso!" })] })) : (_jsx("p", { className: "mt-4 text-sm text-slate-500 dark:text-slate-400", children: "Preencha o formul\u00E1rio ao lado para visualizar um resumo do contrato." }))] })] }));
};
export default NewLoanPage;
