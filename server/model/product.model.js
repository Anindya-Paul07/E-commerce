import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    images: [{ type: String }],
    brand: { type: String, default: '' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
    stock: { type: Number, default: 0, min: 0 },
    tags: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', index: true },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted', 'archived'],
      default: 'public',
      index: true,
    },
    fulfillmentMode: {
      type: String,
      enum: ['platform', 'hybrid'],
      default: 'platform',
    },
    dimensions: {
      weight: { type: Number, min: 0 },
      weightUnit: { type: String, enum: ['kg', 'lb', 'g'], default: 'kg' },
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      dimensionUnit: { type: String, enum: ['cm', 'in'], default: 'cm' },
    },
    compliance: {
      hsCode: { type: String, trim: true },
      countryOfOrigin: { type: String, trim: true },
      requiresAgeCheck: { type: Boolean, default: false },
      dangerousGoods: { type: Boolean, default: false },
    },
    logistics: {
      shelfLifeDays: { type: Number, min: 0 },
      storageType: { type: String, enum: ['ambient', 'chilled', 'frozen'], default: 'ambient' },
      handlingNotes: { type: String, trim: true },
    },
    commission: {
      rate: { type: Number, min: 0, max: 1 },
      flatFee: { type: Number, min: 0 },
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: { type: [String], default: [] },
    },
    boost: {
      boostedAt: { type: Date },
      boostScore: { type: Number, default: 0 },
      boostExpiresAt: { type: Date },
    },
    attributes: {
      type: [
        {
          key: { type: String, trim: true },
          value: { type: String, trim: true },
        },
      ],
      default: [],
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ shop: 1, status: 1 });
productSchema.index({ 'boost.boostScore': -1 });
productSchema.index({ visibility: 1 });

export default mongoose.model('Product', productSchema);
