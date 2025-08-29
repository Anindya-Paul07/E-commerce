import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './lib/ratelimit.js';
import { ENV } from './config/env.js';
import { initPassport } from './passport/index.js';
import { notFound, errorHandler } from './middlewares/error.js';

import authRoutes from './router/auth.route.js';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({ origin: ENV.CLIENT_ORIGIN, credentials: true }));
app.use('/api', apiLimiter);

const passport = initPassport();
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
