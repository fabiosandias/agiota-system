import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import AvatarUpload from '../components/AvatarUpload';
const profileSchema = yup
    .object({
    firstName: yup.string().required('Nome é obrigatório'),
    lastName: yup.string().required('Sobrenome é obrigatório'),
    email: yup.string().email('Informe um e-mail válido').required('E-mail é obrigatório'),
    phone: yup.string().required('Telefone é obrigatório'),
    address: yup.object({
        postalCode: yup.string().required('CEP é obrigatório'),
        street: yup.string().required('Rua é obrigatória'),
        number: yup.string().required('Número é obrigatório'),
        district: yup.string().required('Bairro é obrigatório'),
        city: yup.string().required('Cidade é obrigatória'),
        state: yup.string().required('Estado é obrigatório'),
        complement: yup.string().optional()
    })
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
    const { user, changePassword } = useAuth();
    const [profileMessage, setProfileMessage] = useState(null);
    const [profileError, setProfileError] = useState(null);
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const { register, handleSubmit, control, formState: { errors: profileErrors, isSubmitting: isSavingProfile }, reset, setValue, watch } = useForm({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            avatar: null,
            address: {
                postalCode: '',
                street: '',
                number: '',
                district: '',
                city: '',
                state: '',
                complement: ''
            }
        }
    });
    const postalCode = watch('address.postalCode');
    const currentAvatar = watch('avatar');
    // Carregar dados atualizados do servidor
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const { data } = await api.get('/auth/me');
                const userData = data.data;
                if (userData) {
                    reset({
                        firstName: userData.firstName ?? '',
                        lastName: userData.lastName ?? '',
                        email: userData.email ?? '',
                        phone: userData.phone ?? '',
                        avatar: userData.avatar ?? null,
                        address: {
                            postalCode: userData.address?.postalCode ?? '',
                            street: userData.address?.street ?? '',
                            number: userData.address?.number ?? '',
                            district: userData.address?.district ?? '',
                            city: userData.address?.city ?? '',
                            state: userData.address?.state ?? '',
                            complement: userData.address?.complement ?? ''
                        }
                    });
                }
            }
            catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
                // Fallback: usar dados do context se a API falhar
                if (user) {
                    reset({
                        firstName: user.firstName ?? '',
                        lastName: user.lastName ?? '',
                        email: user.email ?? '',
                        phone: user.phone ?? '',
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
                }
            }
        };
        void loadUserData();
    }, [reset]);
    useEffect(() => {
        const fetchAddress = async () => {
            if (!postalCode)
                return;
            const cleanCep = postalCode.replace(/\D/g, '');
            if (cleanCep.length !== 8)
                return;
            setIsLoadingCep(true);
            try {
                const response = await api.get(`/v1/postal-codes/${cleanCep}`);
                const data = response.data.data;
                if (data) {
                    setValue('address.street', data.street || '');
                    setValue('address.district', data.district || '');
                    setValue('address.city', data.city || '');
                    setValue('address.state', data.state || '');
                }
            }
            catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
            finally {
                setIsLoadingCep(false);
            }
        };
        const timer = setTimeout(fetchAddress, 500);
        return () => clearTimeout(timer);
    }, [postalCode, setValue]);
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
            await api.put('/v1/users/profile', values);
            setProfileMessage('Perfil atualizado com sucesso.');
            // Recarregar dados do usuário para atualizar o avatar no header
            const { data } = await api.get('/auth/me');
            if (data.data) {
                // Atualizar o context do usuário
                window.location.reload(); // Força reload para atualizar o context
            }
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
    return (_jsxs("div", { className: "space-y-10", children: [_jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("header", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Informa\u00E7\u00F5es pessoais" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Atualize seus dados pessoais e endere\u00E7o." })] }), _jsxs("form", { onSubmit: onProfileSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid gap-8 lg:grid-cols-3", children: [_jsx("div", { className: "lg:col-span-1", children: _jsx(AvatarUpload, { currentAvatar: currentAvatar, onAvatarChange: (base64) => setValue('avatar', base64) }) }), _jsxs("div", { className: "space-y-6 lg:col-span-2", children: [_jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Nome" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('firstName') }), profileErrors.firstName && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.firstName.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Sobrenome" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('lastName') }), profileErrors.lastName && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.lastName.message })] })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "E-mail" }), _jsx("input", { type: "email", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('email') }), profileErrors.email && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.email.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Telefone" }), _jsx("input", { type: "tel", placeholder: "(00) 00000-0000", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('phone') }), profileErrors.phone && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.phone.message })] })] })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-6 dark:border-slate-700", children: [_jsx("h3", { className: "mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Endere\u00E7o" }), _jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "CEP" }), _jsx("input", { type: "text", placeholder: "00000-000", maxLength: 9, className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.postalCode'), onChange: (e) => {
                                                            const value = e.target.value.replace(/\D/g, '');
                                                            const formatted = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5, 8)}` : value;
                                                            e.target.value = formatted;
                                                            register('address.postalCode').onChange(e);
                                                        } }), isLoadingCep && _jsx("span", { className: "text-xs text-blue-500", children: "Buscando CEP..." }), profileErrors.address?.postalCode && (_jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.address.postalCode.message }))] }), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Rua" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.street') }), profileErrors.address?.street && (_jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.address.street.message }))] })] }), _jsxs("div", { className: "mt-6 grid gap-6 md:grid-cols-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "N\u00FAmero" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.number') }), profileErrors.address?.number && (_jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.address.number.message }))] }), _jsxs("div", { className: "space-y-2 md:col-span-3", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Complemento" }), _jsx("input", { type: "text", placeholder: "Apto, bloco, etc.", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.complement') })] })] }), _jsxs("div", { className: "mt-6 grid gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Bairro" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.district') }), profileErrors.address?.district && (_jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.address.district.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Cidade" }), _jsx("input", { type: "text", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.city') }), profileErrors.address?.city && _jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.address.city.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Estado" }), _jsx("input", { type: "text", maxLength: 2, placeholder: "UF", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...register('address.state') }), profileErrors.address?.state && (_jsx("span", { className: "text-xs font-medium text-red-500", children: profileErrors.address.state.message }))] })] })] }), profileMessage && (_jsx("p", { className: "rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: profileMessage })), profileError && (_jsx("p", { className: "rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: profileError })), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: isSavingProfile, className: "rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: isSavingProfile ? 'Salvando...' : 'Salvar alterações' }) })] })] }), _jsxs("section", { className: "rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("header", { className: "mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Atualizar senha" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Uma senha forte mant\u00E9m seus dados em seguran\u00E7a." })] }), _jsxs("form", { onSubmit: onPasswordSubmit, className: "grid gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Senha atual" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...registerPassword('currentPassword') }), passwordErrors.currentPassword && (_jsx("span", { className: "text-xs font-medium text-red-500", children: passwordErrors.currentPassword.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Nova senha" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...registerPassword('newPassword') }), passwordErrors.newPassword && (_jsx("span", { className: "text-xs font-medium text-red-500", children: passwordErrors.newPassword.message }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-600 dark:text-slate-300", children: "Confirmar nova senha" }), _jsx("input", { type: "password", className: "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100", ...registerPassword('confirmNewPassword') }), passwordErrors.confirmNewPassword && (_jsx("span", { className: "text-xs font-medium text-red-500", children: passwordErrors.confirmNewPassword.message }))] }), passwordMessage && (_jsx("div", { className: "md:col-span-3", children: _jsx("p", { className: "rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300", children: passwordMessage }) })), passwordError && (_jsx("div", { className: "md:col-span-3", children: _jsx("p", { className: "rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300", children: passwordError }) })), _jsx("div", { className: "flex justify-end md:col-span-3", children: _jsx("button", { type: "submit", disabled: isSavingPassword, className: "rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70", children: isSavingPassword ? 'Atualizando...' : 'Atualizar senha' }) })] })] })] }));
};
export default ProfilePage;
