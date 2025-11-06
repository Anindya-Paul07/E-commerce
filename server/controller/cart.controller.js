import Cart from '../model/cart.model.js';
import Product from '../model/product.model.js';
import Coupon from '../model/coupon.model.js';
import { reserveForCart, releaseForCart } from './inventory.controller.js';
import { loadCouponByCode, validateCouponForUser, couponReasonToMessage } from '../lib/coupon.utils.js';

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function buildCartPayload(cart, userId) {
  const subtotal = cart.subtotal();
  let discount = 0;
  let couponInfo = null;
  let couponError = null;

  if (cart.coupon?.couponId) {
    const couponDoc = await Coupon.findById(cart.coupon.couponId);
    if (couponDoc) {
      const validation = await validateCouponForUser({ coupon: couponDoc, userId, subtotal });
      if (validation.ok) {
        discount = validation.discount;
        couponInfo = {
          code: couponDoc.code,
          type: couponDoc.type,
          amount: couponDoc.amount,
          maxDiscountValue: couponDoc.maxDiscountValue,
          minSubtotal: couponDoc.minSubtotal,
        };
      } else {
        couponError = couponReasonToMessage(validation.reason, couponDoc);
        couponInfo = {
          code: couponDoc.code,
        };
      }
    } else {
      // Coupon was deleted - clear it silently
      cart.coupon = undefined;
      await cart.save();
    }
  }

  const total = Math.max(0, subtotal - discount);
  return { cart, subtotal, discount, total, coupon: couponInfo, couponError };
}

export async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const payload = await buildCartPayload(cart, req.user._id);
    res.json(payload);
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
    let addQty = Number(qty || 1);

    if (idx >= 0) {
      // reserve only the delta being added
      await reserveForCart({ userId: req.user._id, productId: product._id, qty: addQty, cartId: cart._id });
      cart.items[idx].qty += addQty;
    } else {
      await reserveForCart({ userId: req.user._id, productId: product._id, qty: addQty, cartId: cart._id });
      cart.items.push({
        product: product._id,
        title: product.title,
        price: product.price,
        image: product.images?.[0] || '',
        qty: addQty,
      });
    }
    await cart.save();
    const payload = await buildCartPayload(cart, req.user._id);
    res.status(201).json(payload);
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
    const payload = await buildCartPayload(cart, req.user._id);
    res.json(payload);
  } catch (e) { next(e); }
}

export async function removeItem(req, res, next) {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user._id);
    const it = cart.items.find(i => String(i.product) === String(productId));
    if (it) {
      await releaseForCart({ userId: req.user._id, productId, qty: it.qty, cartId: cart._id });
      cart.items = cart.items.filter(i => String(i.product) !== String(productId));
      await cart.save();
    }
    const payload = await buildCartPayload(cart, req.user._id);
    res.json(payload);
  } catch (e) { next(e); }
}

export async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    // release everything
    const releases = cart.items.map(it =>
      releaseForCart({ userId: req.user._id, productId: it.product, qty: it.qty, cartId: cart._id })
    );
    await Promise.allSettled(releases);
    cart.items = [];
    cart.coupon = undefined;
    await cart.save();
    const payload = await buildCartPayload(cart, req.user._id);
    res.json(payload);
  } catch (e) { next(e); }
}

export async function applyCoupon(req, res, next) {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'coupon_code_required' });

    const cart = await getOrCreateCart(req.user._id);
    const subtotal = cart.subtotal();
    if (subtotal <= 0) return res.status(400).json({ error: 'Cart is empty' });

    const couponDoc = await loadCouponByCode(code);
    const validation = await validateCouponForUser({ coupon: couponDoc, userId: req.user._id, subtotal });
    if (!validation.ok) {
      return res.status(400).json({ error: couponReasonToMessage(validation.reason, couponDoc) });
    }

    cart.coupon = {
      couponId: couponDoc._id,
      code: couponDoc.code,
      appliedAt: new Date(),
    };
    await cart.save();

    const payload = await buildCartPayload(cart, req.user._id);
    res.json(payload);
  } catch (e) { next(e); }
}

export async function removeCoupon(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.coupon = undefined;
    await cart.save();

    const payload = await buildCartPayload(cart, req.user._id);
    res.json(payload);
  } catch (e) { next(e); }
}
