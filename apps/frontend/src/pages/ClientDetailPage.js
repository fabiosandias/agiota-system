import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
const ClientDetailPage = () => {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    useEffect(() => {
        const fetchClient = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/v1/clients/${id}`);
                setClient(response.data.data);
            }
            catch (err) {
                setError(err.response?.data?.message || 'Erro ao carregar cliente');
            }
            finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [id]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-96", children: _jsxs("div", { className: "text-center", children: [_jsxs("svg", { className: "animate-spin h-10 w-10 mx-auto mb-4 text-blue-600", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Carregando..." })] }) }));
    }
    if (error || !client) {
        return (_jsx("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: _jsx("p", { className: "text-red-800 dark:text-red-200", children: error || 'Cliente não encontrado' }) }));
    }
    // Build timeline from loans and payments
    const timelineEvents = [];
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
                date: payment.paidAt,
                payment,
                loanId: loan.id,
            });
        });
    });
    // Sort timeline by date descending (most recent first)
    timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };
    const formatDocument = (doc, type) => {
        if (type === 'CPF') {
            return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };
    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: { label: 'Ativo', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
            PAID: { label: 'Pago', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
            OVERDUE: { label: 'Atrasado', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
            DEFAULTED: { label: 'Inadimplente', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
        };
        const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
        return (_jsx("span", { className: `px-2 py-1 rounded-full text-xs font-medium ${badge.className}`, children: badge.label }));
    };
    const totalLoaned = client.loans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);
    const totalPaid = client.loans.reduce((sum, loan) => sum + Number(loan.totalPaid), 0);
    const totalRemaining = client.loans.reduce((sum, loan) => sum + Number(loan.remainingAmount), 0);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-slate-100", children: "Detalhes do Cliente" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mt-1", children: "Informa\u00E7\u00F5es completas e hist\u00F3rico de atividades" })] }), _jsx(Link, { to: "/clients", className: "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700", children: "Voltar" })] }), _jsx("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Nome Completo" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: client.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: client.documentType }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: formatDocument(client.document, client.documentType) })] }), client.email && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "E-mail" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: client.email })] })), client.phone && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Telefone" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: client.phone })] })), client.birthDate && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Data de Nascimento" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: new Date(client.birthDate).toLocaleDateString('pt-BR') })] })), client.addresses[0] && (_jsxs("div", { className: "md:col-span-2 lg:col-span-3", children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mb-2", children: "Endere\u00E7o Principal" }), _jsxs("p", { className: "text-base text-slate-900 dark:text-slate-100", children: [client.addresses[0].street, ", ", client.addresses[0].number, client.addresses[0].complement && ` - ${client.addresses[0].complement}`, _jsx("br", {}), client.addresses[0].district, ", ", client.addresses[0].city, "/", client.addresses[0].state, " -", ' ', client.addresses[0].postalCode] })] }))] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: "Total Emprestado" }), _jsx("p", { className: "text-2xl font-bold text-blue-900 dark:text-blue-100", children: currency.format(totalLoaned) })] }), _jsxs("div", { className: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-green-700 dark:text-green-300", children: "Total Pago" }), _jsx("p", { className: "text-2xl font-bold text-green-900 dark:text-green-100", children: currency.format(totalPaid) })] }), _jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4", children: [_jsx("p", { className: "text-sm text-amber-700 dark:text-amber-300", children: "Saldo Devedor" }), _jsx("p", { className: "text-2xl font-bold text-amber-900 dark:text-amber-100", children: currency.format(totalRemaining) })] })] }), _jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-slate-100 mb-6", children: "Linha do Tempo" }), timelineEvents.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" }) }), _jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Nenhuma atividade registrada" })] })) : (_jsx("div", { className: "space-y-6", children: timelineEvents.map((event, index) => (_jsxs("div", { className: "relative", children: [index < timelineEvents.length - 1 && (_jsx("div", { className: "absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" })), _jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "flex-shrink-0", children: event.type === 'loan' ? (_jsx("div", { className: "w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center", children: _jsxs("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: [_jsx("path", { d: "M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" }), _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z", clipRule: "evenodd" })] }) })) : (_jsx("div", { className: "w-8 h-8 bg-green-500 rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) })) }), _jsxs("div", { className: "flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: event.type === 'loan' ? 'Empréstimo Realizado' : 'Pagamento Recebido' }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: formatDate(event.date) })] }), event.type === 'loan' && event.loan && getStatusBadge(event.loan.status)] }), event.type === 'loan' && event.loan && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Valor Principal" }), _jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: currency.format(Number(event.loan.principalAmount)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Juros" }), _jsxs("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: [event.loan.interestRate, "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Total" }), _jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: currency.format(Number(event.loan.totalAmount)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Restante" }), _jsx("p", { className: "font-semibold text-amber-600 dark:text-amber-400", children: currency.format(Number(event.loan.remainingAmount)) })] })] })), event.type === 'payment' && event.payment && (_jsxs("div", { className: "grid grid-cols-2 gap-4 mt-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Valor Pago" }), _jsx("p", { className: "font-semibold text-green-600 dark:text-green-400", children: currency.format(Number(event.payment.amount)) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "M\u00E9todo" }), _jsx("p", { className: "font-semibold text-slate-900 dark:text-slate-100", children: event.payment.paymentMethod })] })] }))] })] })] }, event.id))) }))] })] }));
};
export default ClientDetailPage;
