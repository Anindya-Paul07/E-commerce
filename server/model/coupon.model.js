import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumSubtotal: { type: Number, default: 0, min: 0 },
    maxRedemptions: { type: Number, min: 0 },
    perUserLimit: { type: Number, min: 0 },
    startAt: { type: Date },
    endAt: { type: Date },
    redemptionCount: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });

export default mongoose.model('Coupon', couponSchema);
