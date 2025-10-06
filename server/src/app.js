import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './lib/ratelimit.js';
import { ENV } from './config/env.js';
import { initPassport } from './passport/index.js';
import { notFound, errorHandler } from './middlewares/error.js';
import { httpLogger } from './lib/logger.js';
import { uploadDir } from './lib/upload.js';

import authRoutes from './router/auth.route.js';
import productRoutes from './router/product.route.js';
import categoryroutes from './router/category.route.js';
import cartRoutes from './router/cart.route.js';
import orderRoutes from './router/order.route.js';
import searchRoutes from './router/search.route.js';
import statsRoutes from './router/stats.route.js';
import warehouseRoutes from './router/warehouse.route.js';
import inventoryRoutes from './router/inventory.route.js';
import brandRoutes from './router/brand.route.js';
import sellerRoutes from './router/seller.route.js';
import adminSellerRoutes from './router/admin-seller.route.js';
import subscriptionPlanRoutes from './router/subscription-plan.route.js';
import adminSubscriptionRoutes from './router/admin-subscription.route.js';
import adminFulfillmentRoutes from './router/admin-fulfillment.route.js';
import catalogProductRoutes from './router/catalog-product.route.js';

const app = express();

app.use(helmet());
app.use(httpLogger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({ origin: ENV.CLIENT_ORIGIN, credentials: true }));
app.use('/api', apiLimiter);
app.use('/uploads', express.static(uploadDir));

const passport = initPassport();
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryroutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin/sellers', adminSellerRoutes);
app.use('/api/catalog-products', catalogProductRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionRoutes);
app.use('/api/admin/fulfillment-tasks', adminFulfillmentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
