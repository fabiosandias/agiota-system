import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { BalanceVisibilityProvider } from './contexts/BalanceVisibilityContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/Toast';
import './styles/tailwind.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <BalanceVisibilityProvider>
                <AppRoutes />
                <ToastContainer />
              </BalanceVisibilityProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
