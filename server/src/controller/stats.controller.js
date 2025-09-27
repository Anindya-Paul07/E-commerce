import Order from '../model/order.model.js';
import Product from '../model/product.model.js';
import User from '../model/user.model.js';

export async function getAdminStats(req, res, next) {
  try {
    const [orders, products, users, revenueResult] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({}),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const revenue = revenueResult?.[0]?.total || 0;

    res.json({
      orders,
      products,
      users,
      revenue,
    });
  } catch (error) {
    next(error);
  }
}
