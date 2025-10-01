import { Router } from 'express';
import { z } from 'zod';
import createHttpError from 'http-errors';
import { authService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

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

router.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload.email, payload.password);

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 12
    });

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Invalid credentials payload', { details: error.flatten() }));
    }

    return next(error);
  }
});

router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('token');
  res.status(204).send();
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.sub);
    res.json({ success: true, data: user });
  } catch (error) {
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
