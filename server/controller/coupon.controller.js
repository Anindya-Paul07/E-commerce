import Coupon from '../model/coupon.model.js';

function parseDate(value, field) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field}`);
  }
  return date;
}

function normalizeLimit(value) {
  if (value === '' || value == null) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return Math.floor(numeric);
}

function sanitizePayload(body = {}) {
  const code = String(body.code || '').trim().toUpperCase();
  if (!code) throw new Error('Coupon code is required');

  const status = String(body.status || 'active').trim().toLowerCase();
  if (!['active', 'inactive'].includes(status)) throw new Error('Invalid coupon status');

  const discountType = body.discountType;
  if (!['percentage', 'fixed'].includes(discountType)) throw new Error('Invalid discount type');

  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Discount value must be greater than zero');
  }
  if (discountType === 'percentage' && discountValue > 100) {
    throw new Error('Percentage discount cannot exceed 100');
  }

  let minimumSubtotal = Number(body.minimumSubtotal);
  if (!Number.isFinite(minimumSubtotal) || minimumSubtotal < 0) {
    minimumSubtotal = 0;
  }

  const maxRedemptions = normalizeLimit(body.maxRedemptions);
  const perUserLimit = normalizeLimit(body.perUserLimit);
  const startAt = parseDate(body.startAt, 'start date');
  const endAt = parseDate(body.endAt, 'end date');

  if (startAt && endAt && startAt > endAt) {
    throw new Error('Start date must be before end date');
  }

  return {
    code,
    description: body.description?.trim() || '',
    status,
    discountType,
    discountValue,
    minimumSubtotal,
    maxRedemptions,
    perUserLimit,
    startAt,
    endAt,
  };
}

export async function adminListCoupons(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const status = (req.query.status || '').trim();
    const q = (req.query.q || '').trim();
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.code = { $regex: q, $options: 'i' };
    const [items, total] = await Promise.all([
      Coupon.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit),
      Coupon.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function adminGetCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ coupon });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateCoupon(req, res, next) {
  try {
    const payload = sanitizePayload(req.body);
    payload.createdBy = req.user?._id;
    payload.updatedBy = req.user?._id;
    const coupon = await Coupon.create(payload);
    res.status(201).json({ coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    next(error);
  }
}

export async function adminUpdateCoupon(req, res, next) {
  try {
    const payload = sanitizePayload(req.body);
    payload.updatedBy = req.user?._id;
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }
    next(error);
  }
}

export async function adminDeleteCoupon(req, res, next) {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
