import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import AvatarUpload from '../components/AvatarUpload';

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string | null;
  address: {
    postalCode: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    complement?: string;
  };
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

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
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
    reset,
    setValue,
    watch
  } = useForm<ProfileFormValues>({
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
        const { data } = await api.get<{ success: boolean; data: typeof user }>('/auth/me');
        const userData = data.data;
        if (userData) {
          reset({
            firstName: userData.firstName ?? '',
            lastName: userData.lastName ?? '',
            email: userData.email ?? '',
            phone: userData.phone ?? '',
            avatar: (userData as any).avatar ?? null,
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
      } catch (error) {
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
      if (!postalCode) return;
      const cleanCep = postalCode.replace(/\D/g, '');
      if (cleanCep.length !== 8) return;

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
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCep(false);
      }
    };

    const timer = setTimeout(fetchAddress, 500);
    return () => clearTimeout(timer);
  }, [postalCode, setValue]);

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
      await api.put('/v1/users/profile', values);
      setProfileMessage('Perfil atualizado com sucesso.');

      // Recarregar dados do usuário para atualizar o avatar no header
      const { data } = await api.get<{ success: boolean; data: typeof user }>('/auth/me');
      if (data.data) {
        // Atualizar o context do usuário
        window.location.reload(); // Força reload para atualizar o context
      }
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
        <header className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Informações pessoais</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Atualize seus dados pessoais e endereço.
          </p>
        </header>

        <form onSubmit={onProfileSubmit} className="space-y-6">
          {/* Layout: 1/3 foto e 2/3 dados */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Coluna da Foto (1/3) */}
            <div className="lg:col-span-1">
              <AvatarUpload
                currentAvatar={currentAvatar}
                onAvatarChange={(base64) => setValue('avatar', base64)}
              />
            </div>

            {/* Coluna dos Dados (2/3) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Nome</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    {...register('firstName')}
                  />
                  {profileErrors.firstName && <span className="text-xs font-medium text-red-500">{profileErrors.firstName.message}</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Sobrenome</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    {...register('lastName')}
                  />
                  {profileErrors.lastName && <span className="text-xs font-medium text-red-500">{profileErrors.lastName.message}</span>}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">E-mail</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    {...register('email')}
                  />
                  {profileErrors.email && <span className="text-xs font-medium text-red-500">{profileErrors.email.message}</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Telefone</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    {...register('phone')}
                  />
                  {profileErrors.phone && <span className="text-xs font-medium text-red-500">{profileErrors.phone.message}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Endereço</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">CEP</label>
                <input
                  type="text"
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.postalCode')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const formatted = value.length > 5 ? `${value.slice(0, 5)}-${value.slice(5, 8)}` : value;
                    e.target.value = formatted;
                    register('address.postalCode').onChange(e);
                  }}
                />
                {isLoadingCep && <span className="text-xs text-blue-500">Buscando CEP...</span>}
                {profileErrors.address?.postalCode && (
                  <span className="text-xs font-medium text-red-500">{profileErrors.address.postalCode.message}</span>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Rua</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.street')}
                />
                {profileErrors.address?.street && (
                  <span className="text-xs font-medium text-red-500">{profileErrors.address.street.message}</span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Número</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.number')}
                />
                {profileErrors.address?.number && (
                  <span className="text-xs font-medium text-red-500">{profileErrors.address.number.message}</span>
                )}
              </div>
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Complemento</label>
                <input
                  type="text"
                  placeholder="Apto, bloco, etc."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.complement')}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Bairro</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.district')}
                />
                {profileErrors.address?.district && (
                  <span className="text-xs font-medium text-red-500">{profileErrors.address.district.message}</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Cidade</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.city')}
                />
                {profileErrors.address?.city && <span className="text-xs font-medium text-red-500">{profileErrors.address.city.message}</span>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Estado</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="UF"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  {...register('address.state')}
                />
                {profileErrors.address?.state && (
                  <span className="text-xs font-medium text-red-500">{profileErrors.address.state.message}</span>
                )}
              </div>
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

          <div className="flex justify-end md:col-span-3">
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
