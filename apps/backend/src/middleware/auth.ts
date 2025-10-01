import createHttpError from 'http-errors';
import type { RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const tokenFromHeader = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const tokenFromCookie = req.cookies?.token as string | undefined;
  const token = tokenFromHeader ?? tokenFromCookie;

  if (!token) {
    return next(createHttpError(401, 'Autenticação necessária'));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return next(createHttpError(401, 'Token inválido ou expirado'));
  }
};
