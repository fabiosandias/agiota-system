import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import accountsRoutes from './accounts.routes.js';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import loansRoutes from './loans.routes.js';
import usersRoutes from './users.routes.js';
import { v1Router } from './v1/index.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use(requireAuth);
// Rotas legadas mantidas para compatibilidade
router.use('/loans', loansRoutes);
router.use('/accounts', accountsRoutes);
router.use('/users', usersRoutes);
// Rotas versionadas (usar estas preferencialmente)
router.use('/v1', v1Router);

export { router };
