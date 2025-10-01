import { Router } from 'express';
import { z } from 'zod';
import createHttpError from 'http-errors';
import { userService } from '../services/user.service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional()
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Nova senha deve ser diferente da senha atual',
    path: ['newPassword']
  });

router.use(requireAuth);

router.put('/me', async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(req.user!.sub, payload);
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos', { details: error.flatten() }));
    }

    next(error);
  }
});

router.put('/me/password', async (req, res, next) => {
  try {
    const payload = updatePasswordSchema.parse(req.body);
    await userService.changePassword(req.user!.sub, payload.currentPassword, payload.newPassword);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(createHttpError(400, 'Dados inválidos', { details: error.flatten() }));
    }

    next(error);
  }
});

export default router;
