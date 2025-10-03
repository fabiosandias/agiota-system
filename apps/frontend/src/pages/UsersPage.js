import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import UserForm from '../components/forms/UserForm';
import { api } from '../lib/api';
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
const formatDate = (value) => new Date(value).toLocaleDateString('pt-BR');
const ROLE_LABELS = {
    admin: 'Administrador',
    operator: 'Operador',
    viewer: 'Visualizador'
};
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
const toUserFormDefaults = (user) => ({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
    address: {
        postalCode: user.address?.postalCode ?? '',
        street: user.address?.street ?? '',
        number: user.address?.number ?? '',
        district: user.address?.district ?? '',
        city: user.address?.city ?? '',
        state: user.address?.state ?? '',
        complement: user.address?.complement ?? ''
    }
});
const UsersPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingSearch, setPendingSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['users', { searchTerm, page, pageSize }],
        queryFn: async () => {
            const response = await api.get('/v1/users', {
                params: {
                    search: searchTerm || undefined,
                    page,
                    pageSize
                }
            });
            return response.data;
        }
    });
    useEffect(() => {
        setPage(1);
    }, [searchTerm, pageSize]);
    const users = useMemo(() => data?.data ?? [], [data]);
    const meta = data?.meta;
    const editingDefaults = useMemo(() => (editingUser ? toUserFormDefaults(editingUser) : undefined), [editingUser]);
    const createUser = useMutation({
        mutationFn: async (values) => {
            const response = await api.post('/v1/users', values);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
    const updateUser = useMutation({
        mutationFn: async ({ userId, values }) => {
            const response = await api.put(`/v1/users/${userId}`, values);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
    const deleteUser = useMutation({
        mutationFn: async (userId) => {
            await api.delete(`/v1/users/${userId}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchTerm(pendingSearch.trim());
    };
    const handleCreate = async (values) => {
        setFeedback(null);
        setErrorMessage(null);
        try {
            await createUser.mutateAsync(values);
            setFeedback('Usuário cadastrado com sucesso.');
            setPage(1);
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar o usuário.'));
        }
    };
    const handleStartEdit = (user) => {
        setEditingUser(user);
        setFeedback(null);
        setErrorMessage(null);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleCancelEdit = () => {
        setEditingUser(null);
    };
    const handleUpdate = async (values) => {
        if (!editingUser)
            return;
        setFeedback(null);
        setErrorMessage(null);
        try {
            await updateUser.mutateAsync({ userId: editingUser.id, values });
            setFeedback('Usuário atualizado com sucesso.');
            setEditingUser(null);
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar o usuário.'));
        }
    };
    const handleDelete = async (user) => {
        const confirmDelete = typeof window !== 'undefined' && window.confirm(`Deseja realmente excluir o usuário "${user.email}"?`);
        if (!confirmDelete) {
            return;
        }
        setFeedback(null);
        setErrorMessage(null);
        setDeletingUserId(user.id);
        try {
            await deleteUser.mutateAsync(user.id);
            setFeedback('Usuário removido com sucesso.');
            if (editingUser?.id === user.id) {
                setEditingUser(null);
            }
            setPage((prev) => {
                if (prev > 1 && users.length === 1) {
                    return prev - 1;
                }
                return prev;
            });
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível remover o usuário.'));
        }
        finally {
            setDeletingUserId(null);
        }
    };
    const totalPages = meta?.totalPages ?? 1;
    return (_jsxs("div", { className: "space-y-10", children: [_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Cadastrar usu\u00E1rio interno" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Registre novos membros da equipe, definindo o papel e endere\u00E7o principal. A senha informada ser\u00E1 utilizada no primeiro acesso." }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx(UserForm, { mode: "create", onSubmit: handleCreate, isSubmitting: createUser.isPending, submitLabel: "Cadastrar usu\u00E1rio" }), feedback && (_jsx("p", { className: "rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: feedback })), errorMessage && (_jsx("p", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage }))] })] }), editingUser && editingDefaults && (_jsxs("section", { className: "rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm transition dark:border-indigo-500/40 dark:bg-slate-900", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-indigo-700 dark:text-indigo-300", children: "Editar usu\u00E1rio" }), _jsx("p", { className: "mt-1 text-sm text-indigo-700/80 dark:text-indigo-200/80", children: "Atualize os dados pessoais e o endere\u00E7o do colaborador. Deixe o campo de senha em branco para mant\u00EA-la inalterada." })] }), _jsx("button", { type: "button", onClick: handleCancelEdit, className: "rounded-xl border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-indigo-500/60 dark:text-indigo-200 dark:hover:bg-indigo-500/10", children: "Cancelar edi\u00E7\u00E3o" })] }), _jsx("div", { className: "mt-6", children: _jsx(UserForm, { mode: "edit", defaultValues: editingDefaults, onSubmit: handleUpdate, isSubmitting: updateUser.isPending, resetAfterSubmit: false, submitLabel: "Atualizar usu\u00E1rio", onCancel: handleCancelEdit }) })] })), _jsxs("section", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Usu\u00E1rios cadastrados" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Utilize a busca para localizar usu\u00E1rios por nome, e-mail ou telefone. Resultados paginados." })] }), _jsxs("form", { onSubmit: handleSearchSubmit, className: "flex items-center gap-2", children: [_jsx("input", { type: "search", placeholder: "Buscar por nome, e-mail ou telefone", value: pendingSearch, onChange: (event) => setPendingSearch(event.target.value), className: "w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" }), _jsx("button", { type: "submit", className: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400", children: "Buscar" })] })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400", children: [_jsxs("div", { children: ["P\u00E1gina ", meta?.page ?? 1, " de ", totalPages, " \u00B7 ", meta?.total ?? users.length, " usu\u00E1rios"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "hidden md:inline", children: "Itens por p\u00E1gina" }), _jsx("select", { value: pageSize, onChange: (event) => {
                                                    setPageSize(Number(event.target.value));
                                                    setPage(1);
                                                }, className: "rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", children: [10, 20, 50].map((size) => (_jsx("option", { value: size, children: size }, size))) })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Nome" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "E-mail" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Telefone" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Fun\u00E7\u00E3o" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Cidade" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "UF" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Criado em" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: isLoading || isFetching ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 8, children: "Carregando usu\u00E1rios..." }) })) : users.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 8, children: "Nenhum usu\u00E1rio encontrado para os filtros atuais." }) })) : (users.map((user) => (_jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [_jsx("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: _jsx("div", { className: "font-medium", children: user.firstName || user.lastName
                                                                ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                                                                : (user.name ?? user.email) }) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: user.email }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatPhone(user.phone) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: ROLE_LABELS[user.role] }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: user.address?.city ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: user.address?.state ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: formatDate(user.createdAt) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => handleStartEdit(user), className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", disabled: updateUser.isPending && editingUser?.id === user.id, children: "Editar" }), _jsx("button", { type: "button", onClick: () => void handleDelete(user), className: "rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10", disabled: deletingUserId === user.id && deleteUser.isPending, children: deletingUserId === user.id && deleteUser.isPending ? 'Excluindo...' : 'Excluir' })] }) })] }, user.id)))) })] }) }), _jsxs("div", { className: "flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400", children: [_jsx("button", { type: "button", onClick: () => setPage((prev) => Math.max(prev - 1, 1)), disabled: page <= 1, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Anterior" }), _jsxs("span", { children: ["P\u00E1gina ", page, " de ", totalPages] }), _jsx("button", { type: "button", onClick: () => setPage((prev) => Math.min(prev + 1, totalPages)), disabled: page >= totalPages, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Pr\u00F3xima" })] })] })] })] }));
};
export default UsersPage;
