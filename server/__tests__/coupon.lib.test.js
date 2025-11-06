import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Coupon from '../model/coupon.model.js';
import Order from '../model/order.model.js';
import { evaluateCoupon, CouponError } from '../lib/coupon.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'coupon-lib-test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('evaluateCoupon', () => {
  test('applies percentage discount', async () => {
    await Coupon.create({
      code: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      status: 'active',
    });

    const result = await evaluateCoupon({ code: 'save10', userId: new mongoose.Types.ObjectId(), subtotal: 200 });
    expect(result.amount).toBeCloseTo(20);
    expect(result.payload.code).toBe('SAVE10');
  });

  test('prevents usage beyond max redemptions', async () => {
    const coupon = await Coupon.create({
      code: 'LIMITED',
      discountType: 'fixed',
      discountValue: 15,
      maxRedemptions: 1,
      redemptionCount: 1,
    });

    await expect(
      evaluateCoupon({ code: 'limited', userId: new mongoose.Types.ObjectId(), subtotal: 100 })
    ).rejects.toThrow(CouponError);

    await coupon.deleteOne();
  });

  test('enforces per user limit using orders', async () => {
    const userId = new mongoose.Types.ObjectId();
    await Coupon.create({
      code: 'ONCE',
      discountType: 'fixed',
      discountValue: 10,
      perUserLimit: 1,
    });

    await Order.create({
      number: 'ORD-TEST-1',
      user: userId,
      items: [{ product: new mongoose.Types.ObjectId(), title: 'Test', price: 50, qty: 1 }],
      subtotal: 50,
      discountTotal: 10,
      coupon: { code: 'ONCE', discountType: 'fixed', discountValue: 10, amount: 10 },
      shipping: 0,
      tax: 0,
      total: 40,
    });

    await expect(
      evaluateCoupon({ code: 'once', userId, subtotal: 100 })
    ).rejects.toThrow('Coupon usage limit reached for this account');
  });
});
