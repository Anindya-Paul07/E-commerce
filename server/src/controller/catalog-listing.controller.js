import mongoose from 'mongoose';
import SellerListing from '../model/seller-listing.model.js';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import Category from '../model/category.model.js';

const { ObjectId } = mongoose.Types;

function defaultListingFilter(query = {}) {
  const filter = {
    status: 'active',
    moderationState: 'approved',
  };
  if (query.status) filter.status = query.status;
  if (query.moderationState) filter.moderationState = query.moderationState;
  return filter;
}

function populateListing(query) {
  return query
    .populate('seller', 'displayName slug status')
    .populate('catalogProduct', 'name slug brand images attributes')
    .populate('offers.variant', 'sku title status pricing');
}

export async function publicListCatalogListings(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);

    const filter = defaultListingFilter(req.query);

    if (req.query.seller && ObjectId.isValid(req.query.seller)) {
      filter.seller = new ObjectId(req.query.seller);
    }

    if (req.query.catalogProduct && ObjectId.isValid(req.query.catalogProduct)) {
      filter.catalogProduct = new ObjectId(req.query.catalogProduct);
    }

    if (req.query.slug) {
      const product = await CatalogProduct.findOne({ slug: req.query.slug }).select('_id');
      if (!product) return res.json({ items: [], total: 0, page, pages: 0 });
      filter.catalogProduct = product._id;
    }

    if (req.query.q) {
      const text = req.query.q.trim();
      if (text) {
        const candidates = await CatalogProduct.find({ $text: { $search: text } }).select('_id');
        if (!candidates.length) {
          return res.json({ items: [], total: 0, page, pages: 0 });
        }
        filter.catalogProduct = { $in: candidates.map((doc) => doc._id) };
      }
    }

    if (req.query.category) {
      let categoryId = null;
      if (ObjectId.isValid(req.query.category)) {
        categoryId = new ObjectId(req.query.category);
      } else {
        const category = await Category.findOne({ slug: req.query.category }).select('_id');
        if (category) categoryId = category._id;
      }

      if (!categoryId) {
        return res.json({ items: [], total: 0, page, pages: 0 });
      }

      const catalogueProducts = await CatalogProduct.find({
        categories: categoryId,
        status: 'active',
        moderationState: 'approved',
      }).select('_id');

      if (!catalogueProducts.length) {
        return res.json({ items: [], total: 0, page, pages: 0 });
      }

      const ids = catalogueProducts.map((doc) => doc._id);

      if (filter.catalogProduct) {
        if (filter.catalogProduct.$in) {
          const allowed = new Set(filter.catalogProduct.$in.map((value) => value.toString()));
          const intersection = ids.filter((id) => allowed.has(id.toString()));
          if (!intersection.length) return res.json({ items: [], total: 0, page, pages: 0 });
          filter.catalogProduct = { $in: intersection };
        } else {
          const allowed = new Set([filter.catalogProduct.toString()]);
          const intersection = ids.filter((id) => allowed.has(id.toString()));
          if (!intersection.length) return res.json({ items: [], total: 0, page, pages: 0 });
          filter.catalogProduct = { $in: intersection };
        }
      } else {
        filter.catalogProduct = { $in: ids };
      }
    }

    const [items, total] = await Promise.all([
      populateListing(
        SellerListing.find(filter)
          .sort('-updatedAt')
          .skip((page - 1) * limit)
          .limit(limit)
      ).lean(),
      SellerListing.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function publicGetListingBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const productFilter = {
      slug,
      status: 'active',
      moderationState: 'approved',
      lifecycle: 'active',
    };

    const product = await CatalogProduct.findOne(productFilter).lean();
    if (!product) return res.status(404).json({ error: 'Catalog product not found' });

    const listingFilter = defaultListingFilter(req.query);
    listingFilter.catalogProduct = product._id;

    if (req.query.seller && ObjectId.isValid(req.query.seller)) {
      listingFilter.seller = new ObjectId(req.query.seller);
    }

    const listings = await populateListing(SellerListing.find(listingFilter).sort('-updatedAt')).lean();
    const variants = await CatalogVariant.find({ catalogProduct: product._id, status: 'active' })
      .sort('createdAt')
      .lean();

    res.json({ product, listings, variants });
  } catch (error) {
    next(error);
  }
}
