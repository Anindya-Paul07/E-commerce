import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  setupDatabase,
  teardownDatabase,
  resetDatabase,
  createUser,
  ensureSellerForUser,
} from './utils/test-app.js';
import { ensureDefaultWarehouse, resetDefaultWarehouseCache } from '../lib/warehouse.utils.js';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import SellerListing from '../model/seller-listing.model.js';
import WarehouseStock from '../model/warehouse-stock.model.js';
import { receiveStock, reserveForCart, releaseForCart, commitForOrder } from '../controller/inventory.controller.js';

describe('WarehouseStock operations', () => {
  let seller;
  let listing;
  let variant;
  let customer;

  beforeAll(async () => {
    await setupDatabase();
    await ensureDefaultWarehouse();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    resetDefaultWarehouseCache();
    await ensureDefaultWarehouse();

    const sellerUser = await createUser({ email: `seller-${Date.now()}@example.com`, roles: ['customer'] });
    const ensureResult = await ensureSellerForUser(sellerUser, { displayName: 'Stock Seller' });
    seller = ensureResult.seller;

    const catalogProduct = await CatalogProduct.create({
      name: 'Test Product',
      slug: `test-product-${Date.now()}`,
      brand: 'Acme',
      status: 'active',
      moderationState: 'approved',
      lifecycle: 'active',
      attributes: { color: 'red' },
    });

    variant = await CatalogVariant.create({
      catalogProduct: catalogProduct._id,
      sku: `SKU-${Date.now()}`,
      status: 'active',
      pricing: { currency: 'USD', listPrice: 25 },
    });

    listing = await SellerListing.create({
      seller: seller._id,
      catalogProduct: catalogProduct._id,
      status: 'active',
      moderationState: 'approved',
      offers: [
        {
          variant: variant._id,
          price: 25,
          stock: 0,
        },
      ],
    });

    customer = await createUser({ email: `customer-${Date.now()}@example.com` });
  });

  it('handles receive, reserve, release and commit flows for listings', async () => {
    await receiveStock({ listingId: listing._id, catalogVariantId: variant._id, qty: 10, reason: 'restock' });

    let stockDoc = await WarehouseStock.findOne({ listing: listing._id, catalogVariant: variant._id }).lean();
    expect(stockDoc).toBeTruthy();
    expect(stockDoc.qtyOnHand).toBe(10);
    expect(stockDoc.qtyReserved).toBe(0);

    const cartId = new mongoose.Types.ObjectId();
    await reserveForCart({
      userId: customer._id,
      listingId: listing._id,
      catalogVariantId: variant._id,
      qty: 3,
      cartId,
    });

    stockDoc = await WarehouseStock.findOne({ listing: listing._id, catalogVariant: variant._id }).lean();
    expect(stockDoc.qtyOnHand).toBe(10);
    expect(stockDoc.qtyReserved).toBe(3);

    await releaseForCart({
      userId: customer._id,
      listingId: listing._id,
      catalogVariantId: variant._id,
      qty: 1,
      cartId,
    });

    stockDoc = await WarehouseStock.findOne({ listing: listing._id, catalogVariant: variant._id }).lean();
    expect(stockDoc.qtyReserved).toBe(2);

    await commitForOrder({
      orderId: new mongoose.Types.ObjectId(),
      listingId: listing._id,
      catalogVariantId: variant._id,
      qty: 2,
    });

    stockDoc = await WarehouseStock.findOne({ listing: listing._id, catalogVariant: variant._id }).lean();
    expect(stockDoc.qtyOnHand).toBe(8);
    expect(stockDoc.qtyReserved).toBe(0);
  });
});
