import { z } from 'zod';

export const loanInputSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  accountId: z.string().uuid('Conta inválida'),
  principalAmount: z.number().positive('Valor principal deve ser positivo'),
  interestRate: z.number().min(0, 'Taxa de juros não pode ser negativa'),
  dueDate: z.string().datetime('Data de vencimento inválida'),
  installments: z.number().int().positive('Número de parcelas deve ser positivo').optional(),
  notes: z.string().optional()
});

export const loanQuerySchema = z.object({
  status: z.enum(['active', 'due_soon', 'overdue', 'paid', 'defaulted']).optional(),
  clientId: z.string().uuid().optional(),
  search: z.string().optional()
});

export const updateLoanSchema = z.object({
  status: z.enum(['active', 'due_soon', 'overdue', 'paid', 'defaulted']).optional(),
  notes: z.string().optional()
});

export type LoanInput = z.infer<typeof loanInputSchema>;
export type LoanQuery = z.infer<typeof loanQuerySchema>;
export type UpdateLoan = z.infer<typeof updateLoanSchema>;
