import mongoose from 'mongoose'

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true }, // e.g., "DH-1"
    address: {
      line1: String, line2: String, city: String, state: String, postalCode: String, country: String,
    },
    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
)

warehouseSchema.index({ active: 1, code: 1 })

export default mongoose.model('Warehouse', warehouseSchema)