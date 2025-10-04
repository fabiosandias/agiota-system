import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler, setToken, removeToken, getToken } from '../lib/api';
const AuthContext = createContext(undefined);
const THEME_STORAGE_KEY = 'aitron-financeira.theme';
const SESSION_START_KEY = 'aitron-financeira.session-start';
const LAST_ACTIVITY_KEY = 'aitron-financeira.last-activity';
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 horas
const resolveInitialTheme = () => {
    if (typeof window === 'undefined')
        return 'light';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
};
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [theme, setTheme] = useState(resolveInitialTheme);
    const applyTheme = (mode) => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', mode === 'dark');
            document.documentElement.style.setProperty('color-scheme', mode);
        }
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(THEME_STORAGE_KEY, mode);
        }
    };
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
            navigate('/login');
        });
        return () => {
            setUnauthorizedHandler(null);
        };
    }, [navigate]);
    useEffect(() => {
        const loadProfile = async () => {
            const token = getToken();
            if (!token) {
                setIsInitializing(false);
                return;
            }
            try {
                const { data } = await api.get('/auth/me');
                setUser(data.data);
                // Restaurar timestamps de sessão se não existirem
                const sessionStart = localStorage.getItem(SESSION_START_KEY);
                const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
                const now = Date.now();
                if (!sessionStart) {
                    localStorage.setItem(SESSION_START_KEY, now.toString());
                }
                if (!lastActivity) {
                    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
                }
            }
            catch (error) {
                setUser(null);
                removeToken();
            }
            finally {
                setIsInitializing(false);
            }
        };
        void loadProfile();
    }, []);
    // Gerenciamento de sessão: verificar timeout
    useEffect(() => {
        if (!user)
            return;
        const checkSession = () => {
            const sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY) || '0', 10);
            const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
            const now = Date.now();
            // Verificar timeout absoluto (8h)
            if (now - sessionStart > ABSOLUTE_TIMEOUT) {
                signOut();
                return;
            }
            // Verificar idle timeout (30min)
            if (now - lastActivity > IDLE_TIMEOUT) {
                signOut();
                return;
            }
        };
        const interval = setInterval(checkSession, 60000); // Verificar a cada 1 minuto
        return () => clearInterval(interval);
    }, [user]);
    // Atualizar lastActivity em eventos de usuário
    useEffect(() => {
        if (!user)
            return;
        const updateActivity = () => {
            localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        };
        // Eventos que resetam idle timeout
        window.addEventListener('mousedown', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('scroll', updateActivity);
        window.addEventListener('touchstart', updateActivity);
        return () => {
            window.removeEventListener('mousedown', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('scroll', updateActivity);
            window.removeEventListener('touchstart', updateActivity);
        };
    }, [user]);
    const signIn = async (input) => {
        setIsAuthenticating(true);
        try {
            const { data } = await api.post('/auth/login', input);
            setToken(data.token);
            setUser(data.user);
            // Iniciar sessão
            const now = Date.now();
            localStorage.setItem(SESSION_START_KEY, now.toString());
            localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        }
        finally {
            setIsAuthenticating(false);
        }
    };
    const signOut = async () => {
        try {
            await api.post('/auth/logout');
        }
        catch (error) {
            // Ignorar erros de logout para garantir que sessão seja encerrada
        }
        finally {
            removeToken();
            setUser(null);
            localStorage.removeItem(SESSION_START_KEY);
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            navigate('/login');
        }
    };
    const updateProfile = async (input) => {
        const { data } = await api.put('/users/me', input);
        setUser(data.data);
        return data.data;
    };
    const changePassword = async (input) => {
        await api.put('/users/me/password', input);
    };
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            isInitializing,
            isAuthenticating,
            signIn,
            signOut,
            updateProfile,
            changePassword,
            theme,
            toggleTheme
        }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
    }
    return context;
};
