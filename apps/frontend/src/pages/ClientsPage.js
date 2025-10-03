import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import ClientForm from '../components/forms/ClientForm';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
const formatPhone = (value) => {
    if (!value)
        return '--';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
};
const formatDocument = (document, type) => {
    if (!document)
        return '--';
    const digits = document.replace(/\D/g, '');
    if (type === 'cnpj' || digits.length === 14) {
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return document;
};
const formatDate = (value) => new Date(value).toLocaleDateString('pt-BR');
const ADDRESS_LABELS = ['primary', 'business', 'billing', 'shipping'];
const ensureAddressLabel = (label) => ADDRESS_LABELS.includes(label) ? label : 'primary';
const sortAddresses = (addresses) => {
    const order = ADDRESS_LABELS.reduce((acc, current, index) => {
        acc[current] = index;
        return acc;
    }, {});
    return [...addresses].sort((a, b) => {
        const aOrder = order[ensureAddressLabel(a.label)] ?? addresses.length;
        const bOrder = order[ensureAddressLabel(b.label)] ?? addresses.length;
        return aOrder - bOrder;
    });
};
const toClientFormDefaults = (client) => ({
    firstName: client.firstName ?? '',
    lastName: client.lastName ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    birthDate: client.birthDate ?? '',
    document: client.document ?? '',
    documentType: client.documentType ?? 'cpf',
    addresses: sortAddresses(client.addresses).map((address) => ({
        id: address.id,
        label: ensureAddressLabel(address.label),
        postalCode: address.postalCode ?? '',
        street: address.street ?? '',
        number: address.number ?? '',
        district: address.district ?? '',
        city: address.city ?? '',
        state: address.state ?? '',
        complement: address.complement ?? ''
    }))
});
const getErrorMessage = (error, fallback) => {
    if (isAxiosError(error)) {
        const data = error.response?.data;
        if (typeof data?.error === 'string' && data.error.trim().length > 0) {
            return data.error;
        }
        if (typeof data?.message === 'string' && data.message.trim().length > 0) {
            return data.message;
        }
    }
    return fallback;
};
const ClientsPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingSearch, setPendingSearch] = useState('');
    const [filters, setFilters] = useState({ name: '', city: '', district: '' });
    const [pendingFilters, setPendingFilters] = useState(filters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [editingClient, setEditingClient] = useState(null);
    const [deletingClientId, setDeletingClientId] = useState(null);
    const { user } = useAuth();
    const canManageClients = user?.role === 'admin' || user?.role === 'operator';
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['clients', { searchTerm, filters, page, pageSize }],
        queryFn: async () => {
            const response = await api.get('/v1/clients', {
                params: {
                    search: searchTerm || undefined,
                    name: filters.name || undefined,
                    city: filters.city || undefined,
                    district: filters.district || undefined,
                    page,
                    pageSize
                }
            });
            return response.data;
        }
    });
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filters, pageSize]);
    useEffect(() => {
        setPendingFilters(filters);
    }, [filters]);
    const clients = useMemo(() => data?.data ?? [], [data]);
    const meta = data?.meta;
    const editingDefaults = useMemo(() => (editingClient ? toClientFormDefaults(editingClient) : undefined), [editingClient]);
    const [feedback, setFeedback] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const createClient = useMutation({
        mutationFn: async (values) => {
            const response = await api.post('/v1/clients', values);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['clients'] });
            setFeedback('Cliente cadastrado com sucesso.');
            setErrorMessage(null);
            setPage(1);
        },
        onError: () => {
            setErrorMessage('Não foi possível cadastrar o cliente. Verifique os dados informados.');
            setFeedback(null);
        }
    });
    const updateClientMutation = useMutation({
        mutationFn: async ({ clientId, values }) => {
            const response = await api.put(`/v1/clients/${clientId}`, values);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });
    const deleteClientMutation = useMutation({
        mutationFn: async (clientId) => {
            await api.delete(`/v1/clients/${clientId}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
    });
    const handleCreate = async (values) => {
        setFeedback(null);
        setErrorMessage(null);
        await createClient.mutateAsync(values);
    };
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchTerm(pendingSearch.trim());
    };
    const handleFiltersSubmit = (event) => {
        event.preventDefault();
        setFilters({
            name: pendingFilters.name.trim(),
            city: pendingFilters.city.trim(),
            district: pendingFilters.district.trim()
        });
    };
    const handleChangePageSize = (value) => {
        setPageSize(value);
        setPage(1);
    };
    const totalPages = meta?.totalPages ?? 1;
    const primaryAddress = (client) => client.addresses?.find((address) => address.label === 'primary') ?? client.addresses?.[0];
    const handleStartEdit = (client) => {
        if (!canManageClients)
            return;
        setEditingClient(client);
        setFeedback(null);
        setErrorMessage(null);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleCancelEdit = () => {
        setEditingClient(null);
    };
    const handleUpdate = async (values) => {
        if (!canManageClients || !editingClient)
            return;
        setFeedback(null);
        setErrorMessage(null);
        try {
            await updateClientMutation.mutateAsync({ clientId: editingClient.id, values });
            setFeedback('Cliente atualizado com sucesso.');
            setEditingClient(null);
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o cliente.'));
        }
    };
    const handleDelete = async (client) => {
        if (!canManageClients)
            return;
        const confirmDelete = typeof window !== 'undefined' && window.confirm(`Deseja realmente excluir o cliente "${client.name}"?`);
        if (!confirmDelete) {
            return;
        }
        setFeedback(null);
        setErrorMessage(null);
        setDeletingClientId(client.id);
        try {
            await deleteClientMutation.mutateAsync(client.id);
            setFeedback('Cliente removido com sucesso.');
            if (editingClient?.id === client.id) {
                setEditingClient(null);
            }
            setPage((prev) => {
                if (prev > 1 && clients.length === 1) {
                    return prev - 1;
                }
                return prev;
            });
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível remover o cliente.'));
        }
        finally {
            setDeletingClientId(null);
        }
    };
    return (_jsxs("div", { className: "space-y-10", children: [canManageClients ? (_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Cadastrar cliente" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Utilize o formul\u00E1rio abaixo para cadastrar um novo cliente e os endere\u00E7os principal e comercial." }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx(ClientForm, { onSubmit: handleCreate, isSubmitting: createClient.isPending }), feedback && (_jsx("p", { className: "rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: feedback })), errorMessage && (_jsx("p", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage }))] })] })) : (_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Clientes" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Voc\u00EA possui acesso somente leitura aos cadastros de clientes. Contate um administrador para solicitar permiss\u00F5es adicionais." })] })), canManageClients && editingClient && editingDefaults && (_jsxs("section", { className: "rounded-3xl border border-amber-200 bg-white p-6 shadow-sm transition dark:border-amber-500/40 dark:bg-slate-900", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-amber-700 dark:text-amber-300", children: "Editar cliente" }), _jsx("p", { className: "mt-1 text-sm text-amber-700/80 dark:text-amber-200/80", children: "Atualize as informa\u00E7\u00F5es do cliente selecionado. As altera\u00E7\u00F5es s\u00E3o aplicadas imediatamente ap\u00F3s salvar." })] }), _jsx("button", { type: "button", onClick: handleCancelEdit, className: "rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-500/60 dark:text-amber-200 dark:hover:bg-amber-500/10", children: "Cancelar edi\u00E7\u00E3o" })] }), _jsx("div", { className: "mt-6", children: _jsx(ClientForm, { defaultValues: editingDefaults, onSubmit: handleUpdate, isSubmitting: updateClientMutation.isPending, resetAfterSubmit: false, submitLabel: "Atualizar cliente", onCancel: handleCancelEdit }) })] })), _jsxs("section", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Clientes cadastrados" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Utilize a busca global ou os filtros para encontrar um cliente. Resultados paginados em tempo real." })] }), _jsxs("form", { onSubmit: handleSearchSubmit, className: "flex items-center gap-2", children: [_jsx("input", { type: "search", placeholder: "Busca global (nome, documento, e-mail, telefone)", value: pendingSearch, onChange: (event) => setPendingSearch(event.target.value), className: "w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" }), _jsx("button", { type: "submit", className: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400", children: "Buscar" })] })] }), _jsxs("form", { onSubmit: handleFiltersSubmit, className: "grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Nome" }), _jsx("input", { type: "text", value: pendingFilters.name, onChange: (event) => setPendingFilters((prev) => ({ ...prev, name: event.target.value })), className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Bairro" }), _jsx("input", { type: "text", value: pendingFilters.district, onChange: (event) => setPendingFilters((prev) => ({ ...prev, district: event.target.value })), className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Cidade" }), _jsx("input", { type: "text", value: pendingFilters.city, onChange: (event) => setPendingFilters((prev) => ({ ...prev, city: event.target.value })), className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" })] }), _jsx("div", { className: "flex items-end justify-end", children: _jsx("button", { type: "submit", className: "w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600", children: "Aplicar filtros" }) })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400", children: [_jsxs("div", { children: ["P\u00E1gina ", meta?.page ?? 1, " de ", totalPages, " \u00B7 ", meta?.total ?? clients.length, " clientes"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "hidden md:inline", children: "Itens por p\u00E1gina" }), _jsx("select", { value: pageSize, onChange: (event) => handleChangePageSize(Number(event.target.value)), className: "rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", children: [10, 20, 50].map((size) => (_jsx("option", { value: size, children: size }, size))) })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Nome" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Documento" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Telefone" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "E-mail" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Cidade" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "UF" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Criado em" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: isLoading || isFetching ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 8, children: "Carregando clientes..." }) })) : clients.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 8, children: "Nenhum cliente encontrado para os filtros atuais." }) })) : (clients.map((client) => {
                                                const address = primaryAddress(client);
                                                return (_jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [_jsx("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: _jsx("div", { className: "font-medium", children: client.name }) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatDocument(client.document ?? undefined, client.documentType ?? undefined) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatPhone(client.phone) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: client.email ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: address?.city ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: address?.state ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatDate(client.createdAt) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: canManageClients ? (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => handleStartEdit(client), className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", disabled: updateClientMutation.isPending && editingClient?.id === client.id, children: "Editar" }), _jsx("button", { type: "button", onClick: () => void handleDelete(client), className: "rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10", disabled: deletingClientId === client.id && deleteClientMutation.isPending, children: deletingClientId === client.id && deleteClientMutation.isPending ? 'Excluindo...' : 'Excluir' })] })) : (_jsx("span", { className: "text-xs font-medium text-slate-400 dark:text-slate-600", children: "--" })) })] }, client.id));
                                            })) })] }) }), _jsxs("div", { className: "flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400", children: [_jsx("button", { type: "button", onClick: () => setPage((prev) => Math.max(prev - 1, 1)), disabled: page <= 1, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Anterior" }), _jsxs("span", { children: ["P\u00E1gina ", page, " de ", totalPages] }), _jsx("button", { type: "button", onClick: () => setPage((prev) => Math.min(prev + 1, totalPages)), disabled: page >= totalPages, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Pr\u00F3xima" })] })] })] })] }));
};
export default ClientsPage;
