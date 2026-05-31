import express from 'express';

import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from './item.controller.js';

import authMiddleware from '../../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getItems);

router.get('/:id', authMiddleware, getItemById);

router.post('/', authMiddleware, createItem);

router.put('/:id', authMiddleware, updateItem);

router.delete('/:id', authMiddleware, deleteItem);

export default router;
