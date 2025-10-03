import { Prisma } from '@prisma/client';
import { Router } from 'express';
import createHttpError from 'http-errors';
import { prisma } from '../../../config/prisma.js';
import { authorize } from '../../../middleware/authorize.js';
import { parsePagination, buildPaginationMeta } from '../../../utils/pagination.js';
import { createClientSchema, updateClientSchema, clientQuerySchema } from './clients.schema.js';

const router = Router();

const normalizeDocument = (value: string) => value.replace(/\D/g, '');
const normalizePostalCode = (value: string) => value.replace(/\D/g, '').padStart(8, '0');

router.get('/', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const { search, name, district, city } = clientQuerySchema.parse(req.query);
    const { page, pageSize } = parsePagination(req.query);

    const conditions: Prisma.ClientWhereInput[] = [];

    if (search) {
      const sanitized = search.trim();
      conditions.push({
        OR: [
          { firstName: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { lastName: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { name: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { document: { contains: sanitized.replace(/\D/g, '') } }
        ]
      });
    }

    if (name) {
      conditions.push({ name: { contains: name, mode: Prisma.QueryMode.insensitive } });
    }

    if (city) {
      conditions.push({
        addresses: {
          some: {
            city: { contains: city, mode: Prisma.QueryMode.insensitive }
          }
        }
      });
    }

    if (district) {
      conditions.push({
        addresses: {
          some: {
            district: { contains: district, mode: Prisma.QueryMode.insensitive }
          }
        }
      });
    }

    const where: Prisma.ClientWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [total, clients] = await prisma.$transaction([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        include: { addresses: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({ success: true, data: clients, meta: buildPaginationMeta(total, page, pageSize) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = createClientSchema.parse(req.body);
    const document = normalizeDocument(payload.document);

    const client = await prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          name: `${payload.firstName} ${payload.lastName}`.trim(),
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          birthDate: payload.birthDate,
          document,
          documentType: payload.documentType,
          addresses: {
            create: payload.addresses.map((address) => ({
              label: address.label,
              postalCode: normalizePostalCode(address.postalCode),
              street: address.street,
              number: address.number,
              district: address.district,
              city: address.city,
              state: address.state.toUpperCase(),
              complement: address.complement ?? null
            }))
          }
        },
        include: { addresses: true }
      });

      return created;
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return next(createHttpError(409, 'Document already registered for another client'));
    }
    next(error);
  }
});

router.get('/:id', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { addresses: true }
    });

    if (!client) {
      throw createHttpError(404, 'Cliente não encontrado');
    }

    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = updateClientSchema.parse(req.body);

    const document = payload.document ? normalizeDocument(payload.document) : undefined;

    const updatedClient = await prisma.$transaction(async (tx) => {
      const existing = await tx.client.findUnique({ where: { id: req.params.id }, include: { addresses: true } });

      if (!existing) {
        throw createHttpError(404, 'Cliente não encontrado');
      }

      const client = await tx.client.update({
        where: { id: req.params.id },
        data: {
          name:
            payload.firstName || payload.lastName
              ? `${payload.firstName ?? existing.firstName ?? ''} ${payload.lastName ?? existing.lastName ?? ''}`.trim()
              : undefined,
          firstName: payload.firstName ?? undefined,
          lastName: payload.lastName ?? undefined,
          email: payload.email ?? undefined,
          phone: payload.phone ?? undefined,
          birthDate: payload.birthDate ?? undefined,
          document,
          documentType: payload.documentType ?? undefined
        }
      });

      if (payload.addresses) {
        const incomingIds = payload.addresses.filter((addr) => addr.id).map((addr) => addr.id!);
        const addressesToDelete = existing.addresses.filter((addr) => !incomingIds.includes(addr.id));

        if (addressesToDelete.length > 0) {
          await tx.address.deleteMany({ where: { id: { in: addressesToDelete.map((addr) => addr.id) } } });
        }

        await Promise.all(
          payload.addresses.map((address) => {
            const baseData = {
              label: address.label,
              postalCode: normalizePostalCode(address.postalCode),
              street: address.street,
              number: address.number,
              district: address.district,
              city: address.city,
              state: address.state.toUpperCase(),
              complement: address.complement ?? null
            };

            if (address.id) {
              return tx.address.update({
                where: { id: address.id },
                data: { ...baseData, userId: null, clientId: client.id }
              });
            }

            return tx.address.create({ data: { ...baseData, clientId: client.id } });
          })
        );
      }

      return tx.client.findUniqueOrThrow({
        where: { id: client.id },
        include: { addresses: true }
      });
    });

    res.json({ success: true, data: updatedClient });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return next(createHttpError(409, 'Document already registered for another client'));
    }
    next(error);
  }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const activeLoans = await prisma.loan.count({ where: { clientId: req.params.id } });
    if (activeLoans > 0) {
      throw createHttpError(409, 'Não é possível excluir clientes vinculados a empréstimos');
    }

    await prisma.$transaction([
      prisma.address.deleteMany({ where: { clientId: req.params.id } }),
      prisma.client.delete({ where: { id: req.params.id } })
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
