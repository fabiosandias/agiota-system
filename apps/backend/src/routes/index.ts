import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import clientsRoutes from './clients.routes.js';
import loansRoutes from './loans.routes.js';
import accountsRoutes from './accounts.routes.js';
import { requireAuth } from '../middleware/auth.js';
import usersRoutes from './users.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use(requireAuth);
router.use('/clients', clientsRoutes);
router.use('/loans', loansRoutes);
router.use('/accounts', accountsRoutes);
router.use('/users', usersRoutes);

export { router };
