import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },           // URL (optional)
    parent: { type: Types.ObjectId, ref: 'Category', default: null }, // nested cats
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Category', categorySchema);
