import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema(
  {
    currency: { type: String, trim: true, default: 'USD' },
    listPrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    minRetailPrice: { type: Number, min: 0 },
    maxRetailPrice: { type: Number, min: 0 },
  },
  { _id: false }
);

const catalogVariantSchema = new mongoose.Schema(
  {
    catalogProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogProduct',
      required: true,
      index: true,
    },
    sku: { type: String, required: true, trim: true, unique: true, index: true },
    title: { type: String, trim: true },
    options: { type: Map, of: String, default: {} },
    attributes: { type: Map, of: String, default: {} },
    barcode: { type: String, trim: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'retired'],
      default: 'draft',
      index: true,
    },
    pricing: { type: pricingSchema, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

catalogVariantSchema.index({ catalogProduct: 1, status: 1 });

export default mongoose.model('CatalogVariant', catalogVariantSchema);
