import mongoose from 'mongoose';
import Seller from '../model/seller.model.js';
import SellerListing from '../model/seller-listing.model.js';
import CatalogProduct from '../model/catalog-product.model.js';
import { normalizeOffersForProduct, populateListing, listSellerListings } from '../lib/catalog-listing.utils.js';

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

async function getSellerForUser(userId) {
  return Seller.findOne({ user: userId }).select('_id status');
}

export async function listMyListings(req, res, next) {
  try {
    const seller = await getSellerForUser(req.user?._id);
    if (!seller) return res.status(404).json({ error: 'Seller profile not found' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.moderationState) filter.moderationState = req.query.moderationState;

    const [items, total] = await listSellerListings({ sellerId: seller._id, filter, page, limit });

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

export async function createMyListing(req, res, next) {
  try {
    const seller = await getSellerForUser(req.user?._id);
    if (!seller) return res.status(404).json({ error: 'Seller profile not found' });

    const {
      catalogProductId,
      status = 'draft',
      titleOverride,
      descriptionOverride,
      offers = [],
      logistics = {},
      metadata = {},
    } = req.body || {};

    if (!catalogProductId || !isValidObjectId(catalogProductId)) {
      return res.status(400).json({ error: 'catalogProductId is required' });
    }

    const product = await CatalogProduct.findById(catalogProductId).select('_id status moderationState');
    if (!product) return res.status(404).json({ error: 'Catalog product not found' });

    const normalizedOffers = await normalizeOffersForProduct(offers, product._id);

    try {
      const listing = await SellerListing.create({
        seller: seller._id,
        catalogProduct: product._id,
        status,
        moderationState: 'pending',
        titleOverride,
        descriptionOverride,
        offers: normalizedOffers,
        logistics,
        metadata,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
      });

      const hydrated = await populateListing(SellerListing.findById(listing._id), {
        includeSeller: false,
      }).lean();
      res.status(201).json({ listing: hydrated });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ error: 'Listing already exists for this product' });
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

export async function updateMyListing(req, res, next) {
  try {
    const seller = await getSellerForUser(req.user?._id);
    if (!seller) return res.status(404).json({ error: 'Seller profile not found' });

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await SellerListing.findOne({ _id: id, seller: seller._id });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    const {
      status,
      titleOverride,
      descriptionOverride,
      offers,
      logistics,
      metadata,
    } = req.body || {};

    if (status) listing.status = status;
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
      listing.moderationState = 'pending';
    }

    listing.updatedBy = req.user?._id;
    await listing.save();

    const hydrated = await populateListing(SellerListing.findById(listing._id), {
      includeSeller: false,
    }).lean();
    res.json({ listing: hydrated });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
}

export async function deleteMyListing(req, res, next) {
  try {
    const seller = await getSellerForUser(req.user?._id);
    if (!seller) return res.status(404).json({ error: 'Seller profile not found' });

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await SellerListing.findOne({ _id: id, seller: seller._id });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    await SellerListing.deleteOne({ _id: listing._id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
