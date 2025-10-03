import { z } from 'zod';

// Schema de endereço específico para usuários (sem label)
const userAddressSchema = z.object({
  postalCode: z.string().trim().transform(val => val.replace(/\D/g, '')).pipe(z.string().length(8)),
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  district: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().length(2),
  complement: z.string().trim().optional()
});

export const userInputSchema = z.object({
  firstName: z.string().trim().min(2),
  lastName: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().trim().min(10),
  role: z.enum(['admin', 'operator', 'viewer']).default('operator'),
  address: userAddressSchema,
  avatar: z.string().nullable().optional()
});

export const updateUserSchema = userInputSchema.partial().extend({
  address: userAddressSchema.optional(),
  avatar: z.string().nullable().optional()
});

export const userQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
});
