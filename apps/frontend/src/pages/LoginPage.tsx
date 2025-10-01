import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormValues {
  email: string;
  password: string;
}

const schema = yup
  .object({
    email: yup.string().email('Informe um e-mail válido').required('E-mail é obrigatório'),
    password: yup.string().min(6, 'Senha deve possuir ao menos 6 caracteres').required('Senha é obrigatória')
  })
  .required();

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn, isAuthenticating } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      setError(null);
      await signIn(values);
      navigate('/');
    } catch (err) {
      setError('Não foi possível realizar o login. Verifique suas credenciais.');
      console.error(err);
    }
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute right-6 top-6"><ThemeToggle /></div>
      <div className="w-full max-w-md space-y-10">
        <div className="text-center text-slate-700 dark:text-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-400">Agiota System</h1>
          <p className="mt-3 text-sm">Gerencie seus empréstimos com uma experiência moderna e segura.</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="w-full space-y-6 rounded-3xl border border-white/40 bg-white/90 p-10 shadow-2xl backdrop-blur-sm transition dark:border-slate-800/60 dark:bg-slate-900/80"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-200">E-mail</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && <span className="text-xs font-medium text-red-500">{errors.email.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-200">Senha</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <span className="text-xs font-medium text-red-500">{errors.password.message}</span>}
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || isAuthenticating}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
          >
            {isSubmitting || isAuthenticating ? 'Entrando...' : 'Acessar painel'}
          </button>

          <div className="text-center text-sm">
            <Link to="/forgot-password" className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Esqueci minha senha
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
