import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: string;
}

interface Loan {
  id: string;
  principalAmount: number;
  interestRate: number;
  status: string;
  createdAt: string;
  payments: Payment[];
}

interface Client {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  document: string;
  documentType: string;
  birthDate?: string;
  createdAt: string;
  addresses: Address[];
  loans: Loan[];
}

interface TimelineEvent {
  id: string;
  type: 'loan' | 'payment';
  date: string;
  loan?: Loan;
  payment?: Payment;
  loanId?: string;
}

const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/v1/clients/${id}`);
        setClient(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error || 'Cliente não encontrado'}</p>
      </div>
    );
  }

  // Build timeline from loans and payments
  const timelineEvents: TimelineEvent[] = [];

  client.loans.forEach((loan) => {
    // Add loan creation event
    timelineEvents.push({
      id: `loan-${loan.id}`,
      type: 'loan',
      date: loan.createdAt,
      loan,
    });

    // Add payment events
    loan.payments.forEach((payment) => {
      timelineEvents.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        date: payment.paymentDate,
        payment,
        loanId: loan.id,
      });
    });
  });

  // Sort timeline by date descending (most recent first)
  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDocument = (doc: string, type: string) => {
    if (type === 'CPF') {
      return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      PAID: { label: 'Pago', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      OVERDUE: { label: 'Atrasado', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
      DEFAULTED: { label: 'Inadimplente', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const calculateLoanTotals = (loan: Loan) => {
    const principal = Number(loan.principalAmount);
    const totalAmount = principal * (1 + Number(loan.interestRate) / 100);
    const totalPaid = loan.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingAmount = totalAmount - totalPaid;
    return { totalAmount, totalPaid, remainingAmount };
  };

  const totalLoaned = client.loans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);
  const totalPaid = client.loans.reduce((sum, loan) => {
    const { totalPaid } = calculateLoanTotals(loan);
    return sum + totalPaid;
  }, 0);
  const totalRemaining = client.loans.reduce((sum, loan) => {
    const { remainingAmount } = calculateLoanTotals(loan);
    return sum + remainingAmount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Detalhes do Cliente</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Informações completas e histórico de atividades
          </p>
        </div>
        <Link
          to="/clients"
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
        >
          Voltar
        </Link>
      </div>

      {/* Client Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nome Completo</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{client.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{client.documentType}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {formatDocument(client.document, client.documentType)}
            </p>
          </div>
          {client.email && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">E-mail</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{client.email}</p>
            </div>
          )}
          {client.phone && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Telefone</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{client.phone}</p>
            </div>
          )}
          {client.birthDate && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Data de Nascimento</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {new Date(client.birthDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
          {client.addresses[0] && (
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Endereço Principal</p>
              <p className="text-base text-slate-900 dark:text-slate-100">
                {client.addresses[0].street}, {client.addresses[0].number}
                {client.addresses[0].complement && ` - ${client.addresses[0].complement}`}
                <br />
                {client.addresses[0].district}, {client.addresses[0].city}/{client.addresses[0].state} -{' '}
                {client.addresses[0].postalCode}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">Total Emprestado</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{currency.format(totalLoaned)}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-300">Total Pago</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{currency.format(totalPaid)}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300">Saldo Devedor</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{currency.format(totalRemaining)}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Linha do Tempo</h2>

        {timelineEvents.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-slate-500 dark:text-slate-400">Nenhuma atividade registrada</p>
          </div>
        ) : (
          <div className="space-y-6">
            {timelineEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {event.type === 'loan' ? (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {event.type === 'loan' ? 'Empréstimo Realizado' : 'Pagamento Recebido'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(event.date)}</p>
                      </div>
                      {event.type === 'loan' && event.loan && getStatusBadge(event.loan.status)}
                    </div>

                    {event.type === 'loan' && event.loan && (() => {
                      const { totalAmount, totalPaid, remainingAmount } = calculateLoanTotals(event.loan);
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Valor Principal</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {currency.format(Number(event.loan.principalAmount))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Juros</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {Number(event.loan.interestRate)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {currency.format(totalAmount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Restante</p>
                            <p className="font-semibold text-amber-600 dark:text-amber-400">
                              {currency.format(remainingAmount)}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {event.type === 'payment' && event.payment && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Valor Pago</p>
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {currency.format(Number(event.payment.amount))}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Método</p>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {event.payment.method || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
