import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const router = Router();

const depositSchema = z.object({
  amount: z.coerce.number().positive('Valor do depósito deve ser maior que zero'),
  description: z.string().optional()
});

router.get('/', async (_req, res) => {
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: 'asc' }
  });

  res.json({ success: true, data: accounts });
});

router.post('/:accountId/deposit', async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const payload = depositSchema.parse(req.body);

    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account) {
      throw createHttpError(404, 'Conta de origem não encontrada.');
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: payload.amount
          }
        }
      });

      const transaction = await tx.accountTransaction.create({
        data: {
          accountId,
          direction: 'credit',
          amount: payload.amount,
          description: payload.description ?? 'Depósito manual'
        }
      });

      return { updatedAccount, transaction };
    });

    res.status(201).json({
      success: true,
      account: result.updatedAccount,
      transaction: result.transaction
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos para depósito', { details: error.flatten() }));
    }

    return next(error);
  }
});

export default router;
