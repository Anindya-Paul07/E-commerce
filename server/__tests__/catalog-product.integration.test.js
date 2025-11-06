import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import Seller from '../model/seller.model.js';
import SellerListing from '../model/seller-listing.model.js';
import WarehouseStock from '../model/warehouse-stock.model.js';
import Cart from '../model/cart.model.js';
import { ensureDefaultWarehouse, resetDefaultWarehouseCache } from '../lib/warehouse.utils.js';

function adminToken(userId, roles = ['admin']) {
  return jwt.sign({ sub: userId.toString(), roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Catalog product API', () => {
  let mongo;
  let adminAuthHeader;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'catalog-products-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    resetDefaultWarehouseCache();
    const admin = await User.create({
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: 'test',
      roles: ['admin'],
    });
    adminAuthHeader = `Bearer ${adminToken(admin._id)}`;
  });

  test('admin can create catalog product with variants and list it', async () => {
    const payload = {
      name: 'Test Catalog Product',
      description: 'A catalog item for testing',
      tags: ['test', 'catalog'],
      variants: [
        { sku: 'TEST-1', title: 'Default', pricing: { currency: 'USD', listPrice: 19.99 } },
      ],
      images: ['https://example.com/catalog.jpg'],
    };

    const createRes = await request(app)
      .post('/api/catalog-products')
      .set('Authorization', adminAuthHeader)
      .send(payload)
      .expect(201);

    expect(createRes.body.product).toMatchObject({ name: payload.name, slug: 'test-catalog-product' });
    expect(createRes.body.variants).toHaveLength(1);

    const listRes = await request(app)
      .get('/api/catalog-products')
      .expect(200);

    expect(listRes.body.items).toHaveLength(1);
    expect(listRes.body.items[0].name).toBe(payload.name);
  });

  test('catalog product integrates with seller listings and cart checkout flow', async () => {
    const createRes = await request(app)
      .post('/api/catalog-products')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'Hydration Pack',
        description: 'Hydration pack',
        status: 'active',
        moderationState: 'approved',
        images: ['https://cdn.test/hydration.jpg'],
        variants: [
          { sku: 'HYDRO-1', title: 'One size', pricing: { currency: 'USD', listPrice: 49.99 } },
        ],
      })
      .expect(201);

    const productId = createRes.body.product._id;
    const variantId = createRes.body.variants[0]._id;

    const catalogVariant = await CatalogVariant.findById(variantId);

    const sellerUser = await User.create({ email: 'seller@example.com', passwordHash: 'test', roles: ['seller'] });
    const seller = await Seller.create({
      user: sellerUser._id,
      displayName: 'Hydration Seller',
      slug: 'hydration-seller',
      status: 'approved',
      verificationStatus: 'verified',
    });

    const listing = await SellerListing.create({
      seller: seller._id,
      catalogProduct: productId,
      titleOverride: 'Hydration Pack Listing',
      status: 'active',
      moderationState: 'approved',
      offers: [
        {
          variant: catalogVariant._id,
          price: 59.99,
          stock: 10,
        },
      ],
    });

    const warehouseId = await ensureDefaultWarehouse();
    await WarehouseStock.increaseOnHand({
      listingId: listing._id,
      catalogVariantId: catalogVariant._id,
      warehouseId,
      qty: 20,
    });

    const customer = await User.create({ email: 'customer@example.com', passwordHash: 'test', roles: ['customer'] });
    const customerToken = adminToken(customer._id, ['customer']);

    const addRes = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ listingId: listing._id.toString(), variantId: catalogVariant._id.toString(), qty: 2 })
      .expect(201);

    expect(addRes.body.cart.items).toHaveLength(1);
    const item = addRes.body.cart.items[0];
    expect(item.title).toBe('Hydration Pack Listing');
    expect(item.image).toBe('https://cdn.test/hydration.jpg');
    expect(item.qty).toBe(2);

    const cartDoc = await Cart.findOne({ user: customer._id }).lean();
    expect(cartDoc.items[0].listing.toString()).toBe(listing._id.toString());
  });

  test('cannot delete catalog product while listings exist', async () => {
    const createRes = await request(app)
      .post('/api/catalog-products')
      .set('Authorization', adminAuthHeader)
      .send({
        name: 'Block Delete',
        variants: [{ sku: 'BLOCK-1', pricing: { currency: 'USD', listPrice: 9.99 } }],
      })
      .expect(201);

    const productId = createRes.body.product._id;
    const variantId = createRes.body.variants[0]._id;

    const sellerUser = await User.create({ email: 'seller2@example.com', passwordHash: 'test', roles: ['seller'] });
    const seller = await Seller.create({
      user: sellerUser._id,
      displayName: 'Block Seller',
      slug: 'block-seller',
      status: 'approved',
      verificationStatus: 'verified',
    });

    await SellerListing.create({
      seller: seller._id,
      catalogProduct: productId,
      status: 'active',
      moderationState: 'approved',
      offers: [{ variant: variantId, price: 9.99, stock: 5 }],
    });

    await request(app)
      .delete(`/api/catalog-products/${productId}`)
      .set('Authorization', adminAuthHeader)
      .expect(409);

    await SellerListing.deleteMany({});

    await request(app)
      .delete(`/api/catalog-products/${productId}`)
      .set('Authorization', adminAuthHeader)
      .expect(200);

    const remaining = await CatalogProduct.countDocuments();
    expect(remaining).toBe(0);
  });
});
