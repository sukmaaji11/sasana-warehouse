import express from 'express';

import authMiddleware from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createShipment,
  getShipments,
  getShipmentById,
  assignDriver,
  pickupShipment,
  receiveShipment,
} from './shipment.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getShipments);
router.get('/:id', authMiddleware, getShipmentById);
router.post(
  '/',
  authMiddleware,
  authorize('SUPER_OWNER', 'ADMIN_GUDANG'),
  createShipment,
);
router.post(
  '/:id/assign-driver',
  authMiddleware,
  authorize('SUPER_OWNER', 'ADMIN_GUDANG'),
  assignDriver,
);
router.post(
  '/:id/pickup',
  authMiddleware,
  authorize('SUPER_OWNER', 'ADMIN_GUDANG', 'DRIVER'),
  pickupShipment,
);
router.post(
  '/:id/receive',
  authMiddleware,
  authorize('SUPER_OWNER', 'OWNER_PABRIK'),
  receiveShipment,
);

export default router;
