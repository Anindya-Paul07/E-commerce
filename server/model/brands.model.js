import mongoose from 'mongoose';

function slugify(s) {
  return s
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
    logo: { type: String, default: '' },         // URL for now
    website: { type: String, default: '' },
    status: { type: String, enum: ['active', 'draft'], default: 'active', index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug if missing
brandSchema.pre('validate', function(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

// Text search on name/description
brandSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Brand', brandSchema);