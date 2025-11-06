import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../model/user.model.js';
import Product from '../model/product.model.js';
import Coupon from '../model/coupon.model.js';
import Cart from '../model/cart.model.js';
import Order from '../model/order.model.js';
import { receiveStock } from '../controller/inventory.controller.js';
import { ENV } from '../config/env.js';

let mongo;
let token;
let user;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'checkout-coupon-test' });

  user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed',
    roles: ['customer'],
  });
  token = jwt.sign({ sub: user._id }, ENV.JWT_SECRET, { expiresIn: '1h' });
});

afterEach(async () => {
  await Cart.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Coupon.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Checkout with coupon', () => {
  test('applies coupon during checkout and increments redemption count', async () => {
    const product = await Product.create({
      title: 'Test product',
      slug: 'test-product',
      price: 100,
      status: 'active',
    });

    await receiveStock({ productId: product._id, qty: 10, reason: 'seed' });

    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      status: 'active',
      minimumSubtotal: 20,
    });

    await request(app)
      .post('/api/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: product._id, qty: 2 })
      .expect(201);

    const applyRes = await request(app)
      .post('/api/cart/coupon')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'WELCOME10' })
      .expect(200);

    expect(applyRes.body.discount).toBeCloseTo(20);

    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    expect(checkoutRes.body.order.subtotal).toBeCloseTo(200);
    expect(checkoutRes.body.order.discountTotal).toBeCloseTo(20);
    expect(checkoutRes.body.order.total).toBeCloseTo(180);
    expect(checkoutRes.body.order.coupon.code).toBe('WELCOME10');

    const couponDoc = await Coupon.findOne({ code: 'WELCOME10' });
    expect(couponDoc.redemptionCount).toBe(1);
  });
});
