import { randomUUID } from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { ENV } from '../config/env.js';

const isProd = ENV.NODE_ENV === 'production';

const logger = pino({
  level: ENV.LOG_LEVEL,
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
});

export const httpLogger = pinoHttp({
  logger: logger.child({ module: 'http' }),
  autoLogging: {
    ignorePaths: ['/health'],
  },
  wrapSerializers: true,
  genReqId: () => randomUUID(),
});

export { logger };
