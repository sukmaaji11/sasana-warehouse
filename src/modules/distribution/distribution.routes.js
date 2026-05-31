import express from 'express';

import authMiddleware from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import {
  createDistribution,
  getDistributions,
  getDistributionById,
} from './distribution.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getDistributions);

router.get('/:id', authMiddleware, getDistributionById);

router.post(
  '/',
  authMiddleware,
  authorize('SUPER_OWNER', 'OWNER_PABRIK'),
  createDistribution,
);

export default router;
