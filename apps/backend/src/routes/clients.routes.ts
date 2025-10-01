import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { z } from 'zod';
import createHttpError from 'http-errors';
import { onlyDigits } from '../utils/formatters.js';

const router = Router();

const clientSchema = z.object({
  name: z.string().min(3),
  cpf: z.string().min(11).max(14),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
});

router.get('/', async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: clients });
});

router.post('/', async (req, res, next) => {
  try {
    const payload = clientSchema.parse(req.body);

    const sanitizedCpf = onlyDigits(payload.cpf);
    const phone = payload.phone ? onlyDigits(payload.phone) : undefined;

    const client = await prisma.client.create({
      data: {
        name: payload.name,
        cpf: sanitizedCpf,
        phone,
        email: payload.email,
        address: payload.address
      }
    });

    res.status(201).json({ success: true, data: client });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos para cliente', { details: error.flatten() }));
    }

    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        loans: {
          orderBy: { createdAt: 'desc' },
          include: { payments: true }
        }
      }
    });

    if (!client) {
      throw createHttpError(404, 'Cliente não encontrado');
    }

    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = clientSchema.partial().parse(req.body);

    const sanitizedCpf = payload.cpf ? onlyDigits(payload.cpf) : undefined;
    const phone = payload.phone ? onlyDigits(payload.phone) : undefined;

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(payload.name ? { name: payload.name } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.address ? { address: payload.address } : {}),
        ...(sanitizedCpf ? { cpf: sanitizedCpf } : {}),
        ...(phone ? { phone } : {})
      }
    });

    res.json({ success: true, data: client });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos para cliente', { details: error.flatten() }));
    }

    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
