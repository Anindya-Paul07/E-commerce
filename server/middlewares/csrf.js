import crypto from 'crypto';
import { ENV } from '../config/env.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/health',
]);

export function issueCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  res.cookie('csrf_token', token, {
    httpOnly: false,                     // readable by frontend js to set header
    sameSite: ENV.COOKIE_SAMESITE,       // 'lax' by default (see env.js)
    secure: ENV.COOKIE_SECURE,
    maxAge: 60 * 60 * 1000,              // 1h
  });
  res.json({ csrfToken: token });
}

export function requireCsrf(req, res, next) {
  if (SAFE.has(req.method)) return next();
  if (EXEMPT_PATHS.has(req.path)) return next();

  // Only enforce CSRF when using cookie-based auth (JWT cookie present)
  const hasJwtCookie = Boolean(req?.cookies?.[ENV.COOKIE_NAME]);
  if (!hasJwtCookie) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF verification failed' });
  }
  return next();
}
