import Inventory from '../model/inventory.model.js';
import Product from '../model/product.model.js';
import Warehouse from '../model/warehouse.model.js';

function parsePagination(req) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
  return { page, limit };
}

function buildFilter(query = {}) {
  const filter = {};
  if (query.product) filter.product = query.product;
  if (query.warehouse) filter.warehouse = query.warehouse;
  return filter;
}

export async function listInventory(req, res, next) {
  try {
    const { page, limit } = parsePagination(req);
    const filter = buildFilter(req.query);

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .populate('product', 'title slug price images status')
        .populate('warehouse', 'name code isActive')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Inventory.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getInventory(req, res, next) {
  try {
    const entry = await Inventory.findById(req.params.id)
      .populate('product', 'title slug price images status')
      .populate('warehouse', 'name code isActive');
    if (!entry) return res.status(404).json({ error: 'Inventory not found' });
    res.json({ inventory: entry });
  } catch (error) {
    next(error);
  }
}

export async function upsertInventory(req, res, next) {
  try {
    const { product, warehouse, onHand = 0, reserved = 0, incoming = 0, safetyStock = 0, notes = '' } = req.body || {};
    if (!product || !warehouse) {
      return res.status(400).json({ error: 'product and warehouse are required' });
    }

    const [productExists, warehouseExists] = await Promise.all([
      Product.exists({ _id: product }),
      Warehouse.exists({ _id: warehouse }),
    ]);

    if (!productExists) return res.status(404).json({ error: 'Product not found' });
    if (!warehouseExists) return res.status(404).json({ error: 'Warehouse not found' });

    const payload = { product, warehouse, onHand, reserved, incoming, safetyStock, notes };

    const entry = await Inventory.findOneAndUpdate(
      { product, warehouse },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate('product', 'title slug price images status')
      .populate('warehouse', 'name code isActive');

    res.status(201).json({ inventory: entry });
  } catch (error) {
    next(error);
  }
}

export async function updateInventory(req, res, next) {
  try {
    const updates = { ...req.body };
    const entry = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('product', 'title slug price images status')
      .populate('warehouse', 'name code isActive');
    if (!entry) return res.status(404).json({ error: 'Inventory not found' });
    res.json({ inventory: entry });
  } catch (error) {
    next(error);
  }
}

export async function deleteInventory(req, res, next) {
  try {
    const entry = await Inventory.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Inventory not found' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
