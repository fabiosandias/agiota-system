import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { api } from '../lib/api';

interface ResetFormValues {
  password: string;
  confirmPassword: string;
}

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
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const token = useMemo(() => params.get('token'), [params]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetFormValues>({
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
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Não foi possível redefinir a senha. O token pode estar expirado.');
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-6 top-6"><ThemeToggle /></div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center text-slate-700 dark:text-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-400">Criar nova senha</h1>
          <p className="mt-3 text-sm">Escolha uma senha forte para manter sua conta protegida.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="w-full space-y-6 rounded-3xl border border-white/40 bg-white/90 p-10 shadow-2xl backdrop-blur-sm transition dark:border-slate-800/60 dark:bg-slate-900/80"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-200">Nova senha</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <span className="text-xs font-medium text-red-500">{errors.password.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-200">Confirmar senha</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Confirme sua senha"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <span className="text-xs font-medium text-red-500">{errors.confirmPassword.message}</span>}
          </div>

          {status === 'success' && (
            <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-300">
              Senha atualizada com sucesso! Você será redirecionado para o login.
            </p>
          )}

          {status === 'error' && errorMessage && (
            <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
          >
            {isSubmitting ? 'Salvando...' : 'Atualizar senha'}
          </button>

          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
