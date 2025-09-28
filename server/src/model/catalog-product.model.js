import mongoose from 'mongoose';

const catalogProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: '' },
    brand: { type: String, trim: true, index: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    images: [{ type: String, trim: true }],
    attributes: { type: Map, of: String, default: {} },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    moderationState: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    lifecycle: {
      type: String,
      enum: ['active', 'retired'],
      default: 'active',
      index: true,
    },
    version: {
      major: { type: Number, default: 1 },
      minor: { type: Number, default: 0 },
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

catalogProductSchema.index({ name: 'text', brand: 'text', description: 'text' });
catalogProductSchema.index({ status: 1, moderationState: 1 });
catalogProductSchema.index({ lifecycle: 1, status: 1 });

export default mongoose.model('CatalogProduct', catalogProductSchema);
