import { jsx as _jsx } from "react/jsx-runtime";
const variantStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200'
};
export const Badge = ({ children, variant }) => {
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`, children: children }));
};
export const PlanBadge = ({ plan }) => {
    return (_jsx(Badge, { variant: plan === 'pro' ? 'success' : 'info', children: plan === 'pro' ? 'PRO' : 'FREE' }));
};
export const StatusBadge = ({ status }) => {
    const variantMap = {
        active: 'success',
        past_due: 'warning',
        suspended: 'danger',
        canceled: 'secondary'
    };
    const labelMap = {
        active: 'Ativo',
        past_due: 'Vencido',
        suspended: 'Suspenso',
        canceled: 'Cancelado'
    };
    return _jsx(Badge, { variant: variantMap[status], children: labelMap[status] });
};
export const TicketStatusBadge = ({ status }) => {
    const variantMap = {
        aberto: 'info',
        em_andamento: 'warning',
        resolvido: 'success',
        fechado: 'secondary'
    };
    const labelMap = {
        aberto: 'Aberto',
        em_andamento: 'Em Andamento',
        resolvido: 'Resolvido',
        fechado: 'Fechado'
    };
    return _jsx(Badge, { variant: variantMap[status], children: labelMap[status] });
};
