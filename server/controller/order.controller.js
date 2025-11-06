import Order from '../model/order.model.js';
import Cart from '../model/cart.model.js';
import Coupon from '../model/coupon.model.js';
import { commitForOrder } from './inventory.controller.js';
import { validateCouponForUser, couponReasonToMessage } from '../lib/coupon.utils.js';

function pad(n, w=5){ return String(n).padStart(w,'0'); }
function orderNumber() {
  const y = new Date().getFullYear();
  // naive counter: timestamp suffix; for production use a counter collection or Redis incr
  return `ORD-${y}-${pad(Date.now()%100000)}`;
}

export async function checkout(req, res, next) {
  try {
    const { shippingAddress = {}, paymentMethod = 'cod', notes = '' } = req.body || {};
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // totals
    const subtotal = cart.items.reduce((s, it) => s + it.price * it.qty, 0);
    const shipping = 0;
    const tax = 0;

    let discount = 0;
    let couponInfo = null;
    if (cart.coupon?.couponId) {
      const couponDoc = await Coupon.findById(cart.coupon.couponId);
      if (couponDoc) {
        const validation = await validateCouponForUser({ coupon: couponDoc, userId: req.user._id, subtotal });
        if (!validation.ok) {
          cart.coupon = undefined;
          await cart.save();
          return res.status(400).json({ error: couponReasonToMessage(validation.reason, couponDoc) });
        }
        discount = validation.discount;
        couponInfo = {
          couponId: couponDoc._id,
          code: couponDoc.code,
          type: couponDoc.type,
          amount: couponDoc.amount,
          discount,
        };
      } else {
        cart.coupon = undefined;
        await cart.save();
      }
    }

    const totalBeforeDiscount = subtotal + shipping + tax;
    const total = Math.max(0, totalBeforeDiscount - discount);

    // Create order (pending)
    const order = await Order.create({
      number: orderNumber(),
      user: req.user._id,
      items: cart.items.map(i => ({ ...i.toObject() })),
      subtotal, shipping, tax, discount, total,
      coupon: couponInfo,
      currency: cart.currency || 'USD',
      status: 'pending',
      paymentMethod,
      shippingAddress,
      notes
    });

    // Commit all reservations
    try {
      for (const it of cart.items) {
        await commitForOrder({ orderId: order._id, productId: it.product, qty: it.qty });
      }
    } catch (err) {
      // If commit fails for any line, abort order (simple strategy)
      await Order.findByIdAndUpdate(order._id, { status: 'canceled', notes: `Auto-canceled: ${err.message}` });
      return res.status(409).json({ error: 'Insufficient stock during commit', detail: err.message });
    }

    // Clear cart
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();

    if (couponInfo) {
      await Coupon.findByIdAndUpdate(couponInfo.couponId, { $inc: { redemptionCount: 1 } }).catch(() => {});
    }

    res.status(201).json({ order });
  } catch (e) { next(e); }
}

// Customer endpoints
export async function myOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1',10),1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20',10),1),100);
    const [items, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort('-createdAt').skip((page-1)*limit).limit(limit),
      Order.countDocuments({ user: req.user._id })
    ]);
    res.json({ items, total, page, pages: Math.ceil(total/limit) });
  } catch (e) { next(e); }
}

export async function getOne(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.user) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    res.json({ order });
  } catch (e) { next(e); }
}

// Admin endpoints
export async function adminList(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1',10),1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20',10),1),100);
    const status = (req.query.status || '').trim();
    const filter = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      Order.find(filter).sort('-createdAt').skip((page-1)*limit).limit(limit),
      Order.countDocuments(filter)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total/limit) });
  } catch (e) { next(e); }
}

export async function adminUpdateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['pending','paid','shipped','delivered','canceled'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (e) { next(e); }
}
