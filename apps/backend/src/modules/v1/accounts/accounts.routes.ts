import { Prisma } from '@prisma/client';
import { Router } from 'express';
import createHttpError from 'http-errors';
import { prisma } from '../../../config/prisma.js';
import { authorize } from '../../../middleware/authorize.js';
import { parsePagination, buildPaginationMeta } from '../../../utils/pagination.js';
import { accountInputSchema, accountQuerySchema, updateAccountSchema } from './accounts.schema.js';

const router = Router();

router.get('/', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const filters = accountQuerySchema.parse(req.query);
    const { page, pageSize } = parsePagination(req.query);
    const userId = req.user!.sub;

    const conditions: Prisma.AccountWhereInput[] = [
      {
        OR: [{ userId }, { userId: null }]
      }
    ];

    if (filters.type) {
      conditions.push({ type: filters.type });
    }

    if (filters.search) {
      const sanitized = filters.search.trim();
      conditions.push({
        OR: [
          { name: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { bankName: { contains: sanitized, mode: Prisma.QueryMode.insensitive } },
          { accountNumber: { contains: sanitized, mode: Prisma.QueryMode.insensitive } }
        ]
      });
    }

    const where = conditions.length === 1 ? conditions[0] : { AND: conditions };

    const [total, accounts] = await prisma.$transaction([
      prisma.account.count({ where }),
      prisma.account.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({ success: true, data: accounts, meta: buildPaginationMeta(total, page, pageSize) });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = accountInputSchema.parse(req.body);

    const account = await prisma.account.create({
      data: {
        userId: req.user?.sub ?? null,
        name: payload.name,
        bankName: payload.bankName,
        branch: payload.branch,
        accountNumber: payload.accountNumber,
        type: payload.type,
        openingBalance: payload.openingBalance,
        currentBalance: payload.openingBalance
      }
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = updateAccountSchema.parse(req.body);

    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: {
        name: payload.name ?? undefined,
        bankName: payload.bankName ?? undefined,
        branch: payload.branch ?? undefined,
        accountNumber: payload.accountNumber ?? undefined,
        type: payload.type ?? undefined
      }
    });

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const hasTransactions = await prisma.accountTransaction.count({ where: { accountId: req.params.id } });
    if (hasTransactions > 0) {
      throw createHttpError(409, 'Não é possível remover contas com transações vinculadas');
    }

    await prisma.account.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/total-balance', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user?.sub ?? undefined }
    });

    const balance = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);

    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
});

export default router;
