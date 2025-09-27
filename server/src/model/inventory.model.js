import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    onHand: { type: Number, required: true, min: 0, default: 0 },
    reserved: { type: Number, required: true, min: 0, default: 0 },
    incoming: { type: Number, required: true, min: 0, default: 0 },
    safetyStock: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

inventorySchema.virtual('available').get(function available() {
  return Math.max(0, this.onHand - this.reserved);
});

export default mongoose.model('Inventory', inventorySchema);
