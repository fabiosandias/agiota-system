import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useBalanceVisibility } from '../contexts/BalanceVisibilityContext';
import { api } from '../lib/api';
import ThemeToggle from './ThemeToggle';
import Avatar from './Avatar';
const pageInfoMap = {
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
const navItems = [
    {
        to: '/',
        label: 'Dashboard',
        icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }) }))
    },
    {
        to: '/clients',
        label: 'Clientes',
        icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) }))
    },
    {
        to: '/loans',
        label: 'Empréstimos',
        icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" }) })),
        children: [{ to: '/loans/new', label: 'Novo Empréstimo', roles: ['admin', 'operator'] }]
    },
    {
        to: '/accounts',
        label: 'Contas',
        icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" }) })),
        roles: ['admin', 'operator'],
        children: [{ to: '/accounts/deposit', label: 'Depósito', roles: ['admin', 'operator'] }]
    },
    {
        to: '/admin/users',
        label: 'Usuários',
        icon: (_jsx("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) })),
        roles: ['admin']
    }
];
const Layout = ({ children }) => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar:collapsed');
        return saved === 'true';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isUserSidebarOpen, setIsUserSidebarOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const { showBalance, toggleBalance } = useBalanceVisibility();
    const userSidebarRef = useRef(null);
    const aiChatRef = useRef(null);
    const currentPageInfo = useMemo(() => {
        return pageInfoMap[location.pathname] || { title: 'Página', breadcrumb: [{ label: 'Página' }] };
    }, [location.pathname]);
    const allowedNavItems = useMemo(() => navItems.filter((item) => !item.roles || (user?.role && item.roles.includes(user.role))), [user]);
    const { data: balanceData } = useQuery({
        queryKey: ['total-balance'],
        queryFn: async () => {
            const response = await api.get('/v1/accounts/total-balance');
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
                }
                catch (error) {
                    setSearchResults([]);
                }
                finally {
                    setIsSearching(false);
                }
            }
            else {
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
    const toggleMenu = (path) => {
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
        const handleEsc = (e) => {
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
            focusable[0]?.focus();
        }
    }, [isUserSidebarOpen]);
    useEffect(() => {
        if (isAIChatOpen && aiChatRef.current) {
            const focusable = aiChatRef.current.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
            focusable[0]?.focus();
        }
    }, [isAIChatOpen]);
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);
    const activePath = useMemo(() => location.pathname, [location.pathname]);
    return (_jsxs("div", { className: "min-h-screen bg-slate-100 text-slate-900 transition dark:bg-slate-950 dark:text-slate-100", children: [_jsxs("div", { className: "flex min-h-screen", children: [_jsxs("aside", { className: `hidden flex-col border-r border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:flex transition-all duration-300 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}`, children: [_jsxs("div", { className: `flex items-center border-b border-slate-200 dark:border-slate-800 p-4 ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`, children: [_jsx(Link, { to: "/", className: `flex-shrink-0 ${isSidebarCollapsed ? 'w-full flex justify-center' : 'w-1/3'}`, children: _jsx("div", { className: "h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-white font-bold text-lg", children: "A" }) }) }), !isSidebarCollapsed && (_jsxs("div", { className: "flex-1 w-2/3", children: [_jsx("h1", { className: "text-sm font-bold text-blue-700 dark:text-blue-400 leading-tight", children: "AITRON FINANCEIRA" }), _jsx("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5", children: "INTELIG\u00CANCIA FINANCEIRA PARA CR\u00C9DITO SEGURO" })] }))] }), _jsx("nav", { className: "flex-1 px-3 py-4 overflow-y-auto", children: _jsx("div", { className: "space-y-1", children: allowedNavItems.map((item) => {
                                        const isActive = item.to === '/' ? activePath === '/' : activePath.startsWith(item.to);
                                        const hasChildren = item.children && item.children.length > 0;
                                        const isExpanded = expandedMenus.includes(item.to);
                                        const allowedChildren = item.children?.filter((child) => !child.roles || (user?.role && child.roles.includes(user.role)));
                                        return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Link, { to: item.to, className: `flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                                                                ? 'bg-blue-600 text-white shadow'
                                                                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'} ${isSidebarCollapsed ? 'justify-center' : ''}`, children: [_jsx("span", { className: isSidebarCollapsed ? 'text-2xl' : '', children: item.icon }), !isSidebarCollapsed && _jsx("span", { children: item.label })] }), hasChildren && !isSidebarCollapsed && allowedChildren && allowedChildren.length > 0 && (_jsx("button", { onClick: () => toggleMenu(item.to), "aria-expanded": isExpanded, "aria-controls": `submenu-${item.to}`, className: "p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition rounded", children: _jsx("svg", { className: `w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) }) }))] }), hasChildren &&
                                                    isExpanded &&
                                                    !isSidebarCollapsed &&
                                                    allowedChildren &&
                                                    allowedChildren.length > 0 && (_jsx("div", { id: `submenu-${item.to}`, role: "group", className: "ml-11 mt-1 space-y-1", children: allowedChildren.map((child) => {
                                                        const isChildActive = activePath === child.to;
                                                        return (_jsx(Link, { to: child.to, className: `block rounded-lg px-3 py-2 text-sm font-medium transition ${isChildActive
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`, children: child.label }, child.to));
                                                    }) }))] }, item.to));
                                    }) }) })] }), isMobileSidebarOpen && (_jsxs("div", { className: "fixed inset-0 z-40 flex md:hidden", children: [_jsx("div", { className: "absolute inset-0 bg-slate-900/50", onClick: () => setIsMobileSidebarOpen(false) }), _jsxs("aside", { className: "relative z-50 flex w-72 flex-col bg-white dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 p-4", children: [_jsx(Link, { to: "/", className: "flex-shrink-0 w-1/3", children: _jsx("div", { className: "h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-white font-bold text-lg", children: "A" }) }) }), _jsxs("div", { className: "flex-1 w-2/3", children: [_jsx("h1", { className: "text-sm font-bold text-blue-700 dark:text-blue-400 leading-tight", children: "AITRON FINANCEIRA" }), _jsx("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5", children: "INTELIG\u00CANCIA FINANCEIRA PARA CR\u00C9DITO SEGURO" })] })] }), _jsx("nav", { className: "flex-1 px-3 py-4 overflow-y-auto", children: _jsx("div", { className: "space-y-1", children: allowedNavItems.map((item) => {
                                                const isActive = item.to === '/' ? activePath === '/' : activePath.startsWith(item.to);
                                                const allowedChildren = item.children?.filter((child) => !child.roles || (user?.role && child.roles.includes(user.role)));
                                                return (_jsxs("div", { children: [_jsxs(Link, { to: item.to, className: `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                                                                ? 'bg-blue-600 text-white shadow'
                                                                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'}`, children: [item.icon, _jsx("span", { children: item.label })] }), allowedChildren && allowedChildren.length > 0 && (_jsx("div", { className: "ml-11 mt-1 space-y-1", children: allowedChildren.map((child) => (_jsx(Link, { to: child.to, className: "block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200", children: child.label }, child.to))) }))] }, item.to));
                                            }) }) })] })] })), _jsxs("div", { className: "flex flex-1 flex-col", children: [_jsx("header", { className: "sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80", children: _jsxs("div", { className: "flex h-16 items-center justify-between gap-4 px-4 md:px-8", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("button", { type: "button", onClick: toggleSidebar, className: "hidden md:inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", "aria-label": isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar', children: _jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: isSidebarCollapsed ? (_jsx("path", { d: "M13 5l7 7-7 7M5 5l7 7-7 7", strokeLinecap: "round", strokeLinejoin: "round" })) : (_jsx("path", { d: "M11 19l-7-7 7-7m8 14l-7-7 7-7", strokeLinecap: "round", strokeLinejoin: "round" })) }) }), _jsx("button", { type: "button", className: "inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 md:hidden", onClick: () => setIsMobileSidebarOpen((prev) => !prev), "aria-label": "Abrir menu lateral", children: _jsx("svg", { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: _jsx("path", { d: "M4 6h16M4 12h16M4 18h16", strokeLinecap: "round", strokeLinejoin: "round" }) }) }), _jsx("nav", { className: "hidden md:flex items-center gap-2 text-sm min-w-0", "aria-label": "Breadcrumb", children: currentPageInfo.breadcrumb.map((crumb, index) => (_jsxs("div", { className: "flex items-center gap-2", children: [index > 0 && (_jsx("svg", { className: "h-4 w-4 text-slate-400 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) })), crumb.to ? (_jsx(Link, { to: crumb.to, className: "text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition truncate", children: crumb.label })) : (_jsx("span", { className: "text-slate-900 font-medium dark:text-slate-100 truncate", children: crumb.label }))] }, index))) })] }), _jsx("div", { className: "hidden lg:flex flex-1 max-w-md", children: _jsxs("div", { className: "relative w-full", children: [_jsx("svg", { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("input", { type: "search", placeholder: "Buscar...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onFocus: () => searchQuery.trim().length >= 2 && setShowSearchResults(true), onBlur: () => setTimeout(() => setShowSearchResults(false), 200), className: "w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20" }), showSearchResults && (_jsx("div", { className: "absolute top-full mt-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50", children: isSearching ? (_jsxs("div", { className: "px-4 py-8 text-center text-slate-500 dark:text-slate-400", children: [_jsxs("svg", { className: "animate-spin h-6 w-6 mx-auto mb-2 text-blue-500", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("p", { className: "text-sm", children: "Buscando..." })] })) : searchResults.length > 0 ? (_jsx("div", { className: "py-2", children: searchResults.map((client) => (_jsx(Link, { to: `/clients/${client.id}`, className: "block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition border-b border-slate-100 dark:border-slate-700 last:border-b-0", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-slate-900 dark:text-slate-100", children: client.name }), _jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [client.documentType === 'CPF' ? 'CPF' : 'CNPJ', ":", ' ', client.document?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')] }), client.address && (_jsxs("p", { className: "text-xs text-slate-400 dark:text-slate-500 mt-1", children: [client.address.district, ", ", client.address.city, "/", client.address.state] }))] }), client.lastLoan && (_jsxs("div", { className: "ml-4 text-right", children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "\u00DAltimo empr\u00E9stimo" }), _jsx("p", { className: "text-sm font-semibold text-green-600 dark:text-green-400", children: new Intl.NumberFormat('pt-BR', {
                                                                                        style: 'currency',
                                                                                        currency: 'BRL'
                                                                                    }).format(client.lastLoan.amount) })] }))] }) }, client.id))) })) : (_jsxs("div", { className: "px-4 py-8 text-center text-slate-500 dark:text-slate-400", children: [_jsx("svg", { className: "h-12 w-12 mx-auto mb-2 text-slate-300 dark:text-slate-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("p", { className: "text-sm", children: "Nenhum cliente encontrado" })] })) }))] }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900", children: [_jsx("span", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: "Saldo total:" }), _jsx("span", { className: "text-sm font-bold text-slate-900 dark:text-slate-100", children: showBalance ? currency.format(balance) : '•••••' }), _jsx("button", { type: "button", onClick: toggleBalance, className: "ml-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300", "aria-label": showBalance ? 'Ocultar saldo' : 'Mostrar saldo', children: showBalance ? (_jsxs("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) : (_jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }) })) })] }), _jsx("button", { type: "button", onClick: toggleAIChat, "aria-expanded": isAIChatOpen, "aria-controls": "ai-chat-panel", className: `h-10 w-10 rounded-full border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${isAIChatOpen
                                                        ? 'border-blue-600 bg-blue-600 text-white'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'}`, "aria-label": "Abrir chat IA", children: _jsx("svg", { className: "h-5 w-5 mx-auto", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" }) }) }), _jsx(ThemeToggle, {}), _jsx("button", { type: "button", onClick: toggleUserSidebar, "aria-expanded": isUserSidebarOpen, "aria-controls": "user-sidebar-panel", className: "h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500", "aria-label": "Abrir menu de usu\u00E1rio", children: _jsx(Avatar, { name: user?.name, avatar: user?.avatar }) })] })] }) }), _jsx("div", { className: "border-b border-slate-200 bg-white/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50 md:px-8 md:py-6", children: _jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-3xl", children: currentPageInfo.title }) }), _jsx("main", { className: "flex-1 px-4 py-8 md:px-10 md:py-12", children: _jsx("div", { className: "mx-auto max-w-6xl space-y-8", children: children }) })] })] }), isUserSidebarOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-end", children: [_jsx("div", { className: "absolute inset-0 bg-slate-900/50 backdrop-blur-sm", onClick: () => setIsUserSidebarOpen(false) }), _jsx("div", { ref: userSidebarRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "user-sidebar-title", id: "user-sidebar-panel", className: "relative z-50 w-80 h-full bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 motion-reduce:transition-none animate-slideInRight", children: _jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "p-6 border-b border-slate-200 dark:border-slate-800", children: _jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Avatar, { name: user?.name, avatar: user?.avatar }), _jsxs("div", { children: [_jsx("h2", { id: "user-sidebar-title", className: "font-bold text-slate-900 dark:text-slate-100", children: user?.name }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: user?.email })] })] }), _jsx("button", { onClick: () => setIsUserSidebarOpen(false), className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", "aria-label": "Fechar", children: _jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsxs("nav", { className: "flex-1 p-4", children: [_jsxs(Link, { to: "/profile", onClick: () => setIsUserSidebarOpen(false), className: "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition", children: [_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }), _jsx("span", { className: "font-medium", children: "Perfil" })] }), _jsxs(Link, { to: "/subscription", onClick: () => setIsUserSidebarOpen(false), className: "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition", children: [_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" }) }), _jsx("span", { className: "font-medium", children: "Minha assinatura" })] }), _jsxs("button", { disabled: true, className: "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 cursor-not-allowed relative group", title: "Em breve", children: [_jsxs("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })] }), _jsx("span", { className: "font-medium", children: "Configura\u00E7\u00F5es" }), _jsx("span", { className: "absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap", children: "Em breve" })] }), _jsx("hr", { className: "my-4 border-slate-200 dark:border-slate-800" }), _jsxs("button", { type: "button", onClick: () => {
                                                setIsUserSidebarOpen(false);
                                                void signOut();
                                            }, className: "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition", children: [_jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), _jsx("span", { className: "font-medium", children: "Sair" })] })] })] }) })] })), isAIChatOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-end", children: [_jsx("div", { className: "absolute inset-0 bg-slate-900/50 backdrop-blur-sm", onClick: () => setIsAIChatOpen(false) }), _jsx("div", { ref: aiChatRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "ai-chat-title", id: "ai-chat-panel", className: "relative z-50 w-full md:w-96 h-full bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 motion-reduce:transition-none animate-slideInRight", children: _jsxs("div", { className: "flex flex-col h-full", children: [_jsx("div", { className: "p-6 border-b border-slate-200 dark:border-slate-800", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { id: "ai-chat-title", className: "text-lg font-bold text-slate-900 dark:text-slate-100", children: "Intelig\u00EAncia Artificial" }), _jsx("button", { onClick: () => setIsAIChatOpen(false), className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300", "aria-label": "Fechar", children: _jsx("svg", { className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsx("div", { className: "flex-1 p-6 overflow-y-auto", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4", children: _jsx("svg", { className: "h-8 w-8 text-blue-600 dark:text-blue-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" }) }) }), _jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2", children: "Chat IA" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Funcionalidade em desenvolvimento" })] }) })] }) })] })), _jsx("style", { children: `
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
      ` })] }));
};
export default Layout;
