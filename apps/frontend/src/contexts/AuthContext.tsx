import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler, setToken, removeToken, getToken } from '../lib/api';

type ThemeMode = 'light' | 'dark';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role?: 'admin' | 'operator' | 'viewer';
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  address?: {
    postalCode: string | null;
    street: string | null;
    number: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    complement?: string | null;
  } | null;
}

interface SignInInput {
  email: string;
  password: string;
}

interface UpdateProfileInput {
  name?: string;
  email?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  isAuthenticating: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  theme: ThemeMode;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'aitron-financeira.theme';

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(resolveInitialTheme);

  const applyTheme = (mode: ThemeMode) => {
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
        const { data } = await api.get<{ success: boolean; data: AuthUser }>('/auth/me');
        setUser(data.data);
      } catch (error) {
        setUser(null);
        removeToken();
      } finally {
        setIsInitializing(false);
      }
    };

    void loadProfile();
  }, []);

  const signIn = async (input: SignInInput) => {
    setIsAuthenticating(true);
    try {
      const { data } = await api.post<{ success: boolean; token: string; user: AuthUser }>('/auth/login', input);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorar erros de logout para garantir que sessão seja encerrada
    } finally {
      removeToken();
      setUser(null);
      navigate('/login');
    }
  };

  const updateProfile = async (input: UpdateProfileInput) => {
    const { data } = await api.put<{ success: boolean; data: AuthUser }>('/users/me', input);
    setUser(data.data);
    return data.data;
  };

  const changePassword = async (input: ChangePasswordInput) => {
    await api.put('/users/me/password', input);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isInitializing,
        isAuthenticating,
        signIn,
        signOut,
        updateProfile,
        changePassword,
        theme,
        toggleTheme
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
