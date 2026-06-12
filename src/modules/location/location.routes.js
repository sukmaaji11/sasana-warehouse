import express from 'express';

import authMiddleware from '../../middleware/auth.js';

import { getLocations, getLocationById } from './location.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getLocations);

router.get('/:id', authMiddleware, getLocationById);

export default router;
