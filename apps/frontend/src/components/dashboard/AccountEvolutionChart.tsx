import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { useBalanceVisibility } from '../../contexts/BalanceVisibilityContext';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface AccountsResponse {
  success: boolean;
  data: Account[];
}

interface EvolutionPoint {
  date: string;
  cash_balance: number;
  principal_outstanding: number;
  interest_projected_remaining: number;
  interest_accrued: number;
  partial_value: number;
}

interface EvolutionResponse {
  success: boolean;
  data: {
    account_id: string;
    currency: string;
    points: EvolutionPoint[];
  };
}

type MetricKey = 'cash' | 'principal' | 'projectedInterest' | 'partial';

export default function AccountEvolutionChart() {
  const { showBalance } = useBalanceVisibility();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [visibleMetrics, setVisibleMetrics] = useState<Record<MetricKey, boolean>>({
    cash: true,
    principal: true,
    projectedInterest: true,
    partial: true
  });
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('month');

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

  // Buscar evolução da conta selecionada
  const { data: evolutionData, isLoading: isLoadingEvolution } = useQuery<EvolutionResponse>({
    queryKey: ['account-evolution', selectedAccountId, interval],
    queryFn: async () => {
      const to = new Date().toISOString().split('T')[0];
      const from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 6 meses atrás
      const response = await api.get<EvolutionResponse>(
        `/v1/accounts/${selectedAccountId}/evolution?from=${from}&to=${to}&interval=${interval}`
      );
      return response.data;
    },
    enabled: !!selectedAccountId
  });

  const points = evolutionData?.data?.points || [];

  const toggleMetric = (metric: MetricKey) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const formatCurrency = (value: number) => {
    if (!showBalance) return '****';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {formatDate(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-semibold">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Evolução Parcial por Conta
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Visualize o crescimento do patrimônio ao longo do tempo
        </p>
      </div>

      {/* Controles */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {/* Seletor de conta */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Conta
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={isLoadingAccounts}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {isLoadingAccounts ? (
              <option>Carregando contas...</option>
            ) : accounts.length === 0 ? (
              <option>Nenhuma conta encontrada</option>
            ) : (
              accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Seletor de intervalo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Intervalo
          </label>
          <div className="mt-2 flex gap-2">
            {(['day', 'week', 'month'] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  interval === int
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {int === 'day' ? 'Dia' : int === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toggles de métricas */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => toggleMetric('partial')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            visibleMetrics.partial
              ? 'border-purple-600 bg-purple-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          💎 Valor Parcial
        </button>
        <button
          onClick={() => toggleMetric('cash')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            visibleMetrics.cash
              ? 'border-green-600 bg-green-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          💵 Caixa
        </button>
        <button
          onClick={() => toggleMetric('principal')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            visibleMetrics.principal
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          📊 Principal em Aberto
        </button>
        <button
          onClick={() => toggleMetric('projectedInterest')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            visibleMetrics.projectedInterest
              ? 'border-orange-600 bg-orange-600 text-white'
              : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          📈 Juros Projetados
        </button>
      </div>

      {/* Gráfico */}
      {isLoadingEvolution ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Carregando dados...</p>
          </div>
        </div>
      ) : points.length === 0 ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">Nenhum dado disponível</p>
          </div>
        </div>
      ) : (
        <div className="mt-4" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPartial" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#64748b"
                style={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                stroke="#64748b"
                style={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {visibleMetrics.partial && (
                <Area
                  type="monotone"
                  dataKey="partial_value"
                  name="Valor Parcial"
                  stroke="#9333ea"
                  strokeWidth={3}
                  fill="url(#colorPartial)"
                />
              )}
              {visibleMetrics.cash && (
                <Area
                  type="monotone"
                  dataKey="cash_balance"
                  name="Caixa"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorCash)"
                />
              )}
              {visibleMetrics.principal && (
                <Area
                  type="monotone"
                  dataKey="principal_outstanding"
                  name="Principal em Aberto"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorPrincipal)"
                />
              )}
              {visibleMetrics.projectedInterest && (
                <Area
                  type="monotone"
                  dataKey="interest_projected_remaining"
                  name="Juros Projetados"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorInterest)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
