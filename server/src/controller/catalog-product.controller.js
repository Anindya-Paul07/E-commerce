import mongoose from 'mongoose';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';

const { ObjectId } = mongoose.Types;

function applyDefaultFilters(filter = {}, query = {}) {
  const next = { ...filter };
  if (!query.status) next.status = 'active';
  if (!query.moderationState) next.moderationState = 'approved';
  if (!query.lifecycle) next.lifecycle = 'active';
  return next;
}

export async function publicListCatalogProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const q = (req.query.q || '').trim();

    const filter = applyDefaultFilters({}, req.query);
    if (q) filter.$text = { $search: q };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.moderationState) filter.moderationState = req.query.moderationState;
    if (req.query.lifecycle) filter.lifecycle = req.query.lifecycle;
    if (req.query.brand) filter.brand = req.query.brand;

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
        { $match: { catalogProduct: { $in: ids }, status: 'active' } },
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

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function publicGetCatalogProduct(req, res, next) {
  try {
    const { idOrSlug } = req.params;
    const filter = applyDefaultFilters({}, req.query);

    let product;
    if (ObjectId.isValid(idOrSlug)) {
      product = await CatalogProduct.findOne({ ...filter, _id: idOrSlug }).lean();
    } else {
      product = await CatalogProduct.findOne({ ...filter, slug: idOrSlug }).lean();
    }

    if (!product) return res.status(404).json({ error: 'Catalog product not found' });

    const variants = await CatalogVariant.find({
      catalogProduct: product._id,
      status: req.query.includeDraft ? { $in: ['draft', 'active', 'retired'] } : 'active',
    })
      .sort('createdAt')
      .lean();

    res.json({ product, variants });
  } catch (error) {
    next(error);
  }
}
