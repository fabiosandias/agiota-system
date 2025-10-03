import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';

type AllowedRoles = Array<'super_admin' | 'admin' | 'operator' | 'viewer'>;

export const authorize =
  (...allowedRoles: AllowedRoles): RequestHandler =>
  (req, _res, next) => {
    const role = req.user?.role;

    if (!role) {
      return next(createHttpError(401, 'Autenticação necessária'));
    }

    // Super admin tem acesso a tudo
    if (role === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(role)) {
      return next(createHttpError(403, 'Acesso negado para o perfil atual'));
    }

    return next();
  };
