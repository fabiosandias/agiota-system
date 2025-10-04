import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';
import { formatCurrencyWithPrivacy } from '../../utils/currency';

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
}

interface AccountsResponse {
  success: boolean;
  data: Account[];
}

interface BalanceResponse {
  success: boolean;
  data: {
    accountId: string;
    accountName: string;
    balance: number;
    currency: string;
    lastUpdated: string;
  };
}

export default function AccountBalanceCard() {
  const { showBalance } = useBalanceVisibility();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Buscar todas as contas
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery<AccountsResponse>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get<AccountsResponse>('/v1/accounts');
      return response.data;
    }
  });

  const accounts = accountsData?.data || [];

  // Auto-selecionar primeira conta quando carregada
  if (accounts.length > 0 && !selectedAccountId) {
    setSelectedAccountId(accounts[0].id);
  }

  // Buscar saldo da conta selecionada
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery<BalanceResponse>({
    queryKey: ['account-balance', selectedAccountId],
    queryFn: async () => {
      const response = await api.get<BalanceResponse>(`/v1/accounts/${selectedAccountId}/balance`);
      return response.data;
    },
    enabled: !!selectedAccountId
  });

  const balance = balanceData?.data;
  const lastUpdated = balance?.lastUpdated ? new Date(balance.lastUpdated) : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Saldo Consolidado
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Selecione uma conta para visualizar
        </p>
      </div>

      {/* Dropdown de contas */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Conta
        </label>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          disabled={isLoadingAccounts}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
        >
          {isLoadingAccounts ? (
            <option>Carregando contas...</option>
          ) : accounts.length === 0 ? (
            <option>Nenhuma conta encontrada</option>
          ) : (
            accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.type === 'checking' ? 'Corrente' : 'Poupança'})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Card de saldo */}
      {isLoadingBalance ? (
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6">
          <div className="h-6 w-32 animate-pulse rounded bg-blue-400/50" />
          <div className="mt-4 h-10 w-48 animate-pulse rounded bg-blue-400/50" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-blue-400/50" />
        </div>
      ) : balance ? (
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Saldo Disponível</p>
              <p className="mt-2 text-3xl font-bold">
                {formatCurrencyWithPrivacy(Number(balance.balance), showBalance)}
              </p>
              {lastUpdated && (
                <p className="mt-3 text-xs text-blue-100">
                  Última atualização:{' '}
                  {lastUpdated.toLocaleDateString('pt-BR')} às{' '}
                  {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">Selecione uma conta</p>
        </div>
      )}

      {/* Informações adicionais */}
      {balance && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo de Conta</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {accounts.find(a => a.id === selectedAccountId)?.type === 'checking' ? 'Corrente' : 'Poupança'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Moeda</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {balance.currency}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
