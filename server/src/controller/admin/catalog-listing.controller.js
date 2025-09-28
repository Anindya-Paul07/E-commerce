import mongoose from 'mongoose';
import SellerListing from '../../model/seller-listing.model.js';
import CatalogProduct from '../../model/catalog-product.model.js';
import Seller from '../../model/seller.model.js';
import { normalizeOffersForProduct, populateListing } from '../../lib/catalog-listing.utils.js';

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

export async function adminListCatalogListings(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.moderationState) filter.moderationState = req.query.moderationState;

    if (req.query.seller) {
      if (!isValidObjectId(req.query.seller)) {
        return res.status(400).json({ error: 'Invalid seller filter' });
      }
      filter.seller = req.query.seller;
    }

    if (req.query.catalogProduct) {
      if (!isValidObjectId(req.query.catalogProduct)) {
        return res.status(400).json({ error: 'Invalid catalogProduct filter' });
      }
      filter.catalogProduct = req.query.catalogProduct;
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

export async function adminGetCatalogListing(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await populateListing(SellerListing.findById(id)).lean();
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    res.json({ listing });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateCatalogListing(req, res, next) {
  try {
    const {
      sellerId,
      catalogProductId,
      status = 'draft',
      moderationState = 'pending',
      moderationNotes,
      titleOverride,
      descriptionOverride,
      offers = [],
      logistics = {},
      metadata = {},
    } = req.body || {};

    if (!sellerId || !catalogProductId) {
      return res.status(400).json({ error: 'sellerId and catalogProductId are required' });
    }
    if (!isValidObjectId(sellerId) || !isValidObjectId(catalogProductId)) {
      return res.status(400).json({ error: 'sellerId and catalogProductId must be valid ids' });
    }

    const [seller, product] = await Promise.all([
      Seller.findById(sellerId).select('_id status'),
      CatalogProduct.findById(catalogProductId).select('_id status moderationState'),
    ]);

    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    if (!product) return res.status(404).json({ error: 'Catalog product not found' });

    const normalizedOffers = await normalizeOffersForProduct(offers, product._id);

    try {
      const listing = await SellerListing.create({
        seller: seller._id,
        catalogProduct: product._id,
        status,
        moderationState,
        moderationNotes,
        titleOverride,
        descriptionOverride,
        offers: normalizedOffers,
        logistics,
        metadata,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
      });

      const hydrated = await populateListing(SellerListing.findById(listing._id)).lean();
      res.status(201).json({ listing: hydrated });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ error: 'Listing already exists for seller and product' });
      }
      throw error;
    }
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}

export async function adminUpdateCatalogListing(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await SellerListing.findById(id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const {
      status,
      moderationState,
      moderationNotes,
      titleOverride,
      descriptionOverride,
      offers,
      logistics,
      metadata,
    } = req.body || {};

    if (status) listing.status = status;
    if (moderationState) listing.moderationState = moderationState;
    if (moderationNotes !== undefined) listing.moderationNotes = moderationNotes;
    if (titleOverride !== undefined) listing.titleOverride = titleOverride;
    if (descriptionOverride !== undefined) listing.descriptionOverride = descriptionOverride;
    if (metadata) listing.metadata = metadata;
    if (logistics) {
      const currentLogistics = listing.logistics?.toObject?.() || listing.logistics || {};
      listing.logistics = { ...currentLogistics, ...logistics };
    }

    if (offers) {
      const normalizedOffers = await normalizeOffersForProduct(offers, listing.catalogProduct);
      listing.offers = normalizedOffers;
    }

    listing.updatedBy = req.user?._id;
    await listing.save();

    const hydrated = await populateListing(SellerListing.findById(listing._id)).lean();
    res.json({ listing: hydrated });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}

export async function adminDeleteCatalogListing(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await SellerListing.findById(id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    await SellerListing.deleteOne({ _id: listing._id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
