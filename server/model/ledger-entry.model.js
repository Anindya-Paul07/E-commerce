import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_gmv',
        'commission_fee',
        'subscription_fee',
        'payout',
        'refund',
        'adjustment',
        'penalty',
        'promotion_credit',
      ],
      required: true,
    },
    direction: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    balanceAfter: { type: Number, default: 0 },
    reference: { type: String, trim: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerSubscription' },
    payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: String, trim: true },
    occurredAt: { type: Date, default: () => new Date() },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ seller: 1, occurredAt: -1 });
ledgerEntrySchema.index({ payout: 1 });
ledgerEntrySchema.index({ type: 1 });

export default mongoose.model('LedgerEntry', ledgerEntrySchema);
