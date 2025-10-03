import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { prisma } from '../../../config/prisma.js';
import { authorize } from '../../../middleware/authorize.js';
import { parsePagination, buildPaginationMeta } from '../../../utils/pagination.js';
import { hashPassword } from '../../../utils/password.js';
import { userInputSchema, updateUserSchema, userQuerySchema } from './users.schema.js';

const router = Router();

const normalizePostalCode = (value: string) => value.replace(/\D/g, '').padStart(8, '0');

router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const filters = userQuerySchema.parse(req.query);
    const { page, pageSize } = parsePagination(req.query);

    let where: Prisma.UserWhereInput | undefined;

    if (filters.search) {
      const sanitized = filters.search.trim();
      where = {
        OR: [
          { firstName: { contains: sanitized, mode: 'insensitive' as const } },
          { lastName: { contains: sanitized, mode: 'insensitive' as const } },
          { email: { contains: sanitized, mode: 'insensitive' as const } },
          { phone: { contains: sanitized, mode: 'insensitive' as const } }
        ]
      };
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { address: true }
      })
    ]);

    res.json({ success: true, data: users, meta: buildPaginationMeta(total, page, pageSize) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const payload = userInputSchema.extend({ password: z.string().min(8) }).parse(req.body);

    const hashed = await hashPassword(payload.password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: payload.email,
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          role: payload.role,
          passwordHash: hashed
        }
      });

      await tx.address.upsert({
        where: { userId: createdUser.id },
        update: {
          postalCode: normalizePostalCode(payload.address.postalCode),
          street: payload.address.street,
          number: payload.address.number,
          district: payload.address.district,
          city: payload.address.city,
          state: payload.address.state.toUpperCase(),
          complement: payload.address.complement ?? null
        },
        create: {
          label: 'primary',
          postalCode: normalizePostalCode(payload.address.postalCode),
          street: payload.address.street,
          number: payload.address.number,
          district: payload.address.district,
          city: payload.address.city,
          state: payload.address.state.toUpperCase(),
          complement: payload.address.complement ?? null,
          userId: createdUser.id
        }
      });

      return tx.user.findUniqueOrThrow({
        where: { id: createdUser.id },
        include: { address: true }
      });
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Profile routes - MUST come before /:id routes to avoid conflicts
router.put('/profile', async (req, res, next) => {
  try {
    if (!req.user?.sub) {
      throw createHttpError(401, 'Usuário não autenticado');
    }

    const payload = updateUserSchema.extend({ password: z.string().min(8).optional() }).parse(req.body);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id: req.user!.sub }, include: { address: true } });
      if (!existing) {
        throw createHttpError(404, 'Usuário não encontrado');
      }

      const data: Record<string, unknown> = {
        email: payload.email ?? undefined,
        firstName: payload.firstName ?? undefined,
        lastName: payload.lastName ?? undefined,
        phone: payload.phone ?? undefined
      };

      // Só incluir avatar se foi fornecido (pode ser string base64 ou null para remover)
      if (payload.avatar !== undefined) {
        data.avatar = payload.avatar;
      }

      if (payload.password) {
        data.passwordHash = await hashPassword(payload.password);
      }

      data.name =
        `${payload.firstName ?? existing.firstName ?? ''} ${payload.lastName ?? existing.lastName ?? ''}`.trim();

      const user = await tx.user.update({
        where: { id: req.user!.sub },
        data
      });

      if (payload.address) {
        await tx.address.upsert({
          where: { userId: user.id },
          update: {
            postalCode: normalizePostalCode(payload.address.postalCode),
            street: payload.address.street,
            number: payload.address.number,
            district: payload.address.district,
            city: payload.address.city,
            state: payload.address.state.toUpperCase(),
            complement: payload.address.complement ?? null
          },
          create: {
            label: 'primary',
            postalCode: normalizePostalCode(payload.address.postalCode),
            street: payload.address.street,
            number: payload.address.number,
            district: payload.address.district,
            city: payload.address.city,
            state: payload.address.state.toUpperCase(),
            complement: payload.address.complement ?? null,
            userId: user.id
          }
        });
      }

      return tx.user.findUniqueOrThrow({ where: { id: user.id }, include: { address: true } });
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { address: true }
    });

    if (!user) {
      throw createHttpError(404, 'Usuário não encontrado');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const payload = updateUserSchema.extend({ password: z.string().min(8).optional() }).parse(req.body);

    const updatedUser = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id: req.params.id }, include: { address: true } });
      if (!existing) {
        throw createHttpError(404, 'Usuário não encontrado');
      }

      const data: Record<string, unknown> = {
        email: payload.email ?? undefined,
        firstName: payload.firstName ?? undefined,
        lastName: payload.lastName ?? undefined,
        phone: payload.phone ?? undefined,
        role: payload.role ?? undefined
      };

      if (payload.password) {
        data.passwordHash = await hashPassword(payload.password);
      }

      data.name =
        `${payload.firstName ?? existing.firstName ?? ''} ${payload.lastName ?? existing.lastName ?? ''}`.trim();

      const user = await tx.user.update({
        where: { id: req.params.id },
        data
      });

      if (payload.address) {
        await tx.address.upsert({
          where: { userId: user.id },
          update: {
            postalCode: normalizePostalCode(payload.address.postalCode),
            street: payload.address.street,
            number: payload.address.number,
            district: payload.address.district,
            city: payload.address.city,
            state: payload.address.state.toUpperCase(),
            complement: payload.address.complement ?? null
          },
          create: {
            label: 'primary',
            postalCode: normalizePostalCode(payload.address.postalCode),
            street: payload.address.street,
            number: payload.address.number,
            district: payload.address.district,
            city: payload.address.city,
            state: payload.address.state.toUpperCase(),
            complement: payload.address.complement ?? null,
            userId: user.id
          }
        });
      }

      return tx.user.findUniqueOrThrow({ where: { id: user.id }, include: { address: true } });
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    if (req.user?.sub === req.params.id) {
      throw createHttpError(409, 'Não é possível apagar o usuário autenticado');
    }

    await prisma.$transaction([
      prisma.address.deleteMany({ where: { userId: req.params.id } }),
      prisma.account.deleteMany({ where: { userId: req.params.id } }),
      prisma.user.delete({ where: { id: req.params.id } })
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
