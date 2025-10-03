import type { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import { verifyToken } from '../utils/jwt.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(createHttpError(401, 'Autenticação necessária'));
  }

  const token = header.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return next(createHttpError(401, 'Token inválido ou expirado'));
  }
};
