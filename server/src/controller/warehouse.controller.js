import Warehouse from '../model/warehouse.model.js';
import InventoryItem from '../model/inventory-item.model.js';

function isObjectId(value) {
  return /^[0-9a-fA-F]{24}$/.test(String(value));
}

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
    const q = (req.query.q || '').trim();
    const active = req.query.active;

    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { code: new RegExp(q, 'i') }];
    if (typeof active !== 'undefined') filter.active = active === 'true';

    const [items, total] = await Promise.all([
      Warehouse.find(filter)
        .sort({ isDefault: -1, code: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Warehouse.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const idOrCode = req.params.idOrCode;
    const doc = isObjectId(idOrCode)
      ? await Warehouse.findById(idOrCode)
      : await Warehouse.findOne({ code: idOrCode });
    if (!doc) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse: doc });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { name, code, address = {}, active = true, isDefault = false } = req.body || {};
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });

    const exists = await Warehouse.findOne({ code });
    if (exists) return res.status(409).json({ error: 'code already exists' });

    const doc = await Warehouse.create({ name, code, address, active, isDefault });
    if (doc.isDefault) {
      await Warehouse.updateMany({ _id: { $ne: doc._id } }, { $set: { isDefault: false } });
    }

    res.status(201).json({ warehouse: doc });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    if (body.code) {
      const dup = await Warehouse.findOne({ code: body.code, _id: { $ne: id } });
      if (dup) return res.status(409).json({ error: 'code already exists' });
    }

    const doc = await Warehouse.findByIdAndUpdate(id, body, { new: true });
    if (!doc) return res.status(404).json({ error: 'Warehouse not found' });

    if (doc.isDefault) {
      await Warehouse.updateMany({ _id: { $ne: doc._id } }, { $set: { isDefault: false } });
    }

    res.json({ warehouse: doc });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Warehouse.findById(id);
    if (!doc) return res.status(404).json({ error: 'Warehouse not found' });
    if (doc.isDefault) return res.status(400).json({ error: 'Cannot delete the default warehouse' });

    const inUse = await InventoryItem.exists({ warehouse: id });
    if (inUse) return res.status(400).json({ error: 'Warehouse has inventory records' });

    await Warehouse.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
