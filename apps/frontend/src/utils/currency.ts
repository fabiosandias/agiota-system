/**
 * Formata um valor numérico para moeda brasileira (R$)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Retorna o valor formatado em moeda ou **** caso showBalance seja false
 */
export const formatCurrencyWithPrivacy = (value: number, showBalance: boolean): string => {
  if (!showBalance) {
    return '****';
  }
  return formatCurrency(value);
};
