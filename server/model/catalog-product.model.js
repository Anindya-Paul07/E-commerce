import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true },
    value: { type: String, trim: true },
    unit: { type: String, trim: true },
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    keywords: { type: [String], default: [] },
  },
  { _id: false }
);

const dimensionSchema = new mongoose.Schema(
  {
    weight: { type: Number, min: 0 },
    weightUnit: { type: String, enum: ['kg', 'lb', 'g'], default: 'kg' },
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    dimensionUnit: { type: String, enum: ['cm', 'in'], default: 'cm' },
  },
  { _id: false }
);

const catalogProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    summary: { type: String, trim: true },
    description: { type: String, default: '' },
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
    moderationNotes: { type: String, trim: true },
    brand: { type: String, trim: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    tags: [{ type: String, trim: true }],
    defaultImage: { type: String, trim: true },
    images: { type: [String], default: [] },
    attributes: { type: [attributeSchema], default: [] },
    dimensions: dimensionSchema,
    seo: seoSchema,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

catalogProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
catalogProductSchema.index({ status: 1, moderationState: 1 });

catalogProductSchema.methods.primaryImage = function primaryImage() {
  return this.defaultImage || this.images?.[0] || '';
};

export default mongoose.model('CatalogProduct', catalogProductSchema);
