import { z } from 'zod';

export const accountInputSchema = z.object({
  name: z.string().trim().min(2),
  bankName: z.string().trim().min(2),
  branch: z.string().trim().min(1),
  accountNumber: z.string().trim().min(1),
  type: z.enum(['checking', 'savings']).default('checking'),
  openingBalance: z.coerce.number().min(0)
});

export const updateAccountSchema = accountInputSchema.partial();

export const accountQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['checking', 'savings']).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
});
