import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { hashPassword } from '../../utils/password.js';

const router = Router();

// Schemas de validação
const addressSchema = z.object({
  postalCode: z.string().trim().transform(val => val.replace(/\D/g, '')).pipe(z.string().length(8)),
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  district: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().length(2),
  complement: z.string().trim().optional()
});

const createTenantSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  cpfCnpj: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: addressSchema.optional(),
  plan: z.enum(['free', 'pro']).default('free'),
  // Dados do usuário admin do tenant
  adminFirstName: z.string().trim().min(2),
  adminLastName: z.string().trim().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8)
});

const updateTenantSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
  cpfCnpj: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: addressSchema.optional(),
  plan: z.enum(['free', 'pro']).optional(),
  status: z.enum(['active', 'past_due', 'suspended', 'canceled']).optional(),
  billingMethod: z.enum(['pix', 'credit_card']).optional(),
  nextDueAt: z.string().datetime().optional()
});

/**
 * Middleware para verificar se usuário é super admin
 */
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'super_admin') {
    return next(createHttpError(403, 'Acesso negado. Apenas Super Admin.'));
  }
  next();
};

router.use(requireSuperAdmin);

/**
 * GET /admin/tenants
 * Lista todos os tenants
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = '1', pageSize = '20', status, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cpfCnpj: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, tenants] = await prisma.$transaction([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          address: true,
          _count: {
            select: {
              users: true,
              clients: true,
              accounts: true,
              loans: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: tenants,
      meta: {
        page: Number(page),
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /admin/tenants/:id
 * Busca tenant por ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        address: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            clients: true,
            accounts: true,
            loans: true,
            subscriptionInvoices: true,
            tickets: true
          }
        }
      }
    });

    if (!tenant) {
      throw createHttpError(404, 'Tenant não encontrado');
    }

    res.json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /admin/tenants
 * Cria novo tenant com trial de 15 dias
 */
router.post('/', async (req, res, next) => {
  try {
    const payload = createTenantSchema.parse(req.body);

    // Verificar se email do tenant já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { email: payload.email }
    });

    if (existingTenant) {
      throw createHttpError(400, 'Email do tenant já cadastrado');
    }

    // Verificar se email do admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: payload.adminEmail }
    });

    if (existingAdmin) {
      throw createHttpError(400, 'Email do administrador já cadastrado');
    }

    // Criar tenant em transação
    const tenant = await prisma.$transaction(async (tx) => {
      // Criar endereço se fornecido
      let addressId = null;
      if (payload.address) {
        const address = await tx.address.create({
          data: {
            label: 'primary',
            postalCode: payload.address.postalCode,
            street: payload.address.street,
            number: payload.address.number,
            district: payload.address.district,
            city: payload.address.city,
            state: payload.address.state.toUpperCase(),
            complement: payload.address.complement || null
          }
        });
        addressId = address.id;
      }

      // Calcular datas do trial
      const trialStartAt = new Date();
      const trialEndAt = new Date();
      trialEndAt.setDate(trialEndAt.getDate() + 15); // 15 dias de trial

      // Criar tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: payload.name,
          email: payload.email,
          cpfCnpj: payload.cpfCnpj || null,
          phone: payload.phone || null,
          addressId,
          plan: payload.plan,
          status: 'active',
          trialStartAt,
          trialEndAt
        }
      });

      // Criar usuário admin do tenant
      const adminPasswordHash = await hashPassword(payload.adminPassword);
      await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: payload.adminEmail,
          name: `${payload.adminFirstName} ${payload.adminLastName}`.trim(),
          firstName: payload.adminFirstName,
          lastName: payload.adminLastName,
          role: 'admin',
          passwordHash: adminPasswordHash
        }
      });

      // Criar evento de trial iniciado
      await tx.subscriptionEvent.create({
        data: {
          tenantId: newTenant.id,
          type: 'trial_started',
          data: {
            plan: payload.plan,
            trialEndAt: trialEndAt.toISOString()
          }
        }
      });

      return newTenant;
    });

    // Buscar tenant completo para retornar
    const fullTenant = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        address: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({ success: true, data: fullTenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos', { details: error.flatten() }));
    }
    next(error);
  }
});

/**
 * PATCH /admin/tenants/:id
 * Atualiza tenant
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const payload = updateTenantSchema.parse(req.body);

    const existing = await prisma.tenant.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      throw createHttpError(404, 'Tenant não encontrado');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Atualizar endereço se fornecido
      if (payload.address) {
        if (existing.addressId) {
          await tx.address.update({
            where: { id: existing.addressId },
            data: {
              postalCode: payload.address.postalCode,
              street: payload.address.street,
              number: payload.address.number,
              district: payload.address.district,
              city: payload.address.city,
              state: payload.address.state.toUpperCase(),
              complement: payload.address.complement || null
            }
          });
        } else {
          const address = await tx.address.create({
            data: {
              label: 'primary',
              postalCode: payload.address.postalCode,
              street: payload.address.street,
              number: payload.address.number,
              district: payload.address.district,
              city: payload.address.city,
              state: payload.address.state.toUpperCase(),
              complement: payload.address.complement || null
            }
          });
          payload.address = undefined; // Remove do payload
          return tx.tenant.update({
            where: { id: req.params.id },
            data: {
              ...payload,
              addressId: address.id,
              nextDueAt: payload.nextDueAt ? new Date(payload.nextDueAt) : undefined
            } as any,
            include: { address: true }
          });
        }
      }

      return tx.tenant.update({
        where: { id: req.params.id },
        data: {
          ...payload,
          address: undefined,
          nextDueAt: payload.nextDueAt ? new Date(payload.nextDueAt) : undefined
        } as any,
        include: { address: true }
      });
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos', { details: error.flatten() }));
    }
    next(error);
  }
});

/**
 * DELETE /admin/tenants/:id
 * Cancela tenant (soft delete - muda status para canceled)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id }
    });

    if (!tenant) {
      throw createHttpError(404, 'Tenant não encontrado');
    }

    await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'canceled' }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
