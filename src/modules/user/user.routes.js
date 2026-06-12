import express from 'express';

import authMiddleware from '../../middleware/auth.js';

import { getUsers, getUserById } from './user.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getUsers);

router.get('/:id', authMiddleware, getUserById);

export default router;
