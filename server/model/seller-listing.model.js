import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogVariant',
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    inventoryPolicy: {
      type: String,
      enum: ['track', 'dont_track'],
      default: 'track',
    },
    leadTimeDays: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

offerSchema.index({ variant: 1 });

const sellerListingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    catalogProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogProduct',
      required: true,
      index: true,
    },
    titleOverride: { type: String, trim: true },
    descriptionOverride: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'draft',
      index: true,
    },
    moderationState: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderationNotes: { type: String, trim: true },
    offers: { type: [offerSchema], default: [] },
    logistics: {
      handlingTimeDays: { type: Number, min: 0, default: 0 },
      shipsFromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

sellerListingSchema.index({ seller: 1, catalogProduct: 1 }, { unique: true });
sellerListingSchema.index({ status: 1, moderationState: 1 });

export default mongoose.model('SellerListing', sellerListingSchema);
