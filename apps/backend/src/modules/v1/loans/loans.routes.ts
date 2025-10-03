import { Prisma, type LoanStatus } from '@prisma/client';
import { Router } from 'express';
import createHttpError from 'http-errors';
import { authorize } from '../../../middleware/authorize.js';
import { prisma } from '../../../config/prisma.js';
import { buildPaginationMeta, parsePagination } from '../../../utils/pagination.js';
import { loanInputSchema, loanQuerySchema, updateLoanSchema } from './loans.schema.js';

const router = Router();

// Listar empréstimos
router.get('/', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const filters = loanQuerySchema.parse(req.query);
    const { page, pageSize } = parsePagination(req.query);

    if (!req.tenantId) {
      throw createHttpError(403, 'Tenant ID não encontrado');
    }

    const conditions: Prisma.LoanWhereInput[] = [
      { tenantId: req.tenantId }
    ];

    if (filters.status) {
      conditions.push({ status: filters.status as LoanStatus });
    }

    if (filters.clientId) {
      conditions.push({ clientId: filters.clientId });
    }

    if (filters.search) {
      const sanitized = filters.search.trim();
      conditions.push({
        OR: [
          { client: { name: { contains: sanitized, mode: Prisma.QueryMode.insensitive } } },
          { client: { document: { contains: sanitized, mode: Prisma.QueryMode.insensitive } } },
          { notes: { contains: sanitized, mode: Prisma.QueryMode.insensitive } }
        ]
      });
    }

    const where = conditions.length === 1 ? conditions[0] : { AND: conditions };

    const [total, loans] = await prisma.$transaction([
      prisma.loan.count({ where }),
      prisma.loan.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              document: true,
              phone: true,
              email: true
            }
          },
          account: {
            select: {
              id: true,
              name: true
            }
          },
          installments: {
            select: {
              id: true,
              sequence: true,
              dueDate: true,
              totalDue: true,
              paidAmount: true,
              status: true
            },
            orderBy: { sequence: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({ success: true, data: loans, meta: buildPaginationMeta(total, page, pageSize) });
  } catch (error) {
    next(error);
  }
});

// Buscar empréstimo por ID
router.get('/:id', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            document: true,
            phone: true,
            email: true
          }
        },
        account: {
          select: {
            id: true,
            name: true,
            currentBalance: true
          }
        },
        installments: {
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!loan) {
      throw createHttpError(404, 'Empréstimo não encontrado');
    }

    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});

// Criar empréstimo
router.post('/', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = loanInputSchema.parse(req.body);

    if (!req.tenantId) {
      throw createHttpError(403, 'Tenant ID não encontrado');
    }

    const tenantId = req.tenantId;

    // Verificar se cliente existe
    const client = await prisma.client.findUnique({ where: { id: payload.clientId } });
    if (!client) {
      throw createHttpError(404, 'Cliente não encontrado');
    }

    // Verificar se conta existe e tem saldo
    const account = await prisma.account.findUnique({ where: { id: payload.accountId } });
    if (!account) {
      throw createHttpError(404, 'Conta não encontrada');
    }

    if (Number(account.currentBalance) < payload.principalAmount) {
      throw createHttpError(400, 'Saldo insuficiente na conta');
    }

    // Criar empréstimo e parcelas
    const numberOfInstallments = payload.installments || 1;
    const totalAmount = payload.principalAmount * (1 + payload.interestRate / 100);
    const installmentAmount = totalAmount / numberOfInstallments;

    const loan = await prisma.$transaction(async (tx) => {
      // Criar empréstimo
      const newLoan = await tx.loan.create({
        data: {
          tenantId,
          clientId: payload.clientId,
          accountId: payload.accountId,
          createdByUserId: req.user?.sub ?? null,
          principalAmount: payload.principalAmount,
          interestRate: payload.interestRate,
          dueDate: new Date(payload.dueDate),
          notes: payload.notes,
          status: 'active'
        }
      });

      // Criar parcelas
      const installments = [];
      const dueDate = new Date(payload.dueDate);

      for (let i = 1; i <= numberOfInstallments; i++) {
        const installmentDueDate = new Date(dueDate);
        installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));

        installments.push({
          loanId: newLoan.id,
          sequence: i,
          dueDate: installmentDueDate,
          principalDue: payload.principalAmount / numberOfInstallments,
          interestDue: (payload.principalAmount * payload.interestRate / 100) / numberOfInstallments,
          totalDue: installmentAmount,
          paidAmount: 0,
          status: 'pending' as const
        });
      }

      await tx.loanInstallment.createMany({ data: installments });

      // Debitar da conta
      await tx.account.update({
        where: { id: payload.accountId },
        data: {
          currentBalance: {
            decrement: payload.principalAmount
          }
        }
      });

      // Criar transação
      await tx.accountTransaction.create({
        data: {
          accountId: payload.accountId,
          loanId: newLoan.id,
          direction: 'debit',
          amount: payload.principalAmount,
          description: `Empréstimo concedido para ${client.name}`,
          occurredAt: new Date()
        }
      });

      return newLoan;
    });

    const loanWithDetails = await prisma.loan.findUnique({
      where: { id: loan.id },
      include: {
        client: true,
        account: true,
        installments: {
          orderBy: { sequence: 'asc' }
        }
      }
    });

    res.status(201).json({ success: true, data: loanWithDetails });
  } catch (error) {
    next(error);
  }
});

// Atualizar empréstimo
router.put('/:id', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = updateLoanSchema.parse(req.body);

    const loan = await prisma.loan.update({
      where: { id: req.params.id },
      data: payload as any,
      include: {
        client: true,
        installments: {
          orderBy: { sequence: 'asc' }
        }
      }
    });

    res.json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});

// Deletar empréstimo
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: req.params.id },
      include: {
        payments: true,
        installments: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!loan) {
      throw createHttpError(404, 'Empréstimo não encontrado');
    }

    // Verificar se há pagamentos
    const hasPayments = loan.payments.length > 0 || loan.installments.some((inst) => inst.payments.length > 0);
    if (hasPayments) {
      throw createHttpError(409, 'Não é possível remover empréstimo com pagamentos vinculados');
    }

    await prisma.loan.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
