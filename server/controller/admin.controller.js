import Order from '../model/order.model.js'
import Product from '../model/product.model.js'
import User from '../model/user.model.js'

export async function stats(req, res, next) {
  try {
    const [orders, products, users] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({}),
    ])
    res.json({ orders, products, users })
  } catch (e) { next(e) }
}
