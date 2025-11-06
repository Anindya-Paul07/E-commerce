import pino from 'pino';
import pinoHttp from 'pino-http';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'silent' : 'info');

export const logger = pino({
  level,
  transport:
    level === 'silent'
      ? undefined
      : process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { translateTime: true } }
        : undefined,
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: level === 'silent' ? false : { ignorePaths: ['/health'] },
});

export default logger;
