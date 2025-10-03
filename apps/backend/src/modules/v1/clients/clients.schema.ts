import { z } from 'zod';

export const addressInputSchema = z.object({
  label: z.string().trim().min(1).default('primary'),
  postalCode: z.string().trim().min(8).max(8),
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  district: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().length(2),
  complement: z.string().trim().optional()
});

export const createClientSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().email(),
  phone: z.string().trim().min(10),
  birthDate: z.coerce.date(),
  document: z
    .string()
    .trim()
    .min(11)
    .max(14)
    .transform((value) => value.replace(/\D/g, '')),
  documentType: z.enum(['cpf', 'cnpj']),
  addresses: z
    .array(
      addressInputSchema.extend({
        label: z.enum(['primary', 'business', 'billing', 'shipping']).default('primary')
      })
    )
    .min(1, 'At least one address is required')
});

export const updateClientSchema = createClientSchema.partial().extend({
  addresses: z
    .array(
      addressInputSchema.extend({
        id: z.string().uuid().optional(),
        label: z.enum(['primary', 'business', 'billing', 'shipping']).default('primary')
      })
    )
    .optional()
});

export const clientQuerySchema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
});
