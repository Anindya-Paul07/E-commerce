import User from '../../model/user.model.js';
import { sanitizeRoles, ROLES } from '../../lib/roles.js';

export async function listUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const q = (req.query.q || '').trim();
    const role = (req.query.role || '').trim();

    const filter = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    }
    if (role && ROLES.includes(role)) filter.roles = role;

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .select('name email roles status sellerProfile createdAt'),
      User.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoles(req, res, next) {
  try {
    const { id } = req.params;
    const { roles = [] } = req.body || {};
    const sanitized = sanitizeRoles(Array.isArray(roles) ? roles : []);

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { roles: sanitized } },
      { new: true }
    ).select('name email roles status sellerProfile');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    next(error);
  }
}
