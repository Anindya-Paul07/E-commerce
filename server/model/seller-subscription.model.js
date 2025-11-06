import mongoose from 'mongoose';

const sellerSubscriptionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'expired'],
      default: 'trialing',
      index: true,
    },
    startedAt: { type: Date, default: () => new Date() },
    currentPeriodEnd: { type: Date, required: true },
    canceledAt: { type: Date },
    cancellationReason: { type: String, trim: true },
    renewalEnabled: { type: Boolean, default: true },
    paymentProcessor: { type: String, trim: true },
    externalSubscriptionId: { type: String, trim: true },
    externalCustomerId: { type: String, trim: true },
    lastPaymentAt: { type: Date },
    nextBillingAt: { type: Date },
    usage: {
      sponsoredClicks: { type: Number, default: 0 },
      featuredImpressions: { type: Number, default: 0 },
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

sellerSubscriptionSchema.index({ seller: 1, status: 1 });
sellerSubscriptionSchema.index({ externalSubscriptionId: 1 }, { sparse: true, unique: true });

export default mongoose.model('SellerSubscription', sellerSubscriptionSchema);
