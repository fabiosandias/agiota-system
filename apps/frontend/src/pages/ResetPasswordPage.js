import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { api } from '../lib/api';
const schema = yup
    .object({
    password: yup.string().min(6, 'Senha deve possuir ao menos 6 caracteres').required('Senha é obrigatória'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'As senhas precisam ser iguais')
        .required('Confirme a nova senha')
})
    .required();
const ResetPasswordPage = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState(null);
    const token = useMemo(() => params.get('token'), [params]);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            password: '',
            confirmPassword: ''
        }
    });
    const onSubmit = handleSubmit(async (values) => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Token de recuperação ausente.');
            return;
        }
        setStatus('idle');
        setErrorMessage(null);
        try {
            await api.post('/auth/reset-password', { token, password: values.password });
            setStatus('success');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
        catch (error) {
            console.error(error);
            setStatus('error');
            setErrorMessage('Não foi possível redefinir a senha. O token pode estar expirado.');
        }
    });
    return (_jsxs("div", { className: "relative flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950", children: [_jsx("div", { className: "absolute right-6 top-6", children: _jsx(ThemeToggle, {}) }), _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { className: "text-center text-slate-700 dark:text-slate-200", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-400", children: "Criar nova senha" }), _jsx("p", { className: "mt-3 text-sm", children: "Escolha uma senha forte para manter sua conta protegida." })] }), _jsxs("form", { onSubmit: onSubmit, className: "w-full space-y-6 rounded-3xl border border-white/40 bg-white/90 p-10 shadow-2xl backdrop-blur-sm transition dark:border-slate-800/60 dark:bg-slate-900/80", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-200", children: "Nova senha" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...register('password') }), errors.password && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.password.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-200", children: "Confirmar senha" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", placeholder: "Confirme sua senha", ...register('confirmPassword') }), errors.confirmPassword && _jsx("span", { className: "text-xs font-medium text-red-500", children: errors.confirmPassword.message })] }), status === 'success' && (_jsx("p", { className: "rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: "Senha atualizada com sucesso! Voc\u00EA ser\u00E1 redirecionado para o login." })), status === 'error' && errorMessage && (_jsx("p", { className: "rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: errorMessage })), _jsx("button", { type: "submit", disabled: isSubmitting, className: "w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: isSubmitting ? 'Salvando...' : 'Atualizar senha' }), _jsx("div", { className: "text-center text-sm", children: _jsx(Link, { to: "/login", className: "font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300", children: "Voltar para o login" }) })] })] })] }));
};
export default ResetPasswordPage;
