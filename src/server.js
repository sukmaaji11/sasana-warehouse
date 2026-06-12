import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from '../src/modules/auth/auth.routes.js';
import itemRoutes from '../src/modules/item/item.routes.js';
import productUnitRoutes from '../src/modules/product-unit/productUnit.routes.js';
import productPackagingRoutes from '../src/modules/product-packaging/productPackaging.routes.js';
import inboundRoutes from './modules/inbound/inbound.routes.js';
import stockRoutes from './modules/stock/stock.routes.js';
import shipmentRoutes from './modules/shipment/shipment.routes.js';
import productionRoutes from './modules/production/production.routes.js';
import distributionRoutes from './modules/distribution/distribution.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import locationRoutes from './modules/location/location.routes.js';
import userRoutes from './modules/user/user.routes.js';
//import prisma from '../src/config/prisma.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET tidak ditemukan di .env');
}
const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    app: 'SN Warehouse API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/product-units', productUnitRoutes);
app.use('/product-packagings', productPackagingRoutes);
app.use('/inbounds', inboundRoutes);
app.use('/stocks', stockRoutes);
app.use('/shipments', shipmentRoutes);
app.use('/productions', productionRoutes);
app.use('/distributions', distributionRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/locations', locationRoutes);
app.use('/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route tidak ditemukan',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
