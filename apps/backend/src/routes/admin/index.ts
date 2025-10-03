import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import adminAuthRoutes from './auth.routes.js';
import tenantsRoutes from './tenants.routes.js';

const adminRouter = Router();

// Rotas públicas de admin
adminRouter.use('/auth', adminAuthRoutes);

// Rotas protegidas de admin (requerem autenticação)
adminRouter.use(requireAuth);
adminRouter.use('/tenants', tenantsRoutes);

export { adminRouter };
