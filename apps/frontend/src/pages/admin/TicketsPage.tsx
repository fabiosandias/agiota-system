import React from 'react';

export const TicketsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de Suporte</h1>
          <p className="text-gray-600 mt-1">Gerenciar tickets de todos os tenants</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-white rounded-lg shadow p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-blue-600"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sistema de Tickets em Desenvolvimento
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            O sistema de tickets de suporte será implementado em breve. Aqui você poderá visualizar
            e gerenciar todos os tickets abertos pelos tenants.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
            <p className="text-sm text-blue-800 text-left">
              <strong className="block mb-2">🚧 Funcionalidades planejadas:</strong>
              <ul className="list-disc list-inside space-y-1">
                <li>Listar todos os tickets de todos os tenants</li>
                <li>Filtrar por tenant, status, prioridade</li>
                <li>Responder tickets diretamente</li>
                <li>Atribuir tickets para membros do suporte</li>
                <li>Visualizar histórico de conversas</li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
