import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    billingInterval: {
      type: String,
      enum: ['day', 'week', 'month', 'year'],
      default: 'month',
    },
    intervalCount: { type: Number, default: 1, min: 1, max: 12 },
    trialDays: { type: Number, default: 0, min: 0, max: 90 },
    isDefault: { type: Boolean, default: false },
    isBoostPlan: { type: Boolean, default: false },
    priorityBoost: { type: Number, default: 0 },
    featureFlags: {
      featuredSlots: { type: Number, default: 0 },
      sponsoredSearchWeight: { type: Number, default: 0 },
      accessAnalytics: { type: Boolean, default: false },
      dedicatedSuccessManager: { type: Boolean, default: false },
    },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ active: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ code: 1 });

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
