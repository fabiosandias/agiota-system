import { useState } from 'react';

type PaymentProvider = 'NONE' | 'ASAAS' | 'MERCADO_PAGO';
type WhatsAppStatus = 'DISCONNECTED' | 'PENDING' | 'CONNECTED';

const SettingsPage = () => {
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('NONE');
  const [whatsappStatus] = useState<WhatsAppStatus>('DISCONNECTED');

  return (
    <div className="space-y-6">
      {/* A) Cobrança e Alertas */}
      <section className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Cobrança e Alertas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dias antes do vencimento para alertar
            </label>
            <input
              type="number"
              min="0"
              max="30"
              defaultValue={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="automaticBilling"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded"
            />
            <label htmlFor="automaticBilling" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
              Cobrança automática habilitada
            </label>
          </div>
        </div>
      </section>

      {/* B) Taxas Padrão */}
      <section className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Taxas Padrão
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Taxa de juros mensal (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={5.0}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Multa por atraso (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={2.0}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* C) Provedor de Pagamento */}
      <section className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Provedor de Pagamento
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Selecione o provedor
            </label>
            <select
              value={paymentProvider}
              onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="NONE">Nenhum</option>
              <option value="ASAAS">Asaas</option>
              <option value="MERCADO_PAGO">Mercado Pago</option>
            </select>
          </div>

          {paymentProvider === 'ASAAS' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  API Key Asaas
                </label>
                <input
                  type="password"
                  placeholder="$aact_..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  placeholder="email@example.com ou CPF/CNPJ"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {paymentProvider === 'MERCADO_PAGO' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Access Token Mercado Pago
                </label>
                <input
                  type="password"
                  placeholder="APP_USR-..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  placeholder="email@example.com ou CPF/CNPJ"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* D) Integração WhatsApp */}
      <section className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Integração WhatsApp
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Número do WhatsApp
            </label>
            <input
              type="tel"
              placeholder="+55 11 99999-9999"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Status da Conexão</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {whatsappStatus === 'DISCONNECTED' && 'Desconectado'}
                {whatsappStatus === 'PENDING' && 'Aguardando conexão...'}
                {whatsappStatus === 'CONNECTED' && 'Conectado'}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                whatsappStatus === 'CONNECTED'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : whatsappStatus === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {whatsappStatus === 'DISCONNECTED' && 'Offline'}
              {whatsappStatus === 'PENDING' && 'Pendente'}
              {whatsappStatus === 'CONNECTED' && 'Online'}
            </span>
          </div>
          {whatsappStatus === 'DISCONNECTED' && (
            <button
              type="button"
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Conectar WhatsApp
            </button>
          )}
        </div>
      </section>

      {/* E) Chaves de API */}
      <section className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Chaves de API
          </h2>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            Gerar Nova Chave
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma chave de API criada ainda.
          </p>
        </div>
      </section>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
