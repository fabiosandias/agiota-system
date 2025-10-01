import type { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

export interface ApiError extends createHttpError.HttpError {
  details?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const status = error.status ?? 500;
  const message = error.message ?? 'Internal server error';
  const payload: Record<string, unknown> = {
    success: false,
    message
  };

  if (process.env.NODE_ENV !== 'production' && error.details) {
    payload.details = error.details;
  }

  res.status(status).json(payload);
};
