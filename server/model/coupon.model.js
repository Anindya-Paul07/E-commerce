import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  startsAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  minSubtotal: { type: Number, default: 0, min: 0 },
  maxRedemptions: { type: Number, default: null, min: 1 },
  redemptionCount: { type: Number, default: 0, min: 0 },
  perUserLimit: { type: Number, default: 0, min: 0 },
  maxDiscountValue: { type: Number, default: null, min: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

couponSchema.methods.activeNow = function () {
  const now = new Date()
  if (this.status !== 'active') return false
  if (this.startsAt && now < this.startsAt) return false
  if (this.expiresAt && now > this.expiresAt) return false
  if (this.maxRedemptions != null && this.redemptionCount >= this.maxRedemptions) return false
  return true
}

export default mongoose.model('Coupon', couponSchema)
