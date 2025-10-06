import mongoose from 'mongoose';
import Brand from '../model/brand.model.js';
import { toPublicUrl, cleanupReplacedUploads, removeUploads } from '../lib/upload.js';

function slugify(input = '') {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeLogo(value) {
  const sanitize = (input) => {
    const str = String(input ?? '').trim();
    if (['null', 'undefined'].includes(str.toLowerCase())) return '';
    return str;
  };

  if (Array.isArray(value)) {
    return value.map(sanitize).find(Boolean) || '';
  }
  return sanitize(value);
}

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 200);
    const q = (req.query.q || '').trim();
    const status = (req.query.status || '').trim();
    const sort = req.query.sort || 'sortOrder name';

    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      Brand.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Brand.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const idOrSlug = req.params.id;
    let doc = null;
    if (mongoose.isValidObjectId(idOrSlug)) {
      doc = await Brand.findById(idOrSlug);
    }
    if (!doc) {
      doc = await Brand.findOne({ slug: idOrSlug });
    }
    if (!doc) return res.status(404).json({ error: 'Brand not found' });
    res.json({ brand: doc });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const {
      name,
      slug,
      description = '',
      logo: logoInput,
      website = '',
      status = 'active',
      sortOrder = 0,
    } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const uploadedLogo = req.file ? toPublicUrl(req.file) : null;
    const logo = uploadedLogo || normalizeLogo(logoInput);

    const data = { name, description, logo, website, status, sortOrder };
    data.slug = slug ? slugify(slug) : slugify(name);

    const exists = await Brand.findOne({ slug: data.slug });
    if (exists) return res.status(409).json({ error: 'slug already exists' });

    const doc = await Brand.create(data);
    res.status(201).json({ brand: doc });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    if (req.file) {
      body.logo = toPublicUrl(req.file);
    } else if (Object.prototype.hasOwnProperty.call(body, 'logo')) {
      body.logo = normalizeLogo(body.logo);
    } else {
      delete body.logo;
    }

    if (body.slug) body.slug = slugify(body.slug);
    if (!body.slug && body.name) body.slug = slugify(body.name);

    if (body.slug) {
      const dup = await Brand.findOne({ slug: body.slug, _id: { $ne: id } });
      if (dup) return res.status(409).json({ error: 'slug already exists' });
    }

    const doc = await Brand.findById(id);
    if (!doc) return res.status(404).json({ error: 'Brand not found' });

    const previousLogo = doc.logo;

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined) delete body[key];
    });

    doc.set(body);
    await doc.save();

    await cleanupReplacedUploads(previousLogo, doc.logo);

    res.json({ brand: doc });
  } catch (error) {
    next(error);
  }
}

export async function removeOne(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Brand.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Brand not found' });
    await removeUploads(doc.logo);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
