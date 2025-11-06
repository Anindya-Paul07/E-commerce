import Coupon from '../model/coupon.model.js';
import Order from '../model/order.model.js';

export class CouponError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function toUpper(value = '') {
  return String(value || '').trim().toUpperCase();
}

function isWithinWindow(coupon, now) {
  if (coupon.startAt && now < coupon.startAt) return false;
  if (coupon.endAt && now > coupon.endAt) return false;
  return true;
}

function calculateDiscountAmount(coupon, subtotal) {
  if (!coupon || !Number.isFinite(subtotal) || subtotal <= 0) return 0;
  const value = Number(coupon.discountValue || 0);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (coupon.discountType === 'percentage') {
    return Math.min(subtotal, Math.max(0, (subtotal * value) / 100));
  }
  return Math.min(subtotal, value);
}

export async function evaluateCoupon({ code, userId, subtotal, now = new Date() }) {
  const normalizedCode = toUpper(code);
  if (!normalizedCode) throw new CouponError('Coupon code is required');
  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (!coupon) throw new CouponError('Coupon not found');
  if (coupon.status !== 'active') throw new CouponError('Coupon is inactive');
  if (!isWithinWindow(coupon, now)) throw new CouponError('Coupon not currently valid');
  if (coupon.minimumSubtotal && subtotal < coupon.minimumSubtotal) {
    throw new CouponError(`Minimum subtotal of ${coupon.minimumSubtotal} required`);
  }
  if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new CouponError('Coupon redemption limit reached');
  }
  if (coupon.perUserLimit) {
    const redeemedByUser = await Order.countDocuments({
      user: userId,
      'coupon.code': normalizedCode,
      status: { $ne: 'canceled' },
    });
    if (redeemedByUser >= coupon.perUserLimit) {
      throw new CouponError('Coupon usage limit reached for this account');
    }
  }
  const discountAmount = calculateDiscountAmount(coupon, subtotal);
  if (discountAmount <= 0) throw new CouponError('Coupon does not apply to this cart');
  return {
    coupon,
    amount: discountAmount,
    payload: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      amount: discountAmount,
    },
  };
}

export async function incrementRedemptionCount(couponId) {
  if (!couponId) return;
  await Coupon.findByIdAndUpdate(couponId, {
    $inc: { redemptionCount: 1 },
    $set: { updatedAt: new Date() },
  }).catch(() => {});
}

export function computeDiscountAmount(coupon, subtotal) {
  return calculateDiscountAmount(coupon, subtotal);
}
