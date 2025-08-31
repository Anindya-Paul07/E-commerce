import Order from '../model/order.model.js';
import Cart from '../model/cart.model.js';

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

    const order = await Order.create({
      number: orderNumber(),
      user: req.user._id,
      items: cart.items.map(i => ({ ...i.toObject() })),
      subtotal, shipping, tax, total,
      currency: cart.currency || 'USD',
      status: 'pending',
      paymentMethod,
      shippingAddress,
      notes
    });

    // clear cart
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
