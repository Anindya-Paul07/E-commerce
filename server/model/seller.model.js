import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true },
    label: { type: String, trim: true },
    url: { type: String, trim: true },
    uploadedAt: { type: Date, default: () => new Date() },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, trim: true },
  },
  { _id: false }
);

documentSchema.index({ type: 1, status: 1 });

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true },
    legalName: { type: String, trim: true },
    slug: { type: String, trim: true, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'under_review', 'approved', 'suspended', 'rejected'],
      default: 'draft',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'in_review', 'verified', 'rejected'],
      default: 'not_submitted',
      index: true,
    },
    onboardingStep: { type: String, default: 'profile' },
    contact: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      supportEmail: { type: String, trim: true },
    },
    warehousePreferences: {
      defaultWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
      inboundInstructions: { type: String, trim: true },
    },
    kyc: {
      nidNumber: { type: String, trim: true },
      nidType: { type: String, trim: true },
      nidIssuedAt: { type: Date },
      selfieUrl: { type: String, trim: true },
      selfieVerifiedAt: { type: Date },
      selfieVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verificationNotes: { type: String, trim: true },
      riskScore: { type: Number, min: 0, max: 100, default: 0 },
    },
    documents: { type: [documentSchema], default: [] },
    payout: {
      method: { type: String, enum: ['bank_transfer', 'bkash', 'nagad', 'payoneer', 'manual'], default: 'bank_transfer' },
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      bankBranch: { type: String, trim: true },
      routingNumber: { type: String, trim: true },
      iban: { type: String, trim: true },
      swift: { type: String, trim: true },
      mobileWalletNumber: { type: String, trim: true },
      preferredCurrency: { type: String, trim: true, default: 'USD' },
      lastValidatedAt: { type: Date },
    },
    metrics: {
      ratingAverage: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      grossMerchandiseValue: { type: Number, default: 0 },
      totalCommissionPaid: { type: Number, default: 0 },
      onTimeFulfillmentRate: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
    },
    complianceFlags: {
      type: [
        {
          code: { type: String, trim: true },
          level: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
          message: { type: String, trim: true },
          raisedAt: { type: Date, default: () => new Date() },
          resolvedAt: { type: Date },
        },
      ],
      default: [],
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

sellerSchema.index({ slug: 1 });
sellerSchema.index({ status: 1, verificationStatus: 1 });
sellerSchema.index({ 'metrics.totalOrders': -1 });

sellerSchema.virtual('isVerified').get(function isVerified() {
  return this.verificationStatus === 'verified';
});

export default mongoose.model('Seller', sellerSchema);
