import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
const profileSchema = yup
    .object({
    name: yup.string().min(3, 'Informe ao menos 3 caracteres').required('Nome é obrigatório'),
    email: yup.string().email('Informe um e-mail válido').required('E-mail é obrigatório')
})
    .required();
const passwordSchema = yup
    .object({
    currentPassword: yup.string().min(6, 'Senha atual inválida').required('Senha atual é obrigatória'),
    newPassword: yup.string().min(6, 'Nova senha deve possuir ao menos 6 caracteres').required('Nova senha é obrigatória'),
    confirmNewPassword: yup
        .string()
        .oneOf([yup.ref('newPassword')], 'As senhas precisam ser iguais')
        .required('Confirme a nova senha')
})
    .required();
const ProfilePage = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [profileMessage, setProfileMessage] = useState(null);
    const [profileError, setProfileError] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const { register, handleSubmit, formState: { errors: profileErrors, isSubmitting: isSavingProfile }, reset } = useForm({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            name: user?.name ?? '',
            email: user?.email ?? ''
        }
    });
    useEffect(() => {
        reset({ name: user?.name ?? '', email: user?.email ?? '' });
    }, [user, reset]);
    const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors, isSubmitting: isSavingPassword } } = useForm({
        resolver: yupResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }
    });
    const onProfileSubmit = handleSubmit(async (values) => {
        setProfileMessage(null);
        setProfileError(null);
        try {
            const updated = await updateProfile(values);
            setProfileMessage('Perfil atualizado com sucesso.');
            reset({ name: updated.name, email: updated.email });
        }
        catch (error) {
            console.error(error);
            setProfileError('Não foi possível atualizar o perfil.');
        }
    });
    const onPasswordSubmit = handlePasswordSubmit(async (values) => {
        setPasswordMessage(null);
        setPasswordError(null);
        try {
            await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
            setPasswordMessage('Senha atualizada com sucesso.');
            resetPasswordForm();
        }
        catch (error) {
            console.error(error);
            setPasswordError('Não foi possível alterar a senha. Verifique os dados informados.');
        }
    });
    return (_jsxs("div", { className: "space-y-10", children: [_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsx("header", { className: "mb-6 flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Informa\u00E7\u00F5es pessoais" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Atualize seu nome ou e-mail quando precisar." })] }) }), _jsxs("form", { onSubmit: onProfileSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Nome completo" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('name') }), profileErrors.name && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.name.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "E-mail" }), _jsx("input", { type: "email", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('email') }), profileErrors.email && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.email.message })] })] }), profileMessage && (_jsx("p", { className: "rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: profileMessage })), profileError && (_jsx("p", { className: "rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: profileError })), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: isSavingProfile, className: "rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: isSavingProfile ? 'Salvando...' : 'Salvar alterações' }) })] })] }), _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("header", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Atualizar senha" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Uma senha forte mant\u00E9m seus dados em seguran\u00E7a." })] }), _jsxs("form", { onSubmit: onPasswordSubmit, className: "grid gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Senha atual" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...registerPassword('currentPassword') }), passwordErrors.currentPassword && (_jsx("span", { className: "text-xs font-medium text-red-500", children: passwordErrors.currentPassword.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Nova senha" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...registerPassword('newPassword') }), passwordErrors.newPassword && (_jsx("span", { className: "text-xs font-medium text-red-500", children: passwordErrors.newPassword.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Confirmar nova senha" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...registerPassword('confirmNewPassword') }), passwordErrors.confirmNewPassword && (_jsx("span", { className: "text-xs font-medium text-red-500", children: passwordErrors.confirmNewPassword.message }))] }), passwordMessage && (_jsx("div", { className: "md:col-span-3", children: _jsx("p", { className: "rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: passwordMessage }) })), passwordError && (_jsx("div", { className: "md:col-span-3", children: _jsx("p", { className: "rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: passwordError }) })), _jsx("div", { className: "md:col-span-3 flex justify-end", children: _jsx("button", { type: "submit", disabled: isSavingPassword, className: "rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: isSavingPassword ? 'Atualizando...' : 'Atualizar senha' }) })] })] })] }));
};
export default ProfilePage;
