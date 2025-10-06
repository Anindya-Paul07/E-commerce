import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import SellerListing from '../model/seller-listing.model.js';
import { mapUploadedFiles, cleanupReplacedUploads, removeUploads } from '../lib/upload.js';

function slugify(input) {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return fallback;
    }
  }
  if (typeof value === 'object') return value;
  return fallback;
}

function parseArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((entry) => entry != null && `${entry}`.trim() !== '').map((entry) => `${entry}`.trim());
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parseArray(parsed);
    } catch (error) {
      // ignore
    }
    return trimmed.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

function normalizeAttributes(value) {
  const entries = parseJSON(value, value) || [];
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => ({
      key: entry?.key?.trim?.() || '',
      value: entry?.value?.trim?.() || '',
      unit: entry?.unit?.trim?.() || undefined,
    }))
    .filter((entry) => entry.key && entry.value);
}

function toVariantPayload(input, catalogProductId) {
  const sku = `${input?.sku || ''}`.trim();
  if (!sku) return null;
  const payload = {
    catalogProduct: catalogProductId,
    sku,
    title: `${input?.title || ''}`.trim(),
    status: input?.status || 'active',
    options: input?.options || {},
    attributes: input?.attributes || {},
    pricing: input?.pricing || { currency: 'USD', listPrice: Number(input?.price ?? 0) },
    metadata: input?.metadata || {},
  };
  if (!payload.pricing || typeof payload.pricing.listPrice !== 'number') {
    payload.pricing = {
      currency: input?.pricing?.currency || 'USD',
      listPrice: Number(input?.pricing?.listPrice ?? input?.price ?? 0),
      compareAtPrice: input?.pricing?.compareAtPrice,
    };
  }
  return payload;
}

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const q = (req.query.q || '').trim();
    const status = (req.query.status || '').trim();

    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      CatalogProduct.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CatalogProduct.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug;
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const catalogProduct = await (isId
      ? CatalogProduct.findById(idOrSlug)
      : CatalogProduct.findOne({ slug: idOrSlug }));
    if (!catalogProduct) return res.status(404).json({ error: 'Catalog product not found' });

    const variants = await CatalogVariant.find({ catalogProduct: catalogProduct._id }).lean();
    res.json({ product: catalogProduct, variants });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const body = req.body || {};

    const name = `${body.name || ''}`.trim();
    if (!name) return res.status(400).json({ error: 'name is required' });

    const slugInput = body.slug ? `${body.slug}`.trim() : slugify(name);
    let slug = slugInput;
    let counter = 1;
    while (await CatalogProduct.exists({ slug })) {
      slug = `${slugInput}-${counter++}`;
    }

    const uploadedImages = mapUploadedFiles(req.files?.images);
    const imageUrls = parseArray(body.images);
    const images = [...imageUrls, ...uploadedImages];

    const productPayload = {
      name,
      slug,
      summary: `${body.summary || ''}`.trim(),
      description: `${body.description || ''}`.trim(),
      status: body.status || 'draft',
      moderationState: body.moderationState || 'pending',
      moderationNotes: body.moderationNotes,
      brand: body.brand,
      categories: parseArray(body.categories),
      tags: parseArray(body.tags),
      defaultImage: body.defaultImage || images[0] || '',
      images,
      attributes: normalizeAttributes(body.attributes),
      dimensions: parseJSON(body.dimensions, body.dimensions || undefined),
      seo: parseJSON(body.seo, body.seo || undefined),
      metadata: parseJSON(body.metadata, body.metadata || {}),
    };

    const catalogProduct = await CatalogProduct.create(productPayload);

    const variantsInput = parseJSON(body.variants, body.variants); // could be array or undefined
    let createdVariants = [];
    if (Array.isArray(variantsInput) && variantsInput.length) {
      const payloads = variantsInput
        .map((entry) => toVariantPayload(entry, catalogProduct._id))
        .filter(Boolean);
      if (payloads.length) {
        createdVariants = await CatalogVariant.insertMany(payloads, { ordered: false });
      }
    }

    res.status(201).json({ product: catalogProduct, variants: createdVariants });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate SKU or slug' });
    }
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const catalogProduct = await CatalogProduct.findById(id);
    if (!catalogProduct) return res.status(404).json({ error: 'Catalog product not found' });

    const body = req.body || {};

    if (body.name) catalogProduct.name = `${body.name}`.trim();
    if (body.slug) {
      const slugCandidate = `${body.slug}`.trim();
      const exists = await CatalogProduct.findOne({ slug: slugCandidate, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'Slug already in use' });
      catalogProduct.slug = slugCandidate;
    }

    if (body.summary !== undefined) catalogProduct.summary = `${body.summary}`.trim();
    if (body.description !== undefined) catalogProduct.description = `${body.description}`.trim();
    if (body.status) catalogProduct.status = body.status;
    if (body.moderationState) catalogProduct.moderationState = body.moderationState;
    if (body.moderationNotes !== undefined) catalogProduct.moderationNotes = body.moderationNotes;
    if (body.brand !== undefined) catalogProduct.brand = body.brand;
    if (body.categories !== undefined) catalogProduct.categories = parseArray(body.categories);
    if (body.tags !== undefined) catalogProduct.tags = parseArray(body.tags);

    const uploadedImages = mapUploadedFiles(req.files?.images);
    const bodyImages = body.images !== undefined ? parseArray(body.images) : null;
    const previousImages = catalogProduct.images || [];

    if (bodyImages || uploadedImages.length) {
      const images = [...(bodyImages ?? catalogProduct.images ?? []), ...uploadedImages];
      catalogProduct.images = images;
      if (!body.defaultImage && !catalogProduct.defaultImage && images[0]) {
        catalogProduct.defaultImage = images[0];
      }
    }

    if (body.defaultImage !== undefined) catalogProduct.defaultImage = body.defaultImage || catalogProduct.images?.[0] || '';
    if (body.attributes !== undefined) catalogProduct.attributes = normalizeAttributes(body.attributes);
    if (body.dimensions !== undefined) catalogProduct.dimensions = parseJSON(body.dimensions, body.dimensions || undefined);
    if (body.seo !== undefined) catalogProduct.seo = parseJSON(body.seo, body.seo || undefined);
    if (body.metadata !== undefined) catalogProduct.metadata = parseJSON(body.metadata, body.metadata || {});

    await catalogProduct.save();

    await cleanupReplacedUploads(previousImages, catalogProduct.images);

    const variantsInput = parseJSON(body.variants, null);
    let variants = null;
    if (Array.isArray(variantsInput)) {
      const listingsCount = await SellerListing.countDocuments({ catalogProduct: catalogProduct._id });
      if (listingsCount > 0) {
        return res.status(409).json({ error: 'Cannot replace variants while listings exist' });
      }
      await CatalogVariant.deleteMany({ catalogProduct: catalogProduct._id });
      const payloads = variantsInput
        .map((entry) => toVariantPayload(entry, catalogProduct._id))
        .filter(Boolean);
      if (payloads.length) variants = await CatalogVariant.insertMany(payloads, { ordered: false });
    }

    const response = { product: catalogProduct };
    if (variants) response.variants = variants;

    res.json(response);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate SKU or slug' });
    }
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const catalogProduct = await CatalogProduct.findById(id);
    if (!catalogProduct) return res.status(404).json({ error: 'Catalog product not found' });

    const listingsCount = await SellerListing.countDocuments({ catalogProduct: id });
    if (listingsCount > 0) {
      return res.status(409).json({ error: 'Catalog product is referenced by seller listings' });
    }

    await CatalogVariant.deleteMany({ catalogProduct: id });
    await CatalogProduct.deleteOne({ _id: id });
    await removeUploads(catalogProduct.images);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
