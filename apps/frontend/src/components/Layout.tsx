import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import ThemeToggle from './ThemeToggle';
import Avatar from './Avatar';

type NavItem = {
  to: string;
  label: string;
  roles?: Array<'admin' | 'operator' | 'viewer'>;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/clients', label: 'Clientes' },
  { to: '/loans', label: 'Empréstimos' },
  { to: '/loans/new', label: 'Novo Empréstimo', roles: ['admin', 'operator'] },
  { to: '/accounts', label: 'Contas', roles: ['admin', 'operator'] },
  { to: '/accounts/deposit', label: 'Depósitos', roles: ['admin', 'operator'] },
  { to: '/admin/users', label: 'Usuários', roles: ['admin'] }
];

const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(() => {
    const saved = sessionStorage.getItem('showBalance');
    return saved !== null ? saved === 'true' : true;
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const allowedNavItems = useMemo(
    () => navItems.filter((item) => !item.roles || (user?.role && item.roles.includes(user.role))),
    [user]
  );

  const { data: balanceData } = useQuery({
    queryKey: ['total-balance'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { balance: number } }>('/v1/accounts/total-balance');
      return response.data;
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    enabled: !!user
  });

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const balance = balanceData?.data?.balance ?? 0;

  const toggleBalance = () => {
    setShowBalance((prev) => {
      const newValue = !prev;
      sessionStorage.setItem('showBalance', String(newValue));
      return newValue;
    });
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handler);
    }

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 px-4 pb-10 pt-8 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:flex">
          <div className="mb-8 px-2">
            <span className="text-xl font-semibold text-blue-700 dark:text-blue-400">AITRON Financeira</span>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Inteligência financeira para crédito seguro</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {allowedNavItems.map((item) => {
              const isActive = item.to === '/' ? activePath === '/' : activePath.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Sidebar mobile */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative z-50 flex w-72 flex-col border-r border-slate-200 bg-white px-4 pb-10 pt-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-8 px-2">
                <span className="text-xl font-semibold text-blue-700 dark:text-blue-400">AITRON Financeira</span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Inteligência financeira para crédito seguro</p>
              </div>
              <nav className="flex flex-1 flex-col gap-1">
                {allowedNavItems.map((item) => {
                  const isActive = item.to === '/' ? activePath === '/' : activePath.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-2xl px-3 py-3 text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 md:hidden"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Abrir menu lateral"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo total:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {showBalance ? currency.format(balance) : '•••••'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleBalance}
                    className="ml-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    aria-label={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
                  >
                    {showBalance ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <ThemeToggle />
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 pl-1 pr-3 text-left text-sm shadow-sm transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <Avatar name={user?.name} avatar={user?.avatar} />
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{user?.name}</p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
                    </div>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
                      <Link
                        to="/profile"
                        className="block rounded-xl px-3 py-2 font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                      >
                        Perfil
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          void signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-10 md:py-12">
            <div className="mx-auto max-w-6xl space-y-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
