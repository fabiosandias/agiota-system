import { Router } from 'express';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import { authService } from '../../services/auth.service.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

/**
 * POST /admin/auth/login
 * Login exclusivo para Super Admin
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await authService.loginSuperAdmin(payload.email, payload.password);

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

/**
 * POST /admin/auth/logout
 * Logout do Super Admin
 */
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

/**
 * GET /admin/auth/me
 * Retorna dados do Super Admin logado
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.sub);

    // Verificar se é super admin
    if (user.role !== 'super_admin') {
      throw createHttpError(403, 'Acesso negado. Apenas Super Admin.');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
