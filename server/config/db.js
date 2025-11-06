import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../lib/logger.js';

const MAX_RETRIES = 5;

export async function connectDB() {
  mongoose.set('strictQuery', true);

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(ENV.MONGO_URI, { dbName: 'ecom' });
      logger.info({ host: mongoose.connection.host }, 'MongoDB connected');

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return;
    } catch (error) {
      attempt += 1;
      logger.error({ attempt, error }, 'MongoDB connection failed');
      if (attempt >= MAX_RETRIES) throw error;
      const backoff = Math.min(attempt * 2000, 10000);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}
