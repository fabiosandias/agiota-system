import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import Avatar from './Avatar';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/clients', label: 'Clientes' },
  { to: '/loans', label: 'Empréstimos' },
  { to: '/loans/new', label: 'Novo Empréstimo' },
  { to: '/accounts/deposit', label: 'Depósitos' }
];

const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
            <span className="text-xl font-semibold text-blue-700 dark:text-blue-400">Agiota System</span>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Gestão inteligente de empréstimos</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
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
                <span className="text-xl font-semibold text-blue-700 dark:text-blue-400">Agiota System</span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Gestão inteligente de empréstimos</p>
              </div>
              <nav className="flex flex-1 flex-col gap-1">
                {navItems.map((item) => {
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
                <ThemeToggle />
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 pl-1 pr-3 text-left text-sm shadow-sm transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <Avatar name={user?.name} />
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
