import mongoose from 'mongoose';
import Variant from '../model/variant.model.js';
import InventoryItem from '../model/inventory-item.model.js';
import StockMove from '../model/stock-move.model.js';
import { ensureDefaultWarehouse } from '../lib/warehouse.utils.js';
import Product from '../model/product.model.js';
import Warehouse from '../model/warehouse.model.js';

function skuFromSlug(slug) {
  return (slug || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Create/fetch a default variant for a product (one-variant products)
export async function ensureDefaultVariantForProduct(productId) {
  const product = await Product.findById(productId).lean();
  if (!product) throw new Error('product_not_found');

  let v = await Variant.findOne({ product: product._id });
  if (v) return v;

  const sku = skuFromSlug(product.slug) || `SKU-${String(product._id).slice(-6)}`;
  v = await Variant.create({
    product: product._id,
    sku,
    title: 'Default',
    options: {},
    price: product.price,
    status: 'active',
    managesInventory: true,
  });
  return v;
}

// Increase on-hand (for initial product stock or receiving)
export async function receiveStock({ productId, qty, reason = 'initial' }) {
  if (qty <= 0) return;
  const whId = await ensureDefaultWarehouse();
  const variant = await ensureDefaultVariantForProduct(productId);
  const doc = await InventoryItem.increaseOnHand({ variantId: variant._id, warehouseId: whId, qty });

  await StockMove.create({
    type: 'in',
    variant: variant._id,
    product: productId,
    qty,
    toWarehouse: whId,
    reason,
    snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
  });
}

// Reserve stock for a cart
export async function reserveForCart({ userId, productId, qty, cartId = null }) {
  const whId = await ensureDefaultWarehouse();
  const variant = await ensureDefaultVariantForProduct(productId);
  const doc = await InventoryItem.reserve({ variantId: variant._id, warehouseId: whId, qty });

  await StockMove.create({
    type: 'reserve',
    variant: variant._id,
    product: productId,
    qty,
    toWarehouse: whId,
    cart: cartId ? new mongoose.Types.ObjectId(cartId) : undefined,
    snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
  });
}

// Release reserved stock (cart item removal / qty decrease / clear)
export async function releaseForCart({ userId, productId, qty, cartId = null }) {
  const whId = await ensureDefaultWarehouse();
  const variant = await ensureDefaultVariantForProduct(productId);
  const doc = await InventoryItem.release({ variantId: variant._id, warehouseId: whId, qty });

  await StockMove.create({
    type: 'release',
    variant: variant._id,
    product: productId,
    qty,
    toWarehouse: whId,
    cart: cartId ? new mongoose.Types.ObjectId(cartId) : undefined,
    snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
  });
}

// Commit reservation when order is placed/paid
export async function commitForOrder({ orderId, productId, qty }) {
  const whId = await ensureDefaultWarehouse();
  const variant = await ensureDefaultVariantForProduct(productId);
  const doc = await InventoryItem.commit({ variantId: variant._id, warehouseId: whId, qty });

  await StockMove.create({
    type: 'commit',
    variant: variant._id,
    product: productId,
    qty,
    toWarehouse: whId,
    order: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
    snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
  });
}

// helpers
async function findProductByIdOrSlug(idOrSlug) {
  if (!idOrSlug) return null
  const byId = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
  return byId ? Product.findById(idOrSlug) : Product.findOne({ slug: idOrSlug })
}
async function findWarehouseByCodeOrDefault(code) {
  if (code) {
    const w = await Warehouse.findOne({ code, active: true })
    if (!w) throw new Error(`warehouse_not_found:${code}`)
    return w._id
  }
  return ensureDefaultWarehouse()
}

// ---------- Admin endpoints ----------

// GET /api/inventory/levels/:idOrSlug
// per-warehouse stock for all variants of a product (single default variant in your setup)
export async function getLevels(req, res, next) {
  try {
    const p = await findProductByIdOrSlug(req.params.idOrSlug)
    if (!p) return res.status(404).json({ error: 'Product not found' })

    const variants = await Variant.find({ product: p._id }, { _id: 1, sku: 1, title: 1 })
    const vIds = variants.map(v => v._id)

    const rows = await InventoryItem.find({ variant: { $in: vIds } })
      .populate('warehouse', 'name code')
      .populate('variant', 'sku title')

    const data = rows.map(r => ({
      warehouse: { id: r.warehouse?._id, name: r.warehouse?.name, code: r.warehouse?.code },
      variant: { id: r.variant?._id, sku: r.variant?.sku, title: r.variant?.title },
      qtyOnHand: r.qtyOnHand,
      qtyReserved: r.qtyReserved,
      qtyAvailable: Math.max(0, (r.qtyOnHand || 0) - (r.qtyReserved || 0)),
      lowStockThreshold: r.lowStockThreshold ?? 0,
      updatedAt: r.updatedAt
    }))

    res.json({ product: { id: p._id, title: p.title, slug: p.slug }, levels: data })
  } catch (e) { next(e) }
}

// POST /api/inventory/receive
// body: { productIdOrSlug, qty, warehouseCode?, reason? }
export async function receive(req, res, next) {
  try {
    const { productIdOrSlug, qty, warehouseCode, reason = 'receive' } = req.body || {}
    const q = Number(qty)
    if (!productIdOrSlug || !Number.isFinite(q) || q <= 0)
      return res.status(400).json({ error: 'productIdOrSlug and qty>0 required' })

    const p = await findProductByIdOrSlug(productIdOrSlug)
    if (!p) return res.status(404).json({ error: 'Product not found' })

    const v = await ensureDefaultVariantForProduct(p._id)
    const wId = await findWarehouseByCodeOrDefault(warehouseCode)

    const doc = await InventoryItem.increaseOnHand({ variantId: v._id, warehouseId: wId, qty: q })
    await StockMove.create({
      type: 'in', variant: v._id, product: p._id, qty: q, toWarehouse: wId, reason,
      snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
    })

    res.status(201).json({ ok: true })
  } catch (e) { next(e) }
}

// POST /api/inventory/adjust
// body: { productIdOrSlug, qty, warehouseCode?, reason? } qty can be +/-
export async function adjust(req, res, next) {
  try {
    const { productIdOrSlug, qty, warehouseCode, reason = 'adjust' } = req.body || {}
    const q = Number(qty)
    if (!productIdOrSlug || !Number.isFinite(q) || q === 0)
      return res.status(400).json({ error: 'productIdOrSlug and non-zero qty required' })

    const p = await findProductByIdOrSlug(productIdOrSlug)
    if (!p) return res.status(404).json({ error: 'Product not found' })

    const v = await ensureDefaultVariantForProduct(p._id)
    const wId = await findWarehouseByCodeOrDefault(warehouseCode)

    let doc
    if (q > 0) {
      doc = await InventoryItem.increaseOnHand({ variantId: v._id, warehouseId: wId, qty: q })
      await StockMove.create({
        type: 'adjust', variant: v._id, product: p._id, qty: q, toWarehouse: wId, reason,
        snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
      })
    } else {
      const n = Math.abs(q)
      doc = await InventoryItem.decreaseOnHand({ variantId: v._id, warehouseId: wId, qty: n })
      await StockMove.create({
        type: 'adjust', variant: v._id, product: p._id, qty: -n, toWarehouse: wId, reason,
        snapshot: { qtyOnHand: doc.qtyOnHand, qtyReserved: doc.qtyReserved }
      })
    }
    res.json({ ok: true })
  } catch (e) {
    if (String(e.message).includes('insufficient_on_hand')) {
      return res.status(409).json({ error: 'Insufficient on-hand for adjustment' })
    }
    next(e)
  }
}

// POST /api/inventory/transfer
// body: { productIdOrSlug, qty, fromCode, toCode, reason? }
export async function transfer(req, res, next) {
  try {
    const { productIdOrSlug, qty, fromCode, toCode, reason = 'transfer' } = req.body || {}
    const q = Number(qty)
    if (!productIdOrSlug || !fromCode || !toCode || !Number.isFinite(q) || q <= 0)
      return res.status(400).json({ error: 'productIdOrSlug, fromCode, toCode and qty>0 required' })

    const p = await findProductByIdOrSlug(productIdOrSlug)
    if (!p) return res.status(404).json({ error: 'Product not found' })

    const v = await ensureDefaultVariantForProduct(p._id)
    const fromId = await findWarehouseByCodeOrDefault(fromCode)
    const toId = await findWarehouseByCodeOrDefault(toCode)

    // decrease from source
    const dec = await InventoryItem.decreaseOnHand({ variantId: v._id, warehouseId: fromId, qty: q })
    await StockMove.create({
      type: 'transfer', variant: v._id, product: p._id, qty: -q, fromWarehouse: fromId, toWarehouse: toId, reason,
      snapshot: { qtyOnHand: dec.qtyOnHand, qtyReserved: dec.qtyReserved }
    })
    // increase in destination
    const inc = await InventoryItem.increaseOnHand({ variantId: v._id, warehouseId: toId, qty: q })
    await StockMove.create({
      type: 'transfer', variant: v._id, product: p._id, qty: q, fromWarehouse: fromId, toWarehouse: toId, reason,
      snapshot: { qtyOnHand: inc.qtyOnHand, qtyReserved: inc.qtyReserved }
    })

    res.json({ ok: true })
  } catch (e) {
    if (String(e.message).includes('insufficient_on_hand')) {
      return res.status(409).json({ error: 'Insufficient on-hand to transfer' })
    }
    next(e)
  }
}

// GET /api/inventory/moves?product=...&variant=...&page=1&limit=50&type=reserve|...
export async function listMoves(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200)
    const filter = {}
    if (req.query.product) filter.product = req.query.product
    if (req.query.variant) filter.variant = req.query.variant
    if (req.query.type) filter.type = req.query.type

    const [items, total] = await Promise.all([
      StockMove.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit)
        .populate('variant', 'sku title')
        .populate('product', 'title slug')
        .populate('fromWarehouse', 'code name')
        .populate('toWarehouse', 'code name')
        .lean(),
      StockMove.countDocuments(filter)
    ])
    res.json({ items, total, page, pages: Math.ceil(total / limit) })
  } catch (e) { next(e) }
}

// PATCH /api/inventory/item/:variantId/:warehouseId  { lowStockThreshold }
export async function setLowStockThreshold(req, res, next) {
  try {
    const { variantId, warehouseId } = req.params
    const { lowStockThreshold } = req.body || {}
    const n = Number(lowStockThreshold)
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ error: 'lowStockThreshold must be >= 0' })

    const doc = await InventoryItem.findOneAndUpdate(
      { variant: variantId, warehouse: warehouseId },
      { $set: { lowStockThreshold: n } },
      { new: true, upsert: true }
    )
    res.json({ item: doc })
  } catch (e) { next(e) }
}

// GET /api/inventory/low-stock?threshold=5
export async function listLowStock(req, res, next) {
  try {
    const t = req.query.threshold != null ? Number(req.query.threshold) : null

    const items = await InventoryItem.find({})
      .populate({ path: 'variant', select: 'sku title product' })
      .populate({ path: 'warehouse', select: 'code name' })

    const low = items.filter(it => {
      const available = Math.max(0, (it.qtyOnHand || 0) - (it.qtyReserved || 0))
      const rule = t != null ? available <= t : (it.lowStockThreshold != null && available <= it.lowStockThreshold)
      return rule
    }).map(it => ({
      variant: { id: it.variant?._id, sku: it.variant?.sku, title: it.variant?.title, product: it.variant?.product },
      warehouse: { id: it.warehouse?._id, code: it.warehouse?.code, name: it.warehouse?.name },
      qtyOnHand: it.qtyOnHand,
      qtyReserved: it.qtyReserved,
      qtyAvailable: Math.max(0, (it.qtyOnHand || 0) - (it.qtyReserved || 0)),
      lowStockThreshold: it.lowStockThreshold ?? 0,
      updatedAt: it.updatedAt
    }))

    res.json({ items: low })
  } catch (e) { next(e) }
}
