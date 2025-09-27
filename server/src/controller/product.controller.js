import Product from "../model/product.model.js";
import Category from "../model/category.model.js";
import { queueProductIndex, removeProductFromIndex } from "../search/indexer.js";

function slugify(s) {
  return s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "12", 10), 1),
      48
    );
    const q = (req.query.q || "").trim();
    const status = req.query.status || "active";
    const sort = req.query.sort || "-createdAt";

    const filter = {};
    const cat = (req.query.category || "").trim(); // id or slug
    if (cat) {
      let catId = null;
      if (/^[0-9a-fA-F]{24}$/.test(cat)) catId = cat;
      else {
        const c = await Category.findOne({ slug: cat });
        if (c) catId = c._id;
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
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const idOrSlug = req.params.idOrSlug;
    const byId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const product = await (byId
      ? Product.findById(idOrSlug)
      : Product.findOne({ slug: idOrSlug }));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const {
      title,
      description,
      price,
      images = [],
      brand,
      status = "active",
      stock = 0,
      tags = [],
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
    } = req.body || {};
    if (!title || price == null)
      return res.status(400).json({ error: "title and price are required" });

    let finalSlug = slug?.trim() || slugify(title);
    let base = finalSlug,
      i = 1;
    while (await Product.exists({ slug: finalSlug }))
      finalSlug = `${base}-${i++}`;

    const product = await Product.create({
      title,
      slug: finalSlug,
      description,
      price,
      compareAtPrice,
      images,
      brand,
      status,
      stock,
      tags,
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
    });
    queueProductIndex(product);
    res.status(201).json({ product });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.title && !updates.slug) updates.slug = slugify(updates.title);
    if (updates.slug) {
      const exists = await Product.findOne({
        slug: updates.slug,
        _id: { $ne: id },
      });
      if (exists) return res.status(409).json({ error: "Slug already in use" });
    }
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) return res.status(404).json({ error: "Product not found" });
    queueProductIndex(product);
    res.json({ product });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    removeProductFromIndex(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
