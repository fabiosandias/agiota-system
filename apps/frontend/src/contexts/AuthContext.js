import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler, setToken, removeToken, getToken } from '../lib/api';
const AuthContext = createContext(undefined);
const THEME_STORAGE_KEY = 'aitron-financeira.theme';
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
    const signIn = async (input) => {
        setIsAuthenticating(true);
        try {
            const { data } = await api.post('/auth/login', input);
            setToken(data.token);
            setUser(data.user);
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
