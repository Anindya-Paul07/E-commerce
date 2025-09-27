import mongoose from 'mongoose';

function slugify(input = '') {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    status: { type: String, enum: ['active', 'draft'], default: 'active', index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

brandSchema.pre('validate', function handleSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

brandSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Brand', brandSchema);
