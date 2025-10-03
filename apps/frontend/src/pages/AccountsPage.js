import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import AccountForm from '../components/forms/AccountForm';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
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
const toAccountFormDefaults = (account) => ({
    name: account.name,
    bankName: account.bankName ?? '',
    branch: account.branch ?? '',
    accountNumber: account.accountNumber ?? '',
    type: account.type,
    openingBalance: Number(account.openingBalance)
});
const AccountsPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingSearch, setPendingSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [editingAccount, setEditingAccount] = useState(null);
    const [deletingAccountId, setDeletingAccountId] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const { user } = useAuth();
    const canManageAccounts = user?.role === 'admin' || user?.role === 'operator';
    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['accounts', { searchTerm, typeFilter, page, pageSize }],
        queryFn: async () => {
            const response = await api.get('/v1/accounts', {
                params: {
                    search: searchTerm || undefined,
                    type: typeFilter === 'all' ? undefined : typeFilter,
                    page,
                    pageSize
                }
            });
            return response.data;
        }
    });
    useEffect(() => {
        setPage(1);
    }, [searchTerm, pageSize, typeFilter]);
    const accounts = useMemo(() => data?.data ?? [], [data]);
    const meta = data?.meta;
    const editingDefaults = useMemo(() => (editingAccount ? toAccountFormDefaults(editingAccount) : undefined), [editingAccount]);
    const createAccount = useMutation({
        mutationFn: async (values) => {
            const response = await api.post('/v1/accounts', values);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
    const updateAccount = useMutation({
        mutationFn: async ({ accountId, values }) => {
            const response = await api.put(`/v1/accounts/${accountId}`, values);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
    const deleteAccount = useMutation({
        mutationFn: async (accountId) => {
            await api.delete(`/v1/accounts/${accountId}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['accounts'] });
        }
    });
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchTerm(pendingSearch.trim());
    };
    const handleCreate = async (values) => {
        if (!canManageAccounts)
            return;
        setFeedback(null);
        setErrorMessage(null);
        try {
            await createAccount.mutateAsync(values);
            setFeedback('Conta cadastrada com sucesso.');
            setPage(1);
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível cadastrar a conta.'));
        }
    };
    const handleStartEdit = (account) => {
        if (!canManageAccounts)
            return;
        setEditingAccount(account);
        setFeedback(null);
        setErrorMessage(null);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    const handleCancelEdit = () => {
        setEditingAccount(null);
    };
    const handleUpdate = async (values) => {
        if (!canManageAccounts || !editingAccount)
            return;
        setFeedback(null);
        setErrorMessage(null);
        try {
            await updateAccount.mutateAsync({ accountId: editingAccount.id, values });
            setFeedback('Conta atualizada com sucesso.');
            setEditingAccount(null);
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível atualizar a conta.'));
        }
    };
    const handleDelete = async (account) => {
        if (!canManageAccounts)
            return;
        const confirmDelete = typeof window !== 'undefined' && window.confirm(`Deseja realmente excluir a conta "${account.name}"?`);
        if (!confirmDelete) {
            return;
        }
        setFeedback(null);
        setErrorMessage(null);
        setDeletingAccountId(account.id);
        try {
            await deleteAccount.mutateAsync(account.id);
            setFeedback('Conta removida com sucesso.');
            if (editingAccount?.id === account.id) {
                setEditingAccount(null);
            }
            setPage((prev) => {
                if (prev > 1 && accounts.length === 1) {
                    return prev - 1;
                }
                return prev;
            });
        }
        catch (error) {
            setErrorMessage(getErrorMessage(error, 'Não foi possível remover a conta.'));
        }
        finally {
            setDeletingAccountId(null);
        }
    };
    const totalPages = meta?.totalPages ?? 1;
    return (_jsxs("div", { className: "space-y-10", children: [canManageAccounts ? (_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Cadastrar conta financeira" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Gerencie as contas utilizadas para registrar empr\u00E9stimos, recebimentos e dep\u00F3sitos. \u00C9 poss\u00EDvel cadastrar contas da empresa ou compartilhadas." }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsx(AccountForm, { mode: "create", onSubmit: handleCreate, isSubmitting: createAccount.isPending, submitLabel: "Cadastrar conta" }), feedback && (_jsx("p", { className: "rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: feedback })), errorMessage && (_jsx("p", { className: "rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage }))] })] })) : (_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Contas financeiras" }), _jsx("p", { className: "mt-1 text-sm text-slate-500 dark:text-slate-400", children: "Voc\u00EA possui acesso somente leitura \u00E0s contas financeiras. Entre em contato com um administrador para realizar altera\u00E7\u00F5es." })] })), canManageAccounts && editingAccount && editingDefaults && (_jsxs("section", { className: "rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm transition dark:border-emerald-500/40 dark:bg-slate-900", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-emerald-700 dark:text-emerald-300", children: "Editar conta" }), _jsx("p", { className: "mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/80", children: "Ajuste os dados da conta selecionada. O saldo inicial n\u00E3o pode ser alterado ap\u00F3s a cria\u00E7\u00E3o." })] }), _jsx("button", { type: "button", onClick: handleCancelEdit, className: "rounded-xl border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-emerald-500/60 dark:text-emerald-200 dark:hover:bg-emerald-500/10", children: "Cancelar edi\u00E7\u00E3o" })] }), _jsx("div", { className: "mt-6", children: _jsx(AccountForm, { mode: "edit", defaultValues: editingDefaults, onSubmit: handleUpdate, isSubmitting: updateAccount.isPending, resetAfterSubmit: false, submitLabel: "Atualizar conta", onCancel: handleCancelEdit }) })] })), _jsxs("section", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Contas cadastradas" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Busque por nome, banco ou n\u00FAmero da conta. Use o filtro para visualizar apenas contas correntes ou poupan\u00E7a." })] }), _jsxs("form", { onSubmit: handleSearchSubmit, className: "flex flex-wrap items-center gap-2", children: [_jsx("input", { type: "search", placeholder: "Buscar por nome, banco ou n\u00FAmero", value: pendingSearch, onChange: (event) => setPendingSearch(event.target.value), className: "w-72 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" }), _jsxs("select", { value: typeFilter, onChange: (event) => setTypeFilter(event.target.value), className: "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", children: [_jsx("option", { value: "all", children: "Todos os tipos" }), _jsx("option", { value: "checking", children: "Conta corrente" }), _jsx("option", { value: "savings", children: "Conta poupan\u00E7a" })] }), _jsx("button", { type: "submit", className: "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400", children: "Aplicar" })] })] }), _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400", children: [_jsxs("div", { children: ["P\u00E1gina ", meta?.page ?? 1, " de ", totalPages, " \u00B7 ", meta?.total ?? accounts.length, " contas"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "hidden md:inline", children: "Itens por p\u00E1gina" }), _jsx("select", { value: pageSize, onChange: (event) => {
                                                    setPageSize(Number(event.target.value));
                                                    setPage(1);
                                                }, className: "rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", children: [10, 20, 50].map((size) => (_jsx("option", { value: size, children: size }, size))) })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Nome" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Banco" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Ag\u00EAncia" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Conta" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Tipo" }), _jsx("th", { className: "px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400", children: "Saldo atual" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "Criado em" }), _jsx("th", { className: "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800", children: isLoading || isFetching ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 8, children: "Carregando contas..." }) })) : accounts.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "px-4 py-6 text-center text-slate-500 dark:text-slate-400", colSpan: 8, children: "Nenhuma conta encontrada para os filtros atuais." }) })) : (accounts.map((account) => (_jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [_jsx("td", { className: "px-4 py-3 text-slate-700 dark:text-slate-200", children: account.name }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: account.bankName ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: account.branch ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: account.accountNumber ?? '--' }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: account.type === 'checking' ? 'Conta corrente' : 'Conta poupança' }), _jsx("td", { className: "px-4 py-3 text-right text-slate-500 dark:text-slate-300", children: currency.format(Number(account.currentBalance)) }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: new Date(account.createdAt).toLocaleDateString('pt-BR') }), _jsx("td", { className: "px-4 py-3 text-slate-500 dark:text-slate-300", children: canManageAccounts ? (_jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", onClick: () => handleStartEdit(account), className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", disabled: updateAccount.isPending && editingAccount?.id === account.id, children: "Editar" }), _jsx("button", { type: "button", onClick: () => void handleDelete(account), className: "rounded-lg border border-red-400 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-500/10", disabled: deletingAccountId === account.id && deleteAccount.isPending, children: deletingAccountId === account.id && deleteAccount.isPending ? 'Excluindo...' : 'Excluir' })] })) : (_jsx("span", { className: "text-xs font-medium text-slate-400 dark:text-slate-600", children: "--" })) })] }, account.id)))) })] }) }), _jsxs("div", { className: "flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400", children: [_jsx("button", { type: "button", onClick: () => setPage((prev) => Math.max(prev - 1, 1)), disabled: page <= 1, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Anterior" }), _jsxs("span", { children: ["P\u00E1gina ", page, " de ", totalPages] }), _jsx("button", { type: "button", onClick: () => setPage((prev) => Math.min(prev + 1, totalPages)), disabled: page >= totalPages, className: "rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800", children: "Pr\u00F3xima" })] })] })] })] }));
};
export default AccountsPage;
