import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';

const router = Router();

const DEFAULT_ACCOUNT_ID = '11111111-1111-1111-1111-111111111111';

const loanSchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  accountId: z.string().uuid('Conta inválida').optional(),
  principalAmount: z.coerce.number().positive(),
  interestRate: z.coerce.number().positive(),
  dueDate: z.coerce.date(),
  notes: z.string().optional()
});

router.get('/', async (_req, res) => {
  const loans = await prisma.loan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      account: true,
      payments: true,
      installments: true
    }
  });

  res.json({ success: true, data: loans });
});

router.post('/', async (req, res, next) => {
  try {
    const payload = loanSchema.parse(req.body);

    const accountId = payload.accountId ?? DEFAULT_ACCOUNT_ID;

    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account) {
      throw createHttpError(404, 'Conta de origem dos recursos não encontrada.');
    }

    const loan = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdLoan = await tx.loan.create({
        data: {
          clientId: payload.clientId,
          accountId,
          principalAmount: payload.principalAmount,
          interestRate: payload.interestRate,
          dueDate: payload.dueDate,
          notes: payload.notes
        },
        include: {
          client: true,
          account: true
        }
      });

      await tx.accountTransaction.create({
        data: {
          accountId,
          loanId: createdLoan.id,
          direction: 'debit',
          amount: payload.principalAmount,
          description: 'Liberação de empréstimo'
        }
      });

      await tx.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            decrement: payload.principalAmount
          }
        }
      });

      return createdLoan;
    });

    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos para empréstimo', { details: error.flatten() }));
    }

    return next(error);
  }
});

const statusSchema = z.object({
  status: z.enum(['active', 'due_soon', 'overdue', 'paid', 'renegotiated', 'written_off'])
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = statusSchema.parse(req.body);

    const loan = await prisma.loan.update({
      where: { id },
      data: { status: payload.status }
    });

    res.json({ success: true, data: loan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Status inválido', { details: error.flatten() }));
    }

    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.loan.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
