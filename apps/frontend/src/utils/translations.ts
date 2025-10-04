// Traduções para status e tipos de transações

export const TRANSACTION_TYPES: Record<string, string> = {
  LOAN_DISBURSED: 'Empréstimo Desembolsado',
  PAYMENT_RECEIVED: 'Pagamento Recebido',
  PARTIAL_REPAYMENT: 'Pagamento Parcial',
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Saque',
  FEE: 'Taxa',
  ADJUSTMENT: 'Ajuste',
  INTEREST_ACCRUED: 'Juros Acumulados'
};

export const TRANSACTION_STATUS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  FAILED: 'Falhou'
};

export const LOAN_STATUS: Record<string, string> = {
  active: 'Ativo',
  paid: 'Pago',
  overdue: 'Atrasado',
  defaulted: 'Inadimplente'
};

export const translateTransactionType = (type: string): string => {
  return TRANSACTION_TYPES[type] || type;
};

export const translateTransactionStatus = (status: string): string => {
  return TRANSACTION_STATUS[status] || status;
};

export const translateLoanStatus = (status: string): string => {
  return LOAN_STATUS[status] || status;
};
