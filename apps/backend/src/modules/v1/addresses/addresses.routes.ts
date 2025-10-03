import { Router } from 'express';
import createHttpError from 'http-errors';
import { prisma } from '../../../config/prisma.js';
import { authorize } from '../../../middleware/authorize.js';
import { addressInputSchema } from '../clients/clients.schema.js';

const router = Router();

const normalizePostalCode = (value: string) => value.replace(/\D/g, '').padStart(8, '0');

router.get('/clients/:clientId/addresses', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: addresses });
  } catch (error) {
    next(error);
  }
});

router.post('/clients/:clientId/addresses', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = addressInputSchema.parse(req.body);

    const address = await prisma.address.create({
      data: {
        label: payload.label,
        clientId: req.params.clientId,
        postalCode: normalizePostalCode(payload.postalCode),
        street: payload.street,
        number: payload.number,
        district: payload.district,
        city: payload.city,
        state: payload.state.toUpperCase(),
        complement: payload.complement ?? null
      }
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
});

router.put('/addresses/:id', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = addressInputSchema.partial().parse(req.body);

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        ...(payload.label ? { label: payload.label } : {}),
        ...(payload.postalCode ? { postalCode: normalizePostalCode(payload.postalCode) } : {}),
        ...(payload.street ? { street: payload.street } : {}),
        ...(payload.number ? { number: payload.number } : {}),
        ...(payload.district ? { district: payload.district } : {}),
        ...(payload.city ? { city: payload.city } : {}),
        ...(payload.state ? { state: payload.state.toUpperCase() } : {}),
        complement: payload.complement ?? undefined
      }
    });

    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
});

router.delete('/addresses/:id', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/users/:userId/address', authorize('admin', 'operator', 'viewer'), async (req, res, next) => {
  try {
    const address = await prisma.address.findUnique({ where: { userId: req.params.userId } });
    if (!address) {
      throw createHttpError(404, 'Endereço não encontrado');
    }
    res.json({ success: true, data: address });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:userId/address', authorize('admin', 'operator'), async (req, res, next) => {
  try {
    const payload = addressInputSchema.parse({ ...req.body, label: 'primary' });

    const updated = await prisma.address.upsert({
      where: { userId: req.params.userId },
      update: {
        postalCode: normalizePostalCode(payload.postalCode),
        street: payload.street,
        number: payload.number,
        district: payload.district,
        city: payload.city,
        state: payload.state.toUpperCase(),
        complement: payload.complement ?? null
      },
      create: {
        label: 'primary',
        postalCode: normalizePostalCode(payload.postalCode),
        street: payload.street,
        number: payload.number,
        district: payload.district,
        city: payload.city,
        state: payload.state.toUpperCase(),
        complement: payload.complement ?? null,
        userId: req.params.userId
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
