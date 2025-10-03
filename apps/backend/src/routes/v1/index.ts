import { Router } from 'express';
import accountsRoutes from '../../modules/v1/accounts/accounts.routes.js';
import addressesRoutes from '../../modules/v1/addresses/addresses.routes.js';
import clientsRoutes from '../../modules/v1/clients/clients.routes.js';
import loansRoutes from '../../modules/v1/loans/loans.routes.js';
import usersRoutes from '../../modules/v1/users/users.routes.js';
import postalCodesRoutes from './postal-codes.routes.js';

const router = Router();

router.use('/clients', clientsRoutes);
router.use('/', addressesRoutes);
router.use('/users', usersRoutes);
router.use('/accounts', accountsRoutes);
router.use('/loans', loansRoutes);
router.use('/', postalCodesRoutes);

export { router as v1Router };
