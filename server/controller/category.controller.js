import Category from '../model/category.model.js';
import Product from '../model/product.model.js'; // for counts & product lists
import { queueCategoryIndex, removeCategoryFromIndex } from '../search/indexer.js';

function slugify(s) {
  return s.toString().toLowerCase().trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isObjectId(v) {
  return /^[0-9a-fA-F]{24}$/.test(String(v));
}

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const q = (req.query.q || '').trim();
    const parent = req.query.parent || null;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (parent === 'root') filter.parent = null;
    else if (parent && isObjectId(parent)) filter.parent = parent;
    else if (parent) {
      const p = await Category.findOne({ slug: parent });
      filter.parent = p ? p._id : null; // slug that doesn't exist -> root set; OK
    }
    const [items, total] = await Promise.all([
      Category.find(filter).sort({ sortOrder: 1, name: 1 }).skip((page - 1)*limit).limit(limit),
      Category.countDocuments(filter)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function tree(req, res, next) {
  try {
    const items = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    const map = new Map(items.map(c => [String(c._id), { ...c, children: [] }]));
    const roots = [];
    for (const c of map.values()) {
      if (c.parent) {
        const p = map.get(String(c.parent));
        if (p) p.children.push(c);
        else roots.push(c);
      } else roots.push(c);
    }
    res.json({ items: roots });
  } catch (e) { next(e); }
}

export async function getOne(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug;
    const cat = isObjectId(idOrSlug)
      ? await Category.findById(idOrSlug)
      : await Category.findOne({ slug: idOrSlug });
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    res.json({ category: cat });
  } catch (e) { next(e); }
}

export async function create(req, res, next) {
  try {
    const { name, description = '', image = '', parent = null, isActive = true, sortOrder = 0, slug } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    let finalSlug = (slug || slugify(name)).trim();
    const base = finalSlug; let i = 1;
    while (await Category.exists({ slug: finalSlug })) finalSlug = `${base}-${i++}`;

    let parentId = null;
    if (parent) {
      if (isObjectId(parent)) parentId = parent;
      else {
        const p = await Category.findOne({ slug: parent });
        if (p) parentId = p._id;
      }
    }

    const category = await Category.create({ name, slug: finalSlug, description, image, parent: parentId, isActive, sortOrder });
    queueCategoryIndex(category);
    res.status(201).json({ category });
  } catch (e) { next(e); }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
    if (updates.slug) {
      const exists = await Category.findOne({ slug: updates.slug, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'Slug already in use' });
    }

    if (typeof updates.parent !== 'undefined') {
      if (!updates.parent) updates.parent = null;
      else if (!isObjectId(updates.parent)) {
        const p = await Category.findOne({ slug: updates.parent });
        updates.parent = p ? p._id : null;
      }
      if (String(updates.parent) === String(id)) return res.status(400).json({ error: 'Category cannot be its own parent' });
    }

    const category = await Category.findByIdAndUpdate(id, updates, { new: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    queueCategoryIndex(category);
    res.json({ category });
  } catch (e) { next(e); }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) return res.status(400).json({ error: 'Category has children; remove or move them first' });

    const usedBy = await Product.countDocuments({ categories: id });
    if (usedBy > 0) return res.status(400).json({ error: 'Category used by products; detach products first' });

    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    removeCategoryFromIndex(id);
    res.json({ ok: true });
  } catch (e) { next(e); }
}

/** Convenience: list products for a category (by id or slug) with pagination */
export async function products(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug;
    const cat = isObjectId(idOrSlug)
      ? await Category.findById(idOrSlug)
      : await Category.findOne({ slug: idOrSlug });
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 48);
    const sort = req.query.sort || '-createdAt';

    const [items, total] = await Promise.all([
      Product.find({ categories: cat._id, status: 'active' }).sort(sort).skip((page - 1) * limit).limit(limit),
      Product.countDocuments({ categories: cat._id, status: 'active' })
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit), category: cat });
  } catch (e) { next(e); }
}
