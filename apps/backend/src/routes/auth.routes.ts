import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rate-limit.js';
import { authService } from '../services/auth.service.js';

const router = Router();

const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 15; // 15 minutos
const computeRefreshMaxAge = (expiresAt: Date) => Math.max(expiresAt.getTime() - Date.now(), 0);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6)
});

router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload.email, payload.password);

    res.status(200).json({
      success: true,
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Invalid credentials payload', { details: error.flatten() }));
    }

    return next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    await authService.logout(req.user!.sub, refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.sub);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw createHttpError(401, 'Refresh token ausente');
    }

    const result = await authService.refreshSession(refreshToken);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: '/'
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: computeRefreshMaxAge(result.refreshTokenExpiresAt),
      path: '/'
    });

    res.json({ success: true, user: result.user });
  } catch (error) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    next(error);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const payload = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(payload.email);
    res.status(202).json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'E-mail inválido', { details: error.flatten() }));
    }

    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(payload.token, payload.password);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos', { details: error.flatten() }));
    }

    next(error);
  }
});

export default router;
