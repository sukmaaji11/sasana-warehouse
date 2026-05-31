import express from 'express';

import authMiddleware from '../../middleware/auth.js';

import {
  getStocks,
  getStockByLocation,
  getStockByItem,
  getMovements,
  getMovementById,
} from './stock.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getStocks);

router.get('/location/:locationId', authMiddleware, getStockByLocation);

router.get('/item/:itemId', authMiddleware, getStockByItem);

router.get('/movements', authMiddleware, getMovements);

router.get('/movements/:id', authMiddleware, getMovementById);

export default router;
