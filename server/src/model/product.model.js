import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    brand: { type: String, default: '' },
    status: { type: String, enum: ['active', 'draft'], default: 'active' },
    stock: { type: Number, default: 0, min: 0 },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });

export default mongoose.model('Product', productSchema);
