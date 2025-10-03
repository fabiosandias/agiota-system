import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { PlanBadge, StatusBadge } from '../../components/admin/Badge';

interface Tenant {
  id: string;
  businessName: string;
  adminName: string;
  adminEmail: string;
  plan: 'free' | 'pro';
  status: 'active' | 'past_due' | 'suspended' | 'canceled';
  subscriptionEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type Tab = 'overview' | 'profile' | 'subscription' | 'payments' | 'tickets';

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  useEffect(() => {
    if (id) {
      loadTenant();
    }
  }, [id]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/tenants/${id}`);
      setTenant(response.data);
    } catch (error) {
      console.error('Erro ao carregar tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Visão Geral', icon: '📊' },
    { id: 'profile' as Tab, label: 'Perfil', icon: '🏢' },
    { id: 'subscription' as Tab, label: 'Assinatura', icon: '💳' },
    { id: 'payments' as Tab, label: 'Pagamentos', icon: '💰' },
    { id: 'tickets' as Tab, label: 'Tickets', icon: '🎫' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tenant não encontrado</p>
        <Link to="/admin/tenants" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              {tenant.businessName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.businessName}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <PlanBadge plan={tenant.plan} />
                <StatusBadge status={tenant.status} />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  <strong>Admin:</strong> {tenant.adminName} ({tenant.adminEmail})
                </p>
                <p>
                  <strong>Criado em:</strong>{' '}
                  {new Date(tenant.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium">
              Editar
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
              Ações
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab tenant={tenant} />}
          {activeTab === 'profile' && <ProfileTab tenant={tenant} />}
          {activeTab === 'subscription' && <SubscriptionTab tenant={tenant} />}
          {activeTab === 'payments' && <PaymentsTab tenant={tenant} />}
          {activeTab === 'tickets' && <TicketsTab tenant={tenant} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const stats = [
    { label: 'Total de Empréstimos', value: '0', color: 'bg-blue-100 text-blue-600' },
    { label: 'Clientes Cadastrados', value: '0', color: 'bg-green-100 text-green-600' },
    { label: 'Usuários Ativos', value: '0', color: 'bg-purple-100 text-purple-600' },
    { label: 'Valor Total Emprestado', value: 'R$ 0,00', color: 'bg-yellow-100 text-yellow-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          🚧 Estatísticas detalhadas serão implementadas em breve
        </p>
      </div>
    </div>
  );
};

// Profile Tab
const ProfileTab: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={tenant.businessName}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="pt-2">
              <StatusBadge status={tenant.status} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Administrador
            </label>
            <input
              type="text"
              value={tenant.adminName}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail do Administrador
            </label>
            <input
              type="email"
              value={tenant.adminEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          🚧 Edição de perfil será implementada em breve
        </p>
      </div>
    </div>
  );
};

// Subscription Tab
const SubscriptionTab: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes da Assinatura</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plano Atual</label>
            <div className="pt-2">
              <PlanBadge plan={tenant.plan} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="pt-2">
              <StatusBadge status={tenant.status} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Vencimento
            </label>
            <input
              type="text"
              value={
                tenant.subscriptionEndsAt
                  ? new Date(tenant.subscriptionEndsAt).toLocaleDateString('pt-BR')
                  : 'Sem vencimento'
              }
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mensal</label>
            <input
              type="text"
              value={tenant.plan === 'pro' ? 'R$ 99,90' : 'Grátis'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          🚧 Gerenciamento de assinatura será implementado em breve
        </p>
      </div>
    </div>
  );
};

// Payments Tab
const PaymentsTab: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Histórico de Pagamentos</h3>
      </div>

      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-900">Nenhum pagamento registrado</p>
        <p className="text-xs text-gray-500 mt-1">
          🚧 Histórico de pagamentos será implementado em breve
        </p>
      </div>
    </div>
  );
};

// Tickets Tab
const TicketsTab: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Tickets de Suporte</h3>
      </div>

      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-900">Nenhum ticket registrado</p>
        <p className="text-xs text-gray-500 mt-1">
          🚧 Sistema de tickets será implementado em breve
        </p>
      </div>
    </div>
  );
};
