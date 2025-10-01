import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';

interface ProfileFormValues {
  name: string;
  email: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

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
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
    reset
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? ''
    }
  });

  useEffect(() => {
    reset({ name: user?.name ?? '', email: user?.email ?? '' });
  }, [user, reset]);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSavingPassword }
  } = useForm<PasswordFormValues>({
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
    } catch (error) {
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
    } catch (error) {
      console.error(error);
      setPasswordError('Não foi possível alterar a senha. Verifique os dados informados.');
    }
  });

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Informações pessoais</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Atualize seu nome ou e-mail quando precisar.</p>
          </div>
        </header>

        <form onSubmit={onProfileSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nome completo</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('name')}
              />
              {profileErrors.name && <span className="text-xs font-medium text-red-500">{profileErrors.name.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">E-mail</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('email')}
              />
              {profileErrors.email && <span className="text-xs font-medium text-red-500">{profileErrors.email.message}</span>}
            </div>
          </div>

          {profileMessage && (
            <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300">{profileMessage}</p>
          )}

          {profileError && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">{profileError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
            >
              {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition dark:border-slate-800 dark:bg-slate-900">
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Atualizar senha</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Uma senha forte mantém seus dados em segurança.</p>
        </header>

        <form onSubmit={onPasswordSubmit} className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Senha atual</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...registerPassword('currentPassword')}
            />
            {passwordErrors.currentPassword && (
              <span className="text-xs font-medium text-red-500">{passwordErrors.currentPassword.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nova senha</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...registerPassword('newPassword')}
            />
            {passwordErrors.newPassword && (
              <span className="text-xs font-medium text-red-500">{passwordErrors.newPassword.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Confirmar nova senha</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              {...registerPassword('confirmNewPassword')}
            />
            {passwordErrors.confirmNewPassword && (
              <span className="text-xs font-medium text-red-500">{passwordErrors.confirmNewPassword.message}</span>
            )}
          </div>

          {passwordMessage && (
            <div className="md:col-span-3">
              <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300">
                {passwordMessage}
              </p>
            </div>
          )}

          {passwordError && (
            <div className="md:col-span-3">
              <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
                {passwordError}
              </p>
            </div>
          )}

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
            >
              {isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProfilePage;
