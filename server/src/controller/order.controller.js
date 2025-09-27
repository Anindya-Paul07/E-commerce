import Order from '../model/order.model.js';
import Cart from '../model/cart.model.js';
import { queueFulfillmentForOrder } from '../lib/fulfillment.js';
import { logger } from '../lib/logger.js';
import { commitForOrder, releaseForCart } from './inventory.controller.js';

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

    const subtotal = cart.items.reduce((s, it) => s + it.price * it.qty, 0);
    const shipping = 0; // flat for now
    const tax = 0;      // add tax logic later
    const total = subtotal + shipping + tax;

    const now = new Date();
    const items = cart.items.map((i) => {
      const commissionRate = typeof i.commissionRate === 'number' ? i.commissionRate : 0;
      const commissionAmount = Number((commissionRate * i.price * i.qty).toFixed(2));
      return {
        ...i.toObject(),
        commissionRate,
        commissionAmount,
        fulfillmentStatus: 'pending',
        fulfillmentEvents: [
          {
            status: 'pending',
            at: now,
            notes: 'Order created',
          },
        ],
      };
    });

    const commissionTotal = items.reduce((sum, item) => sum + (item.commissionAmount || 0), 0);

    const order = await Order.create({
      number: orderNumber(),
      user: req.user._id,
      items,
      subtotal, shipping, tax, total,
      currency: cart.currency || 'USD',
      status: 'pending',
      paymentMethod,
      shippingAddress,
      notes,
      fulfillmentSummary: {
        status: 'pending',
        lastUpdatedAt: now,
      },
      settlement: {
        status: 'pending',
        commissionTotal,
        netPayoutTotal: total - commissionTotal - shipping - tax,
      },
    });

    try {
      for (const line of cart.items) {
        await commitForOrder({ orderId: order._id, productId: line.product, qty: line.qty });
      }
    } catch (error) {
      const releases = cart.items.map((line) =>
        releaseForCart({ userId: req.user._id, productId: line.product, qty: line.qty, cartId: cart._id })
      );
      await Promise.allSettled(releases);
      await Order.findByIdAndUpdate(order._id, {
        status: 'canceled',
        notes: `Auto-canceled: ${error.message}`,
      });
      logger.warn({ orderId: order._id, error: error.message }, 'Order canceled during stock commit');
      return res.status(409).json({ error: 'Insufficient stock during commit', detail: error.message });
    }

    queueFulfillmentForOrder(order).catch((err) => {
      logger.error({ err, orderId: order._id }, 'Failed to queue fulfillment tasks');
    });

    cart.items = [];
    await cart.save();

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
