import { hasRole } from '../lib/roles.js';

export function rolesRequired(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const ok = hasRole(req.user.roles, roles);
    if (!ok) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
