import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  secondary: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const Badge: React.FC<BadgeProps> = ({ children, variant }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
};

// Badges específicos para facilitar uso

interface PlanBadgeProps {
  plan: 'free' | 'pro';
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan }) => {
  return (
    <Badge variant={plan === 'pro' ? 'success' : 'info'}>
      {plan === 'pro' ? 'PRO' : 'FREE'}
    </Badge>
  );
};

interface StatusBadgeProps {
  status: 'active' | 'past_due' | 'suspended' | 'canceled';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const variantMap: Record<string, BadgeVariant> = {
    active: 'success',
    past_due: 'warning',
    suspended: 'danger',
    canceled: 'secondary'
  };

  const labelMap: Record<string, string> = {
    active: 'Ativo',
    past_due: 'Vencido',
    suspended: 'Suspenso',
    canceled: 'Cancelado'
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
};

interface TicketStatusBadgeProps {
  status: 'aberto' | 'em_andamento' | 'resolvido' | 'fechado';
}

export const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status }) => {
  const variantMap: Record<string, BadgeVariant> = {
    aberto: 'info',
    em_andamento: 'warning',
    resolvido: 'success',
    fechado: 'secondary'
  };

  const labelMap: Record<string, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    resolvido: 'Resolvido',
    fechado: 'Fechado'
  };

  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
};
