import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'super_admin';
  avatar: string | null;
}

interface AdminAuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextData>({} as AdminAuthContextData);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('@AitronAdmin:token');
    const storedUser = localStorage.getItem('@AitronAdmin:user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/admin/auth/login', { email, password });

      const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data;

      // Verificar se realmente é super admin
      if (userData.role !== 'super_admin') {
        throw new Error('Acesso negado. Apenas Super Admins podem acessar esta área.');
      }

      setToken(newToken);
      setUser(userData);

      localStorage.setItem('@AitronAdmin:token', newToken);
      localStorage.setItem('@AitronAdmin:refreshToken', newRefreshToken);
      localStorage.setItem('@AitronAdmin:user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      navigate('/admin');
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(
        error.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.'
      );
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('@AitronAdmin:token');
    localStorage.removeItem('@AitronAdmin:user');

    delete api.defaults.headers.common['Authorization'];

    navigate('/admin/login');
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('@AitronAdmin:refreshToken');

      if (!storedRefreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await api.post('/admin/auth/refresh', {
        refreshToken: storedRefreshToken
      });

      const { token: newToken, refreshToken: newRefreshToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);

      localStorage.setItem('@AitronAdmin:token', newToken);
      localStorage.setItem('@AitronAdmin:refreshToken', newRefreshToken);
      localStorage.setItem('@AitronAdmin:user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshToken
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }

  return context;
};
