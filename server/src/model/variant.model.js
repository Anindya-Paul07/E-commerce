import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default: '' },
    options: { type: Map, of: String, default: {} },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: null },
    barcode: { type: String, default: '' },
    weight: {
      value: { type: Number, default: 0 },
      unit: { type: String, default: 'g' },
    },
    status: { type: String, enum: ['active', 'draft'], default: 'active', index: true },
    managesInventory: { type: Boolean, default: true },
  },
  { timestamps: true }
);

variantSchema.index({ product: 1, status: 1 });
variantSchema.index({ sku: 1 }, { unique: true });

export default mongoose.model('Variant', variantSchema);
