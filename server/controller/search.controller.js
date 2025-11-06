import Product from '../model/product.model.js';
import Category from '../model/category.model.js';
import Shop from '../model/shop.model.js';
import Seller from '../model/seller.model.js';
import { applyBoosting } from '../lib/boost.js';

const PRODUCT_LIMIT_DEFAULT = 5;
const CATEGORY_LIMIT_DEFAULT = 5;
const SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

function escapeRegex(term = '') {
  return term.replace(SPECIAL_CHARS, '\\$&');
}

function parseLimit(raw, fallback) {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 20);
}

export async function globalSearch(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ products: [], categories: [] });
    }

    const productLimit = parseLimit(req.query.productLimit || req.query.limit, PRODUCT_LIMIT_DEFAULT);
    const categoryLimit = parseLimit(req.query.categoryLimit || req.query.limit, CATEGORY_LIMIT_DEFAULT);

    const safeQuery = escapeRegex(q);

    const productTextFilter = { $text: { $search: q } };
    const productRegexFilter = { $or: [
      { title: new RegExp(safeQuery, 'i') },
      { description: new RegExp(safeQuery, 'i') },
      { brand: new RegExp(safeQuery, 'i') },
      { tags: new RegExp(safeQuery, 'i') },
    ] };

    const categoryTextFilter = { $text: { $search: q } };
    const categoryRegex = { $or: [
      { name: new RegExp(safeQuery, 'i') },
      { description: new RegExp(safeQuery, 'i') },
    ] };

    let products;
    try {
      products = await Product.find(productTextFilter)
        .select({
          title: 1,
          slug: 1,
          price: 1,
          images: 1,
          status: 1,
          score: { $meta: 'textScore' },
          boost: 1,
          seller: 1,
          shop: 1,
          createdAt: 1,
        })
        .sort({ score: { $meta: 'textScore' }, 'boost.boostScore': -1, createdAt: -1 })
        .limit(productLimit)
        .lean();
    } catch (error) {
      products = await Product.find(productRegexFilter)
        .select('title slug price images status boost seller shop createdAt')
        .sort({ 'boost.boostScore': -1, createdAt: -1 })
        .limit(productLimit)
        .lean();
    }

    const boostedProducts = await applyBoosting(products);

    const sellerIds = Array.from(new Set(boostedProducts.map((p) => p.seller).filter(Boolean)));
    const shopIds = Array.from(new Set(boostedProducts.map((p) => p.shop).filter(Boolean)));

    const [sellerDocs, shopDocs, categories] = await Promise.all([
      sellerIds.length
        ? Seller.find({ _id: { $in: sellerIds } })
            .select('displayName status verificationStatus metrics.ratingAverage metrics.ratingCount slug')
            .lean()
        : [],
      shopIds.length
        ? Shop.find({ _id: { $in: shopIds } })
            .select('name slug status metrics.boostedScore metrics.visits30d metrics.conversionRate settings.country settings.currency')
            .lean()
        : [],
      Category.find(categoryTextFilter)
        .select('name slug description image score')
        .sort({ score: { $meta: 'textScore' }, sortOrder: 1 })
        .limit(categoryLimit)
        .catch(async () => Category.find(categoryRegex).limit(categoryLimit)),
    ]);

    const sellerMap = new Map(sellerDocs.map((seller) => [seller._id.toString(), seller]));
    const shopMap = new Map(shopDocs.map((shop) => [shop._id.toString(), shop]));

    const enrichedProducts = boostedProducts.map((product) => ({
      ...product,
      sellerInfo: product.seller ? sellerMap.get(product.seller.toString()) || null : null,
      shopInfo: product.shop ? shopMap.get(product.shop.toString()) || null : null,
    }));

    res.json({ products: enrichedProducts, categories });
  } catch (error) {
    next(error);
  }
}
