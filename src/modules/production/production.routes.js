import express from 'express';

import authMiddleware from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createProduction,
  getProductions,
  getProductionById,
} from './production.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getProductions);

router.get('/:id', authMiddleware, getProductionById);

router.post(
  '/',
  authMiddleware,
  authorize('SUPER_OWNER', 'OWNER_PABRIK'),
  createProduction,
);

export default router;
