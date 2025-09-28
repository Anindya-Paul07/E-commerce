import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';
import { logger } from './lib/logger.js';
import { scheduleLowStockLogger } from './lib/low-stock.logger.js';
import { ensureDefaultWarehouse } from './lib/warehouse.utils.js';

async function bootstrap() {
  try {
    await connectDB();
    await ensureDefaultWarehouse();

    const server = app.listen(ENV.PORT, () => {
      logger.info({ port: ENV.PORT }, 'API listening');
    });

    scheduleLowStockLogger({ intervalMs: 10 * 60 * 1000, defaultThreshold: 5 });

    const shutdown = async (error) => {
      if (error) logger.error(error, 'Fatal error, shutting down');
      server.close(() => {
        logger.flush?.();
        process.exit(error ? 1 : 0);
      });
    };

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled rejection');
      shutdown(reason instanceof Error ? reason : undefined);
    });

    process.on('uncaughtException', (error) => {
      logger.error(error, 'Uncaught exception');
      shutdown(error);
    });

    process.on('SIGTERM', () => shutdown());
    process.on('SIGINT', () => shutdown());
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
