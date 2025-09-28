export const ROLES = Object.freeze([
  'customer',
  'seller',
  'seller_admin',
  'admin',
  'superadmin',
]);

export function sanitizeRoles(input = []) {
  const unique = new Set(['customer']);
  (Array.isArray(input) ? input : []).forEach((role) => {
    if (ROLES.includes(role)) unique.add(role);
  });
  return Array.from(unique);
}

export function hasRole(userRoles = [], required = []) {
  const roles = Array.isArray(userRoles) ? userRoles : [];
  if (roles.includes('superadmin')) return true;
  return required.some((role) => roles.includes(role));
}
