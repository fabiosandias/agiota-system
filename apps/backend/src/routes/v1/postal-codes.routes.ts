import { Router } from 'express';
import createHttpError from 'http-errors';
import { authorize } from '../../middleware/authorize.js';
import { viaCepService } from '../../services/viacep.service.js';

const router = Router();

router.get('/postal-codes/:postalCode', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const address = await viaCepService.lookup(req.params.postalCode);
    res.json({ success: true, data: address });
  } catch (error) {
    if (error instanceof Error) {
      return next(createHttpError(400, error.message));
    }
    next(error);
  }
});

export default router;
