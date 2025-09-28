import mongoose from 'mongoose';
import CatalogVariant from '../model/catalog-variant.model.js';
import SellerListing from '../model/seller-listing.model.js';

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

export async function normalizeOffersForProduct(offers = [], catalogProductId) {
  if (!Array.isArray(offers) || offers.length === 0) return [];

  const variantIds = offers
    .map((offer) => offer?.variant)
    .filter((value) => value != null)
    .map((value) => value.toString());

  if (variantIds.length !== offers.length || !variantIds.every(isValidObjectId)) {
    throw Object.assign(new Error('offers.variant must contain valid ids'), { statusCode: 400 });
  }

  const variants = await CatalogVariant.find({
    _id: { $in: variantIds },
    catalogProduct: catalogProductId,
  }).lean();

  if (variants.length !== variantIds.length) {
    throw Object.assign(new Error('All variants must belong to the catalog product'), {
      statusCode: 400,
    });
  }

  const variantIdsSet = new Set();
  const variantMap = variants.reduce((acc, doc) => {
    acc[doc._id.toString()] = doc;
    return acc;
  }, {});

  return offers.map((offer) => {
    const variantKey = offer.variant.toString();
    if (variantIdsSet.has(variantKey)) {
      throw Object.assign(new Error('Duplicate variant in offers payload'), { statusCode: 400 });
    }
    variantIdsSet.add(variantKey);

    if (offer.price == null || Number.isNaN(Number(offer.price))) {
      throw Object.assign(new Error('offer.price is required for each variant'), {
        statusCode: 400,
      });
    }

    const payload = {
      variant: variantMap[variantKey]._id,
      price: Number(offer.price),
      compareAtPrice:
        offer.compareAtPrice != null ? Number(offer.compareAtPrice) : null,
      stock: offer.stock != null ? Number(offer.stock) : 0,
      inventoryPolicy: offer.inventoryPolicy || 'track',
      leadTimeDays: offer.leadTimeDays != null ? Number(offer.leadTimeDays) : 0,
    };

    if (!['track', 'dont_track'].includes(payload.inventoryPolicy)) {
      payload.inventoryPolicy = 'track';
    }

    if (payload.stock < 0) payload.stock = 0;
    if (payload.leadTimeDays < 0) payload.leadTimeDays = 0;

    return payload;
  });
}

export function populateListing(query, { includeSeller = true } = {}) {
  const baseQuery = includeSeller
    ? query.populate('seller', 'displayName slug status')
    : query;

  return baseQuery
    .populate('catalogProduct', 'name slug status moderationState')
    .populate('offers.variant', 'sku status pricing');
}

export function listSellerListings({ sellerId, filter = {}, page = 1, limit = 20 }) {
  const query = { ...filter, seller: sellerId };
  const skip = (page - 1) * limit;
  return Promise.all([
    populateListing(
      SellerListing.find(query)
        .sort('-updatedAt')
        .skip(skip)
        .limit(limit),
      { includeSeller: false }
    ).lean(),
    SellerListing.countDocuments(query),
  ]);
}
