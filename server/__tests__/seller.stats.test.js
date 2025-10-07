import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import Seller from '../model/seller.model.js';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import SellerListing from '../model/seller-listing.model.js';
import Warehouse from '../model/warehouse.model.js';
import WarehouseStock from '../model/warehouse-stock.model.js';
import Order from '../model/order.model.js';

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('GET /api/sellers/stats', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'seller-stats-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('returns aggregated stats for the signed-in seller', async () => {
    const sellerUser = await User.create({
      email: 'seller@example.com',
      passwordHash: 'hash',
      roles: ['seller'],
    });

    const seller = await Seller.create({
      user: sellerUser._id,
      displayName: 'Demo Seller',
      slug: 'demo-seller',
      status: 'approved',
      verificationStatus: 'verified',
    });

    const catalogA = await CatalogProduct.create({
      name: 'Catalog A',
      slug: 'catalog-a',
      status: 'active',
      moderationState: 'approved',
      images: [],
    });
    const variantA = await CatalogVariant.create({
      catalogProduct: catalogA._id,
      sku: 'SKU-A',
      title: 'Variant A',
      status: 'active',
      pricing: { currency: 'USD', listPrice: 50 },
    });

    const catalogB = await CatalogProduct.create({
      name: 'Catalog B',
      slug: 'catalog-b',
      status: 'draft',
      moderationState: 'pending',
      images: [],
    });
    const variantB = await CatalogVariant.create({
      catalogProduct: catalogB._id,
      sku: 'SKU-B',
      title: 'Variant B',
      status: 'draft',
      pricing: { currency: 'USD', listPrice: 20 },
    });

    const activeListing = await SellerListing.create({
      seller: seller._id,
      catalogProduct: catalogA._id,
      titleOverride: 'Listing Active',
      status: 'active',
      moderationState: 'approved',
      offers: [{ variant: variantA._id, price: 50, stock: 10 }],
    });

    await SellerListing.create({
      seller: seller._id,
      catalogProduct: catalogB._id,
      titleOverride: 'Listing Draft',
      status: 'draft',
      moderationState: 'pending',
      offers: [{ variant: variantB._id, price: 20, stock: 0 }],
    });

    const warehouse = await Warehouse.create({
      name: 'Primary Warehouse',
      code: 'WH-1',
      isDefault: true,
      active: true,
    });

    await WarehouseStock.create({
      listing: activeListing._id,
      catalogVariant: variantA._id,
      warehouse: warehouse._id,
      qtyOnHand: 10,
      qtyReserved: 5,
      lowStockThreshold: 6,
    });

    await Order.create({
      number: 'ORD-1',
      user: sellerUser._id,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          seller: seller._id,
          title: 'Pending Item',
          price: 50,
          qty: 2,
          fulfillmentStatus: 'pending',
        },
        {
          product: new mongoose.Types.ObjectId(),
          seller: seller._id,
          title: 'Delivered Item',
          price: 30,
          qty: 1,
          fulfillmentStatus: 'delivered',
        },
      ],
      subtotal: 130,
      shipping: 0,
      tax: 0,
      total: 130,
      currency: 'USD',
    });

    await Order.create({
      number: 'ORD-2',
      user: sellerUser._id,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          seller: seller._id,
          title: 'Allocated Item',
          price: 10,
          qty: 4,
          fulfillmentStatus: 'allocated',
        },
      ],
      subtotal: 40,
      shipping: 0,
      tax: 0,
      total: 40,
      currency: 'USD',
    });

    const token = tokenFor(sellerUser);

    const res = await request(app)
      .get('/api/sellers/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.orders).toMatchObject({
      total: 2,
      itemsSold: 7,
      pendingFulfillment: 2,
      grossRevenue: 170,
    });
    expect(res.body.listings).toEqual({ total: 2, active: 1 });
    expect(res.body.inventory).toMatchObject({
      totalOnHand: 10,
      totalReserved: 5,
      lowStock: 1,
    });
  });

  it('rejects users without the seller role', async () => {
    const customer = await User.create({
      email: 'customer@example.com',
      passwordHash: 'hash',
      roles: ['customer'],
    });

    const token = tokenFor(customer);

    const res = await request(app)
      .get('/api/sellers/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.error).toBe('Forbidden');
  });
});
