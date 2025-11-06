import Coupon from '../model/coupon.model.js'
import Order from '../model/order.model.js'

export function normalizeCode(code) {
  return (code || '').trim().toUpperCase()
}

export function computeDiscountAmount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0
  let discount = 0
  if (coupon.type === 'percent') {
    discount = (subtotal * coupon.amount) / 100
  } else {
    discount = coupon.amount
  }
  if (coupon.maxDiscountValue != null) {
    discount = Math.min(discount, coupon.maxDiscountValue)
  }
  return Math.max(0, Math.min(discount, subtotal))
}

export async function validateCouponForUser({ coupon, userId, subtotal }) {
  if (!coupon) return { ok: false, reason: 'coupon_not_found' }
  const now = new Date()
  if (coupon.status !== 'active') return { ok: false, reason: 'coupon_inactive' }
  if (coupon.startsAt && now < coupon.startsAt) return { ok: false, reason: 'coupon_not_started' }
  if (coupon.expiresAt && now > coupon.expiresAt) return { ok: false, reason: 'coupon_expired' }
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, reason: 'coupon_limit_reached' }
  }
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return { ok: false, reason: 'subtotal_too_low' }
  }
  if (coupon.perUserLimit && userId) {
    const used = await Order.countDocuments({ 'coupon.couponId': coupon._id, user: userId })
    if (used >= coupon.perUserLimit) return { ok: false, reason: 'coupon_per_user_limit' }
  }
  const discount = computeDiscountAmount(coupon, subtotal)
  if (discount <= 0) return { ok: false, reason: 'no_discount' }
  return { ok: true, discount }
}

export async function loadCouponByCode(code) {
  if (!code) return null
  return Coupon.findOne({ code: normalizeCode(code) })
}

export function couponReasonToMessage(reason, couponDoc) {
  switch (reason) {
    case 'coupon_not_found':
      return 'Coupon not found';
    case 'coupon_inactive':
      return 'Coupon is not active right now';
    case 'coupon_not_started':
      return 'Coupon is not available yet';
    case 'coupon_expired':
      return 'Coupon has expired';
    case 'coupon_limit_reached':
      return 'Coupon usage limit reached';
    case 'subtotal_too_low':
      return couponDoc?.minSubtotal
        ? `Cart subtotal must be at least ${couponDoc.minSubtotal.toFixed(2)} to use this coupon`
        : 'Cart subtotal is too low to use this coupon';
    case 'coupon_per_user_limit':
      return 'You have already used this coupon the maximum number of times';
    case 'no_discount':
      return 'Coupon does not apply to this cart';
    default:
      return 'Coupon cannot be applied';
  }
}
