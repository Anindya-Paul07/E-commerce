import mongoose from 'mongoose';
import CatalogProduct from '../../model/catalog-product.model.js';
import CatalogVariant from '../../model/catalog-variant.model.js';
import SellerListing from '../../model/seller-listing.model.js';

function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeVariantPayload(rawVariants = []) {
  if (!Array.isArray(rawVariants)) return [];
  const seen = new Set();
  return rawVariants.map((variant) => {
    const sku = variant?.sku?.trim();
    if (!sku) {
      throw Object.assign(new Error('Variant sku is required'), { statusCode: 400 });
    }
    if (seen.has(sku)) {
      throw Object.assign(new Error(`Duplicate sku "${sku}" in payload`), { statusCode: 400 });
    }
    seen.add(sku);

    const price = variant?.pricing?.listPrice;
    if (price == null || Number.isNaN(Number(price))) {
      throw Object.assign(new Error(`Variant ${sku} pricing.listPrice is required`), { statusCode: 400 });
    }

    return {
      sku,
      title: variant?.title?.trim(),
      options: variant?.options || {},
      attributes: variant?.attributes || {},
      barcode: variant?.barcode?.trim(),
      status: variant?.status || 'draft',
      metadata: variant?.metadata || {},
      pricing: {
        currency: variant?.pricing?.currency || 'USD',
        listPrice: Number(variant?.pricing?.listPrice),
        compareAtPrice:
          variant?.pricing?.compareAtPrice != null
            ? Number(variant?.pricing?.compareAtPrice)
            : null,
        minRetailPrice:
          variant?.pricing?.minRetailPrice != null
            ? Number(variant?.pricing?.minRetailPrice)
            : null,
        maxRetailPrice:
          variant?.pricing?.maxRetailPrice != null
            ? Number(variant?.pricing?.maxRetailPrice)
            : null,
      },
    };
  });
}

export async function adminListCatalogProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const { status, moderationState, lifecycle } = req.query;
    const q = (req.query.q || '').trim();

    const filter = {};
    if (status) filter.status = status;
    if (moderationState) filter.moderationState = moderationState;
    if (lifecycle) filter.lifecycle = lifecycle;
    if (q) filter.$text = { $search: q };

    const [products, total] = await Promise.all([
      CatalogProduct.find(filter)
        .sort('-updatedAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      CatalogProduct.countDocuments(filter),
    ]);

    let countsByProduct = {};
    if (products.length) {
      const ids = products.map((p) => p._id);
      const counts = await CatalogVariant.aggregate([
        { $match: { catalogProduct: { $in: ids } } },
        { $group: { _id: '$catalogProduct', count: { $sum: 1 } } },
      ]);
      countsByProduct = counts.reduce((acc, doc) => {
        acc[doc._id.toString()] = doc.count;
        return acc;
      }, {});
    }

    const items = products.map((product) => ({
      ...product,
      variantCount: countsByProduct[product._id.toString()] || 0,
    }));

    res.json({
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
}

export async function adminGetCatalogProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid catalog product id' });
    }

    const product = await CatalogProduct.findById(id).lean();
    if (!product) return res.status(404).json({ error: 'Catalog product not found' });

    const variants = await CatalogVariant.find({ catalogProduct: product._id })
      .sort('createdAt')
      .lean();

    res.json({ product, variants });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateCatalogProduct(req, res, next) {
  try {
    const {
      name,
      slug,
      description,
      brand,
      categories = [],
      images = [],
      attributes = {},
      status = 'draft',
      moderationState = 'pending',
      lifecycle = 'active',
      metadata = {},
      variants = [],
    } = req.body || {};

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ error: 'variants must include at least one variant' });
    }

    const normalizedVariants = normalizeVariantPayload(variants);

    let finalSlug = (slug && slugify(slug)) || slugify(name);
    const baseSlug = finalSlug;
    let suffix = 1;
    while (await CatalogProduct.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${suffix++}`;
    }

    const productDoc = await CatalogProduct.create({
      name,
      slug: finalSlug,
      description,
      brand,
      categories,
      images,
      attributes,
      status,
      moderationState,
      lifecycle,
      metadata,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    let createdVariants = [];
    try {
      createdVariants = await CatalogVariant.insertMany(
        normalizedVariants.map((variant) => ({
          ...variant,
          catalogProduct: productDoc._id,
        }))
      );
    } catch (variantError) {
      await CatalogProduct.findByIdAndDelete(productDoc._id);
      throw variantError;
    }

    res.status(201).json({
      product: productDoc.toObject(),
      variants: createdVariants.map((doc) => doc.toObject()),
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return res.status(409).json({ error: 'slug already in use' });
    }
    if (error?.code === 11000 && error?.keyPattern?.sku) {
      return res.status(409).json({ error: 'sku already in use' });
    }
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}

export async function adminUpdateCatalogProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...(req.body || {}) };

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid catalog product id' });
    }

    if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
    if (updates.slug) {
      updates.slug = slugify(updates.slug);
      const exists = await CatalogProduct.findOne({ slug: updates.slug, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'slug already in use' });
    }

    updates.updatedBy = req.user?._id;

    const product = await CatalogProduct.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) return res.status(404).json({ error: 'Catalog product not found' });

    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateCatalogVariant(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid variant id' });
    }

    const updates = { ...(req.body || {}) };

    if (updates.sku) {
      updates.sku = updates.sku.trim();
      const exists = await CatalogVariant.findOne({ sku: updates.sku, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'sku already in use' });
    }

    const variant = await CatalogVariant.findById(id);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    if (updates.title !== undefined) variant.title = updates.title;
    if (updates.status) variant.status = updates.status;
    if (updates.barcode !== undefined) variant.barcode = updates.barcode;
    if (updates.options) variant.options = updates.options;
    if (updates.attributes) variant.attributes = updates.attributes;
    if (updates.metadata) variant.metadata = updates.metadata;
    if (updates.sku) variant.sku = updates.sku;

    if (updates.pricing) {
      const nextPricing = { ...(variant.pricing?.toObject?.() || variant.pricing || {}) };
      if (updates.pricing.currency) nextPricing.currency = updates.pricing.currency;
      if (updates.pricing.listPrice != null) nextPricing.listPrice = Number(updates.pricing.listPrice);
      if (updates.pricing.compareAtPrice !== undefined) {
        nextPricing.compareAtPrice = updates.pricing.compareAtPrice;
      }
      if (updates.pricing.minRetailPrice !== undefined) {
        nextPricing.minRetailPrice = updates.pricing.minRetailPrice;
      }
      if (updates.pricing.maxRetailPrice !== undefined) {
        nextPricing.maxRetailPrice = updates.pricing.maxRetailPrice;
      }
      if (nextPricing.listPrice == null) {
        return res.status(400).json({ error: 'pricing.listPrice is required' });
      }
      variant.pricing = nextPricing;
    }

    await variant.save();

    res.json({ variant: variant.toObject() });
  } catch (error) {
    next(error);
  }
}

export async function adminDeleteCatalogVariant(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid variant id' });
    }

    const variant = await CatalogVariant.findById(id);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    await CatalogVariant.deleteOne({ _id: variant._id });
    await SellerListing.updateMany(
      { 'offers.variant': variant._id },
      { $pull: { offers: { variant: variant._id } } }
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
