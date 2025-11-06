import { logger } from '../lib/logger.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500;
  logger.error({ err, status }, 'request_error');
  res.status(status).json({ error: err.message || 'Server error' });
}