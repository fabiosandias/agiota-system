import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ClientForm from '../components/forms/ClientForm';
import { api } from '../lib/api';
const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11)
        return value;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};
const formatPhone = (value) => {
    if (!value)
        return '--';
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10)
        return value;
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};
const ClientsPage = () => {
    const queryClient = useQueryClient();
    const [feedback, setFeedback] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const response = await api.get('/clients');
            return response.data;
        }
    });
    const clients = useMemo(() => data?.data ?? [], [data]);
    const createClient = useMutation({
        mutationFn: async (values) => {
            const response = await api.post('/clients', values);
            return response.data;
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['clients'] }),
                queryClient.invalidateQueries({ queryKey: ['clients', 'options'] })
            ]);
            setFeedback('Cliente cadastrado com sucesso.');
        },
        onError: () => {
            setErrorMessage('Não foi possível cadastrar o cliente. Verifique os dados informados.');
        }
    });
    const handleCreate = async (values) => {
        setFeedback(null);
        setErrorMessage(null);
        await createClient.mutateAsync(values);
    };
    return (_jsxs("div", { className: "grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]", children: [_jsxs("section", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Cadastrar cliente" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Utilize o formul\u00E1rio abaixo para cadastrar um novo cliente com valida\u00E7\u00E3o de CPF e telefone." }), _jsxs("div", { className: "mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx(ClientForm, { onSubmit: handleCreate, isSubmitting: createClient.isPending }), feedback && (_jsx("p", { className: "rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: feedback })), errorMessage && (_jsx("p", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage }))] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Clientes cadastrados" }), _jsx("div", { className: "mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Nome" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "CPF" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Telefone" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "E-mail" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: isLoading ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-4 text-center text-slate-500 dark:text-slate-400", colSpan: 4, children: "Carregando clientes..." }) })) : clients.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-4 text-center text-slate-500 dark:text-slate-400", colSpan: 4, children: "Nenhum cliente cadastrado ainda." }) })) : (clients.map((client) => (_jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [_jsxs("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: [_jsx("div", { className: "font-medium", children: client.name }), _jsxs("span", { className: "text-xs text-slate-400 dark:text-slate-500", children: ["Cadastrado em ", new Date(client.createdAt).toLocaleDateString('pt-BR')] })] }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatCpf(client.cpf) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatPhone(client.phone) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: client.email ?? '--' })] }, client.id)))) })] }) })] })] }));
};
export default ClientsPage;
