/**
 * Formata um valor numérico para moeda brasileira (R$)
 */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};
/**
 * Retorna o valor formatado em moeda ou **** caso showBalance seja false
 */
export const formatCurrencyWithPrivacy = (value, showBalance) => {
    if (!showBalance) {
        return '****';
    }
    return formatCurrency(value);
};
