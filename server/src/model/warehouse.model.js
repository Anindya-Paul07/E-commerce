import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'US' },
    },
    contact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    active: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

warehouseSchema.index({ name: 'text', code: 'text' });
warehouseSchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Warehouse', warehouseSchema);
