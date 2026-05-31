import express from 'express';
import authMiddleware from '../../middleware/auth.js';

import {
  getAll,
  getByProduct,
  create,
  update,
  remove,
} from './productPackaging.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getAll);

router.get('/product/:productId', authMiddleware, getByProduct);

router.post('/', authMiddleware, create);

router.put('/:id', authMiddleware, update);

router.delete('/:id', authMiddleware, remove);

export default router;
