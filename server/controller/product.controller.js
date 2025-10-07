import Product from '../model/product.model.js';
import Category from '../model/category.model.js';
import Variant from '../model/variant.model.js';
import InventoryItem from '../model/inventoryItem.model.js';
import { ensureDefaultVariantForProduct, receiveStock } from './inventory.controller.js';
import { queueProductIndex, removeProductFromIndex } from '../search/indexer.js';
import { mapUploadedFiles, cleanupReplacedUploads, removeUploads } from '../lib/upload.js';

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseImagesInput(value) {
  if (typeof value === 'undefined' || value === null) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => String(entry || '').trim())
          .filter(Boolean);
      }
    } catch (error) {
      // ignore and fallback to comma split
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

function parseArrayInput(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => String(entry || '').trim()).filter(Boolean);
      }
    } catch (error) {
      // ignore and fallback to comma split
    }
    return trimmed
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10), 1), 48);
    const q = (req.query.q || '').trim();
    const status = req.query.status || 'active';
    const sort = req.query.sort || '-createdAt';

    const filter = {};
    const cat = (req.query.category || '').trim();
    if (cat) {
      let catId = null;
      if (/^[0-9a-fA-F]{24}$/.test(cat)) catId = cat;
      else {
        const categoryDoc = await Category.findOne({ slug: cat });
        if (categoryDoc) catId = categoryDoc._id;
      }
      if (catId) filter.categories = catId;
    }

    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug;
    const byId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const product = await (byId ? Product.findById(idOrSlug) : Product.findOne({ slug: idOrSlug }));
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const body = req.body || {};
    const {
      title,
      description,
      price,
      brand,
      status = 'active',
      stock = 0,
      slug,
      compareAtPrice,
      seller,
      shop,
      visibility,
      fulfillmentMode,
      dimensions,
      compliance,
      logistics,
      commission,
      seo,
      boost,
      attributes,
      metadata,
    } = body;
    const tagsInput = body.tags;
    const categoriesInput = body.categories;
    const imagesInput = body.images;

    if (!title || price == null) {
      return res.status(400).json({ error: 'title and price are required' });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice)) {
      return res.status(400).json({ error: 'price must be a valid number' });
    }

    const parsedStock = Number(stock || 0);
    if (!Number.isFinite(parsedStock)) {
      return res.status(400).json({ error: 'stock must be a valid number' });
    }

    const parsedCompareAt =
      compareAtPrice == null || compareAtPrice === '' ? undefined : Number(compareAtPrice);
    if (parsedCompareAt !== undefined && !Number.isFinite(parsedCompareAt)) {
      return res.status(400).json({ error: 'compareAtPrice must be a valid number' });
    }

    let finalSlug = slug?.trim() || slugify(title);
    const base = finalSlug;
    let i = 1;
    while (await Product.exists({ slug: finalSlug })) {
      finalSlug = `${base}-${i++}`;
    }

    const uploadedImages = mapUploadedFiles(req.files);
    const bodyImages = parseImagesInput(imagesInput) ?? [];
    const finalImages = [...bodyImages, ...uploadedImages];

    const parsedTags = parseArrayInput(tagsInput);
    const parsedCategories = parseArrayInput(categoriesInput);

    const productPayload = {
      title,
      slug: finalSlug,
      description,
      price: parsedPrice,
      images: finalImages,
      brand,
      status,
      stock: parsedStock,
      tags: parsedTags,
      categories: parsedCategories,
      seller,
      shop,
      visibility,
      fulfillmentMode,
      dimensions,
      compliance,
      logistics,
      commission,
      seo,
      boost,
      attributes,
      metadata,
    };

    if (parsedCompareAt !== undefined) productPayload.compareAtPrice = parsedCompareAt;

    const product = await Product.create(productPayload);

    try {
      await ensureDefaultVariantForProduct(product._id);
      if (parsedStock > 0) {
        await receiveStock({ productId: product._id, qty: parsedStock, reason: 'product_create' });
      }
    } catch (inventoryError) {
      console.error('Failed to initialise inventory for product', product._id, inventoryError);
    }

    queueProductIndex(product);
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const body = { ...req.body };

    if (!body.slug && body.title) body.slug = slugify(body.title);
    if (body.slug) {
      const exists = await Product.findOne({ slug: body.slug, _id: { $ne: id } });
      if (exists) return res.status(409).json({ error: 'Slug already in use' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const previousImages = product.images || [];

    const uploadedImages = mapUploadedFiles(req.files);
    const bodyImages = parseImagesInput(body.images);
    if (typeof bodyImages !== 'undefined' || uploadedImages.length) {
      const baseImages = Array.isArray(bodyImages) ? bodyImages : [];
      product.images = [...baseImages, ...uploadedImages];
    }

    const updates = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.description !== undefined) updates.description = body.description;
    if (body.brand !== undefined) updates.brand = body.brand;
    if (body.status !== undefined) updates.status = body.status;
    if (body.visibility !== undefined) updates.visibility = body.visibility;
    if (body.fulfillmentMode !== undefined) updates.fulfillmentMode = body.fulfillmentMode;
    if (body.dimensions !== undefined) updates.dimensions = body.dimensions;
    if (body.compliance !== undefined) updates.compliance = body.compliance;
    if (body.logistics !== undefined) updates.logistics = body.logistics;
    if (body.commission !== undefined) updates.commission = body.commission;
    if (body.seo !== undefined) updates.seo = body.seo;
    if (body.boost !== undefined) updates.boost = body.boost;
    if (body.attributes !== undefined) updates.attributes = body.attributes;
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.seller !== undefined) updates.seller = body.seller;
    if (body.shop !== undefined) updates.shop = body.shop;

    if (body.price !== undefined) {
      const parsedPrice = Number(body.price);
      if (!Number.isFinite(parsedPrice)) return res.status(400).json({ error: 'price must be a valid number' });
      updates.price = parsedPrice;
    }

    if (body.compareAtPrice !== undefined) {
      if (body.compareAtPrice === '' || body.compareAtPrice === null) {
        updates.compareAtPrice = undefined;
      } else {
        const parsedCompareAt = Number(body.compareAtPrice);
        if (!Number.isFinite(parsedCompareAt)) {
          return res.status(400).json({ error: 'compareAtPrice must be a valid number' });
        }
        updates.compareAtPrice = parsedCompareAt;
      }
    }

    if (body.stock !== undefined) {
      const parsedStock = Number(body.stock);
      if (!Number.isFinite(parsedStock)) return res.status(400).json({ error: 'stock must be a valid number' });
      updates.stock = parsedStock;
    }

    if (body.tags !== undefined) {
      updates.tags = parseArrayInput(body.tags);
    }

    if (body.categories !== undefined) {
      updates.categories = parseArrayInput(body.categories);
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        product.set(key, undefined);
      } else {
        product.set(key, value);
      }
    });

    await product.save();

    await cleanupReplacedUploads(previousImages, product.images);

    queueProductIndex(product);
    res.json({ product });
  } catch (error) {
    next(error);
  }
}

export async function availability(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug;
    const byId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const product = await (byId ? Product.findById(idOrSlug) : Product.findOne({ slug: idOrSlug }));
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variants = await Variant.find({ product: product._id }, { _id: 1, sku: 1, title: 1 });
    if (!variants.length) {
      return res.json({
        product: { id: product._id, title: product.title, slug: product.slug },
        onHand: 0,
        reserved: 0,
        available: 0,
        perVariant: [],
      });
    }

    const variantIds = variants.map((variant) => variant._id);
    const items = await InventoryItem.find(
      { variant: { $in: variantIds } },
      { qtyOnHand: 1, qtyReserved: 1, variant: 1 }
    ).populate('variant', 'sku title');

    const totals = items.reduce(
      (acc, doc) => {
        acc.onHand += doc.qtyOnHand || 0;
        acc.reserved += doc.qtyReserved || 0;
        return acc;
      },
      { onHand: 0, reserved: 0 }
    );
    const available = Math.max(0, totals.onHand - totals.reserved);

    const perVariant = variants.map((variant) => {
      const related = items.filter((doc) => String(doc.variant?._id) === String(variant._id));
      const onHand = related.reduce((sum, doc) => sum + (doc.qtyOnHand || 0), 0);
      const reserved = related.reduce((sum, doc) => sum + (doc.qtyReserved || 0), 0);
      return {
        variant: { id: variant._id, sku: variant.sku, title: variant.title },
        onHand,
        reserved,
        available: Math.max(0, onHand - reserved),
      };
    });

    res.json({
      product: { id: product._id, title: product.title, slug: product.slug },
      onHand: totals.onHand,
      reserved: totals.reserved,
      available,
      perVariant,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    removeProductFromIndex(id);
    await removeUploads(product.images);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
