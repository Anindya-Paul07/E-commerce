import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import Product from '../model/product.model.js';
import Seller from '../model/seller.model.js';
import SellerListing from '../model/seller-listing.model.js';
import CatalogProduct from '../model/catalog-product.model.js';
import CatalogVariant from '../model/catalog-variant.model.js';
import WarehouseStock from '../model/warehouse-stock.model.js';
import Cart from '../model/cart.model.js';
import { receiveStock } from '../controller/inventory.controller.js';
import { ensureDefaultWarehouse, resetDefaultWarehouseCache } from '../lib/warehouse.utils.js';

function tokenFor(user, roles = user.roles || ['customer']) {
  return jwt.sign({ sub: user._id.toString(), roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Cart controller with catalog listings', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'cart-controller-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    resetDefaultWarehouseCache();
  });

  async function createCustomer(email = 'customer@example.com') {
    return User.create({ email, passwordHash: 'test', roles: ['customer'] });
  }

  async function createActiveProduct({ title = 'Test Product', price = 19.99 } = {}) {
    const product = await Product.create({
      title,
      slug: slugify(title),
      price,
      status: 'active',
      stock: 0,
      visibility: 'public',
      images: ['https://cdn.example.com/product.jpg'],
    });
    await receiveStock({ productId: product._id, qty: 50, reason: 'test_seed' });
    return product;
  }

  async function createActiveListing({
    sku = 'SKU-1',
    price = 24.99,
    sellerEmail = 'seller@example.com',
  } = {}) {
    const catalogProduct = await CatalogProduct.create({
      name: 'Catalog Item',
      slug: slugify(`catalog-${sku}`),
      status: 'active',
      moderationState: 'approved',
      images: ['https://cdn.example.com/catalog.jpg'],
    });

    const variant = await CatalogVariant.create({
      catalogProduct: catalogProduct._id,
      sku,
      title: 'Default',
      status: 'active',
      pricing: { currency: 'USD', listPrice: price },
    });

    const sellerUser = await User.create({ email: sellerEmail, passwordHash: 'test', roles: ['seller'] });
    const seller = await Seller.create({
      user: sellerUser._id,
      displayName: slugify(sellerEmail),
      slug: slugify(`shop-${sellerEmail}`),
      status: 'approved',
      verificationStatus: 'verified',
    });

    const listing = await SellerListing.create({
      seller: seller._id,
      catalogProduct: catalogProduct._id,
      titleOverride: 'Catalog Listing',
      status: 'active',
      moderationState: 'approved',
      offers: [{
        variant: variant._id,
        price,
        stock: 10,
      }],
    });

    const warehouseId = await ensureDefaultWarehouse();
    await WarehouseStock.increaseOnHand({
      listingId: listing._id,
      catalogVariantId: variant._id,
      warehouseId,
      qty: 40,
    });

    return { listing, variant, catalogProduct };
  }

  test('adds a product to the cart for a single seller flow', async () => {
    const customer = await createCustomer();
    const product = await createActiveProduct();

    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ productId: product._id.toString(), qty: 2 })
      .expect(201);

    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].product).toBe(product._id.toString());
    expect(res.body.cart.items[0].qty).toBe(2);

    const cart = await Cart.findOne({ user: customer._id }).lean();
    expect(cart.items[0].product.toString()).toBe(product._id.toString());
  });

  test('supports multi-vendor carts mixing products and catalog listings', async () => {
    const customer = await createCustomer('multi@example.com');
    const product = await createActiveProduct({ title: 'Platform Product', price: 15 });
    const { listing, variant } = await createActiveListing({ sku: 'CAT-123', sellerEmail: 'seller2@example.com' });

    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ productId: product._id.toString(), qty: 1 })
      .expect(201);

    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ listingId: listing._id.toString(), variantId: variant._id.toString(), qty: 3 })
      .expect(201);

    const cart = await Cart.findOne({ user: customer._id }).lean();
    expect(cart.items).toHaveLength(2);
    const listingItem = cart.items.find((item) => item.listing);
    expect(listingItem.listing.toString()).toBe(listing._id.toString());
    expect(listingItem.qty).toBe(3);
  });

  test('updates listing quantity through dedicated route', async () => {
    const customer = await createCustomer('update@example.com');
    const { listing, variant } = await createActiveListing({ sku: 'UPD-1', sellerEmail: 'seller3@example.com' });

    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ listingId: listing._id.toString(), variantId: variant._id.toString(), qty: 2 })
      .expect(201);

    const patchRes = await request(app)
      .patch(`/api/cart/item/listing/${listing._id.toString()}/${variant._id.toString()}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ qty: 5 })
      .expect(200);

    expect(patchRes.body.cart.items[0].qty).toBe(5);

    const cart = await Cart.findOne({ user: customer._id }).lean();
    expect(cart.items[0].qty).toBe(5);
  });

  test('rejects catalog listing when variant is inactive', async () => {
    const customer = await createCustomer('inactive@example.com');

    const catalogProduct = await CatalogProduct.create({
      name: 'Inactive Variant Product',
      slug: 'inactive-variant-product',
      status: 'active',
      moderationState: 'approved',
      images: ['https://cdn.example.com/inactive.jpg'],
    });

    const variant = await CatalogVariant.create({
      catalogProduct: catalogProduct._id,
      sku: 'INACTIVE-1',
      title: 'Inactive',
      status: 'draft',
      pricing: { currency: 'USD', listPrice: 9.99 },
    });

    const sellerUser = await User.create({ email: 'inactive-seller@example.com', passwordHash: 'test', roles: ['seller'] });
    const seller = await Seller.create({
      user: sellerUser._id,
      displayName: 'Inactive Seller',
      slug: 'inactive-seller',
      status: 'approved',
      verificationStatus: 'verified',
    });

    const listing = await SellerListing.create({
      seller: seller._id,
      catalogProduct: catalogProduct._id,
      status: 'active',
      moderationState: 'approved',
      offers: [{ variant: variant._id, price: 12.5, stock: 5 }],
    });

    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ listingId: listing._id.toString(), variantId: variant._id.toString(), qty: 1 })
      .expect(400);

    expect(res.body.error).toBe('catalog_variant_not_active');
  });
});

function slugify(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
