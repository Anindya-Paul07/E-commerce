import Cart from '../model/cart.model.js';
import Product from '../model/product.model.js';
import { reserveForCart, releaseForCart, ensureDefaultVariantForProduct } from './inventory.controller.js';

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ cart, subtotal: cart.subtotal() });
  } catch (e) { next(e); }
}

export async function addItem(req, res, next) {
  try {
    const { productId, qty = 1 } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.status !== 'active') return res.status(400).json({ error: 'Product not active' });

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex(it => String(it.product) === String(product._id));
    const delta = Number(qty || 1);

    if (delta <= 0) return res.status(400).json({ error: 'qty must be > 0' });

    const variant = await ensureDefaultVariantForProduct(product._id);
    await reserveForCart({ userId: req.user._id, productId: product._id, qty: delta, cartId: cart._id });

    if (idx >= 0) {
      cart.items[idx].qty += delta;
    } else {
      cart.items.push({
        product: product._id,
        seller: product.seller,
        shop: product.shop,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        qty: delta,
        variant: variant?._id,
        commissionRate: product.commission?.rate,
        metadata: {
          fulfillmentMode: product.fulfillmentMode,
          visibility: product.visibility,
        },
      });
    }
    await cart.save();
    res.status(201).json({ cart, subtotal: cart.subtotal() });
  } catch (e) { next(e); }
}

export async function updateItem(req, res, next) {
  try {
    const { productId } = req.params;
    const { qty } = req.body || {};
    const cart = await getOrCreateCart(req.user._id);
    const it = cart.items.find(i => String(i.product) === String(productId));
    if (!it) return res.status(404).json({ error: 'Item not in cart' });
    const n = Number(qty);
    if (!Number.isFinite(n) || n < 1) return res.status(400).json({ error: 'qty must be >= 1' });

    const delta = n - it.qty;
    if (delta > 0) {
      await reserveForCart({ userId: req.user._id, productId, qty: delta, cartId: cart._id });
    } else if (delta < 0) {
      await releaseForCart({ userId: req.user._id, productId, qty: Math.abs(delta), cartId: cart._id });
    }

    it.qty = n;
    await cart.save();
    res.json({ cart, subtotal: cart.subtotal() });
  } catch (e) { next(e); }
}

export async function removeItem(req, res, next) {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user._id);
    const remaining = [];
    for (const item of cart.items) {
      if (String(item.product) === String(productId)) {
        await releaseForCart({ userId: req.user._id, productId, qty: item.qty, cartId: cart._id });
      } else {
        remaining.push(item);
      }
    }
    cart.items = remaining;
    await cart.save();
    res.json({ cart, subtotal: cart.subtotal() });
  } catch (e) { next(e); }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const releases = cart.items.map((it) =>
      releaseForCart({ userId: req.user._id, productId: it.product, qty: it.qty, cartId: cart._id })
    );
    await Promise.allSettled(releases);
    cart.items = [];
    await cart.save();
    res.json({ cart, subtotal: 0 });
  } catch (e) { next(e); }
}
