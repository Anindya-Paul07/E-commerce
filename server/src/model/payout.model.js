import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'processing', 'paid', 'failed', 'canceled'],
      default: 'pending',
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    scheduledFor: { type: Date },
    processedAt: { type: Date },
    failureReason: { type: String, trim: true },
    reference: { type: String, trim: true, unique: true },
    ledgerEntries: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LedgerEntry',
        },
      ],
      default: [],
    },
    disbursementMethodSnapshot: {
      method: { type: String, trim: true },
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      bankBranch: { type: String, trim: true },
    },
    notes: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ scheduledFor: 1 });

export default mongoose.model('Payout', payoutSchema);
