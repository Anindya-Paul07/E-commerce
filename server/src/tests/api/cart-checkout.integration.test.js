import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  setupDatabase,
  teardownDatabase,
  resetDatabase,
  getApp,
  createUser,
  createAuthHeader,
  ensureSellerForUser,
} from '../../tests/utils/test-app.js';
import { ensureDefaultWarehouse, resetDefaultWarehouseCache } from '../../lib/warehouse.utils.js';
import CatalogProduct from '../../model/catalog-product.model.js';
import CatalogVariant from '../../model/catalog-variant.model.js';
import SellerListing from '../../model/seller-listing.model.js';
import WarehouseStock from '../../model/warehouse-stock.model.js';
import FulfillmentTask from '../../model/fulfillment-task.model.js';
import { receiveStock } from '../../controller/inventory.controller.js';

const app = () => request(getApp());

describe('Cart to checkout integration', () => {
  let listing;
  let variant;
  let seller;
  let customer;
  let customerToken;

  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    resetDefaultWarehouseCache();
    await ensureDefaultWarehouse();

    const sellerUser = await createUser({ email: `seller-${Date.now()}@example.com` });
    const ensureResult = await ensureSellerForUser(sellerUser, { displayName: 'Integration Seller' });
    seller = ensureResult.seller;

    const catalogProduct = await CatalogProduct.create({
      name: 'Integration Product',
      slug: `integration-product-${Date.now()}`,
      brand: 'Acme',
      status: 'active',
      moderationState: 'approved',
      lifecycle: 'active',
      images: ['https://example.com/image.jpg'],
    });

    variant = await CatalogVariant.create({
      catalogProduct: catalogProduct._id,
      sku: `SKU-${Date.now()}`,
      status: 'active',
      pricing: { currency: 'USD', listPrice: 30 },
    });

    listing = await SellerListing.create({
      seller: seller._id,
      catalogProduct: catalogProduct._id,
      status: 'active',
      moderationState: 'approved',
      offers: [
        {
          variant: variant._id,
          price: 30,
          stock: 0,
        },
      ],
    });

    await receiveStock({ listingId: listing._id, catalogVariantId: variant._id, qty: 5, reason: 'initial_load' });

    customer = await createUser({ email: `customer-${Date.now()}@example.com` });
    customerToken = createAuthHeader(customer);
  });

  it('reserves stock on add to cart and commits on checkout', async () => {
    const addResponse = await app()
      .post('/api/cart/add')
      .set('Authorization', customerToken)
      .send({ listingId: listing._id.toString(), variantId: variant._id.toString(), qty: 2 })
      .expect(201);

    expect(addResponse.body.cart.items).toHaveLength(1);

    let stockDoc = await WarehouseStock.findOne({ listing: listing._id, catalogVariant: variant._id }).lean();
    expect(stockDoc.qtyOnHand).toBe(5);
    expect(stockDoc.qtyReserved).toBe(2);

    const checkoutResponse = await app()
      .post('/api/orders/checkout')
      .set('Authorization', customerToken)
      .send({
        shippingAddress: {
          fullName: 'Customer One',
          line1: '123 Main St',
          city: 'Townsville',
          postalCode: '12345',
          country: 'US',
        },
      })
      .expect(201);

    const orderId = checkoutResponse.body.order?._id;
    expect(orderId).toBeTruthy();

    stockDoc = await WarehouseStock.findOne({ listing: listing._id, catalogVariant: variant._id }).lean();
    expect(stockDoc.qtyOnHand).toBe(3);
    expect(stockDoc.qtyReserved).toBe(0);

    const task = await FulfillmentTask.findOne({ order: orderId }).lean();
    expect(task).toBeTruthy();
    expect(String(task.listing)).toBe(String(listing._id));
    expect(String(task.catalogVariant)).toBe(String(variant._id));
    expect(task.metadata?.qty).toBe(2);
  });
});
