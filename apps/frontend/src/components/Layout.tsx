import { Link, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import { api } from '../lib/api';
import ThemeToggle from './ThemeToggle';
import Avatar from './Avatar';
// teste

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Array<'admin' | 'operator' | 'viewer'>;
  children?: Array<{
    to: string;
    label: string;
    roles?: Array<'admin' | 'operator' | 'viewer'>;
  }>;
};

type PageInfo = {
  title: string;
  breadcrumb: Array<{ label: string; to?: string }>;
};

const pageInfoMap: Record<string, PageInfo> = {
  '/': {
    title: 'Dashboard',
    breadcrumb: [{ label: 'Dashboard' }]
  },
  '/clients': {
    title: 'Clientes',
    breadcrumb: [{ label: 'Clientes' }]
  },
  '/loans': {
    title: 'Empréstimos',
    breadcrumb: [{ label: 'Empréstimos' }]
  },
  '/loans/new': {
    title: 'Novo Empréstimo',
    breadcrumb: [{ label: 'Empréstimos', to: '/loans' }, { label: 'Novo Empréstimo' }]
  },
  '/accounts': {
    title: 'Contas',
    breadcrumb: [{ label: 'Contas' }]
  },
  '/accounts/deposit': {
    title: 'Depósito',
    breadcrumb: [{ label: 'Contas', to: '/accounts' }, { label: 'Depósito' }]
  },
  '/admin/users': {
    title: 'Usuários',
    breadcrumb: [{ label: 'Usuários' }]
  },
  '/profile': {
    title: 'Perfil',
    breadcrumb: [{ label: 'Perfil' }]
  }
};

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    )
  },
  {
    to: '/clients',
    label: 'Clientes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    )
  },
  {
    to: '/loans',
    label: 'Empréstimos',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
    children: [{ to: '/loans/new', label: 'Novo Empréstimo', roles: ['admin', 'operator'] }]
  },
  {
    to: '/accounts',
    label: 'Contas',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    roles: ['admin', 'operator'],
    children: [{ to: '/accounts/deposit', label: 'Depósito', roles: ['admin', 'operator'] }]
  },
  {
    to: '/admin/users',
    label: 'Usuários',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    roles: ['admin']
  }
];

const Layout = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar:collapsed');
    return saved === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { showBalance, toggleBalance } = useBalanceVisibility();
  const userSidebarRef = useRef<HTMLDivElement | null>(null);
  const aiChatRef = useRef<HTMLDivElement | null>(null);

  const currentPageInfo = useMemo(() => {
    return pageInfoMap[location.pathname] || { title: 'Página', breadcrumb: [{ label: 'Página' }] };
  }, [location.pathname]);

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
    refetchInterval: 30000,
    enabled: !!user
  });

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const balance = balanceData?.data?.balance ?? 0;

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const response = await api.get(`/v1/clients/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(response.data.data || []);
          setShowSearchResults(true);
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleSidebar = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem('sidebar:collapsed', String(newValue));
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  };

  const toggleUserSidebar = () => {
    setIsUserSidebarOpen((prev) => !prev);
    setIsAIChatOpen(false);
  };

  const toggleAIChat = () => {
    setIsAIChatOpen((prev) => !prev);
    setIsUserSidebarOpen(false);
  };

  // Close on Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserSidebarOpen(false);
        setIsAIChatOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Focus trap
  useEffect(() => {
    if (isUserSidebarOpen && userSidebarRef.current) {
      const focusable = userSidebarRef.current.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      (focusable[0] as HTMLElement)?.focus();
    }
  }, [isUserSidebarOpen]);

  useEffect(() => {
    if (isAIChatOpen && aiChatRef.current) {
      const focusable = aiChatRef.current.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      (focusable[0] as HTMLElement)?.focus();
    }
  }, [isAIChatOpen]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside
          className={`hidden flex-col border-r border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:flex transition-all duration-300 fixed left-0 top-0 bottom-0 h-screen z-40 overflow-hidden ${
            isSidebarCollapsed ? 'w-[72px]' : 'w-[280px]'
          }`}
        >
          {/* Branding Block - 1/3 logo + 2/3 texto */}
          <div
            className={`flex items-center border-b border-slate-200 dark:border-slate-800 p-4 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}
          >
            <Link to="/" className={`flex-shrink-0 ${isSidebarCollapsed ? 'w-full flex justify-center' : 'w-1/3'}`}>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </Link>
            {!isSidebarCollapsed && (
              <div className="flex-1 w-2/3">
                <h1 className="text-sm font-bold text-blue-700 dark:text-blue-400 leading-tight">AITRON FINANCEIRA</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  INTELIGÊNCIA FINANCEIRA PARA CRÉDITO SEGURO
                </p>
              </div>
            )}
          </div>

          {/* Navigation with icons and tree */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {allowedNavItems.map((item) => {
                const isActive = item.to === '/' ? activePath === '/' : activePath.startsWith(item.to);
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedMenus.includes(item.to);
                const allowedChildren = item.children?.filter(
                  (child) => !child.roles || (user?.role && child.roles.includes(user.role))
                );

                return (
                  <div key={item.to}>
                    <div className="flex items-center gap-1">
                      <Link
                        to={item.to}
                        className={`flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
                        } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <span className={isSidebarCollapsed ? 'text-2xl' : ''}>{item.icon}</span>
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                      {hasChildren && !isSidebarCollapsed && allowedChildren && allowedChildren.length > 0 && (
                        <button
                          onClick={() => toggleMenu(item.to)}
                          aria-expanded={isExpanded}
                          aria-controls={`submenu-${item.to}`}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition rounded"
                        >
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {hasChildren &&
                      isExpanded &&
                      !isSidebarCollapsed &&
                      allowedChildren &&
                      allowedChildren.length > 0 && (
                        <div id={`submenu-${item.to}`} role="group" className="ml-11 mt-1 space-y-1">
                          {allowedChildren.map((child) => {
                            const isChildActive = activePath === child.to;
                            return (
                              <Link
                                key={child.to}
                                to={child.to}
                                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                                  isChildActive
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setIsMobileSidebarOpen(false)} />
            <aside className="relative z-50 flex w-72 flex-col bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 p-4">
                <Link to="/" className="flex-shrink-0 w-1/3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                </Link>
                <div className="flex-1 w-2/3">
                  <h1 className="text-sm font-bold text-blue-700 dark:text-blue-400 leading-tight">
                    AITRON FINANCEIRA
                  </h1>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    INTELIGÊNCIA FINANCEIRA PARA CRÉDITO SEGURO
                  </p>
                </div>
              </div>
              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="space-y-1">
                  {allowedNavItems.map((item) => {
                    const isActive = item.to === '/' ? activePath === '/' : activePath.startsWith(item.to);
                    const allowedChildren = item.children?.filter(
                      (child) => !child.roles || (user?.role && child.roles.includes(user.role))
                    );
                    return (
                      <div key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                        {allowedChildren && allowedChildren.length > 0 && (
                          <div className="ml-11 mt-1 space-y-1">
                            {allowedChildren.map((child) => (
                              <Link
                                key={child.to}
                                to={child.to}
                                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </nav>
            </aside>
          </div>
        )}

        <div className={`flex flex-1 flex-col transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[280px]'}`}>
          <header className={`fixed top-0 right-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 transition-all duration-300 ${
            isSidebarCollapsed ? 'left-0 md:left-[72px]' : 'left-0 md:left-[280px]'
          }`}>
            <div className="flex h-16 items-center gap-4 px-4 md:px-8">
              {/* Left: Menu buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Collapse button - desktop only */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {isSidebarCollapsed ? (
                      <path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </button>

                {/* Mobile menu button */}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 md:hidden"
                  onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                  aria-label="Abrir menu lateral"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Center: Search bar */}
              <div className="hidden lg:flex flex-1 justify-center">
                <div className="relative w-full max-w-lg">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="search"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                  />

                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                      {isSearching ? (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          <svg
                            className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <p className="text-sm">Buscando...</p>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((client) => (
                            <Link
                              key={client.id}
                              to={`/clients/${client.id}`}
                              className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 dark:text-slate-100">
                                    {client.name}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {client.documentType === 'CPF' ? 'CPF' : 'CNPJ'}:{' '}
                                    {client.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                                  </p>
                                  {client.address && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                      {client.address.district}, {client.address.city}/{client.address.state}
                                    </p>
                                  )}
                                </div>
                                {client.lastLoan && (
                                  <div className="ml-4 text-right">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Último empréstimo</p>
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(client.lastLoan.amount)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          <svg
                            className="h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm">Nenhum cliente encontrado</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Balance + AI + Theme + Avatar */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Balance */}
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

                {/* AI Button */}
                <button
                  type="button"
                  onClick={toggleAIChat}
                  aria-expanded={isAIChatOpen}
                  aria-controls="ai-chat-panel"
                  className={`h-10 w-10 rounded-full border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isAIChatOpen
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                  }`}
                  aria-label="Abrir chat IA"
                >
                  <svg
                    className="h-5 w-5 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Avatar - APENAS o avatar, sem nome/email */}
                <button
                  type="button"
                  onClick={toggleUserSidebar}
                  aria-expanded={isUserSidebarOpen}
                  aria-controls="user-sidebar-panel"
                  className="h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Abrir menu de usuário"
                >
                  <Avatar name={user?.name} avatar={user?.avatar} />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 md:px-10 md:py-12 mt-16">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {/* User Sidebar - right side */}
      {isUserSidebarOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsUserSidebarOpen(false)}
          />
          <div
            ref={userSidebarRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-sidebar-title"
            id="user-sidebar-panel"
            className="relative z-50 w-80 h-full bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 motion-reduce:transition-none animate-slideInRight"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={user?.name} avatar={user?.avatar} />
                    <div>
                      <h2 id="user-sidebar-title" className="font-bold text-slate-900 dark:text-slate-100">
                        {user?.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUserSidebarOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label="Fechar"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <nav className="flex-1 p-4">
                <Link
                  to="/profile"
                  onClick={() => setIsUserSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">Perfil</span>
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setIsUserSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="font-medium">Minha assinatura</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/settings"
                    onClick={() => setIsUserSidebarOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Configurações</span>
                  </Link>
                )}
                <hr className="my-4 border-slate-200 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setIsUserSidebarOpen(false);
                    void signOut();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="font-medium">Sair</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel - right side */}
      {isAIChatOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAIChatOpen(false)} />
          <div
            ref={aiChatRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-chat-title"
            id="ai-chat-panel"
            className="relative z-50 w-full md:w-96 h-full bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 motion-reduce:transition-none animate-slideInRight"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 id="ai-chat-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Inteligência Artificial
                  </h2>
                  <button
                    onClick={() => setIsAIChatOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label="Fechar"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="text-center py-12">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <svg
                      className="h-8 w-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Chat IA</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Funcionalidade em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Layout;
