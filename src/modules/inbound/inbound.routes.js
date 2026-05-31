import express from 'express';

import authMiddleware from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

import { createInbound, getAll, getById } from './inbound.controller.js';

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  authorize('SUPER_OWNER', 'ADMIN_GUDANG'),
  createInbound,
);
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);

export default router;
