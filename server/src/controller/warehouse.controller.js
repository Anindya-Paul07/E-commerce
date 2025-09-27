import Warehouse from '../model/warehouse.model.js';

function buildFilter(query = {}) {
  const filter = {};
  if (query.q) {
    filter.$text = { $search: query.q.trim() };
  }
  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;
  return filter;
}

export async function listWarehouses(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const filter = buildFilter(req.query);

    const [items, total] = await Promise.all([
      Warehouse.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Warehouse.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getWarehouse(req, res, next) {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (error) {
    next(error);
  }
}

export async function createWarehouse(req, res, next) {
  try {
    const { name, code } = req.body || {};
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' });

    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ warehouse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Warehouse name or code already exists' });
    }
    next(error);
  }
}

export async function updateWarehouse(req, res, next) {
  try {
    const updates = { ...req.body };
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ warehouse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Warehouse name or code already exists' });
    }
    next(error);
  }
}

export async function deleteWarehouse(req, res, next) {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
