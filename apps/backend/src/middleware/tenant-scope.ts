import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { prisma } from '../config/prisma.js';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      isSuperAdmin?: boolean;
    }
  }
}

/**
 * Middleware para adicionar tenant scope às requisições
 * - Super Admin pode acessar todos os tenants
 * - Usuários normais só acessam dados do próprio tenant
 */
export const tenantScope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Se não há usuário autenticado, pula (será tratado por requireAuth)
    if (!req.user?.sub) {
      return next();
    }

    // Buscar usuário com tenant
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        tenantId: true,
        role: true
      }
    });

    if (!user) {
      throw createHttpError(401, 'Usuário não encontrado');
    }

    // Super Admin pode acessar todos os tenants
    if (user.role === 'super_admin') {
      req.isSuperAdmin = true;
      // Super Admin pode especificar tenant_id via query ou body
      const tenantIdFromRequest = req.query.tenant_id || req.body.tenant_id;
      if (tenantIdFromRequest && typeof tenantIdFromRequest === 'string') {
        req.tenantId = tenantIdFromRequest;
      }
      return next();
    }

    // Usuários normais devem ter tenant_id
    if (!user.tenantId) {
      throw createHttpError(403, 'Usuário não está associado a nenhum tenant');
    }

    // Verificar status do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        status: true,
        plan: true,
        trialEndAt: true
      }
    });

    if (!tenant) {
      throw createHttpError(403, 'Tenant não encontrado');
    }

    // Adicionar tenant_id ao request
    req.tenantId = user.tenantId;

    // Verificar se tenant está suspenso (não bloqueia login, apenas funcionalidades)
    if (tenant.status === 'suspended') {
      // Permitir acesso apenas a rotas de assinatura e suporte
      const allowedPaths = ['/auth/me', '/tenant/subscription', '/support/tickets'];
      const isAllowedPath = allowedPaths.some(path => req.path.includes(path));

      if (!isAllowedPath) {
        throw createHttpError(403, {
          message: 'Conta suspensa. Regularize seu pagamento para continuar.',
          code: 'ACCOUNT_SUSPENDED'
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper para criar Prisma Client com tenant scope automático
 * Usa Prisma Middleware para filtrar automaticamente por tenant_id
 */
export const createTenantScopedPrisma = (tenantId: string | undefined) => {
  if (!tenantId) {
    return prisma;
  }

  // TODO: Implementar Prisma Middleware para filtrar automaticamente
  // Por enquanto, retorna o prisma normal e filtramos manualmente nas queries
  return prisma;
};
