import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    qtyOnHand: { type: Number, default: 0 },
    qtyReserved: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ variant: 1, warehouse: 1 }, { unique: true });

inventoryItemSchema.virtual('qtyAvailable').get(function qtyAvailable() {
  return Math.max(0, (this.qtyOnHand || 0) - (this.qtyReserved || 0));
});

inventoryItemSchema.statics.ensure = function ensure(variantId, warehouseId) {
  return this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId },
    { $setOnInsert: { qtyOnHand: 0, qtyReserved: 0 } },
    { new: true, upsert: true }
  );
};

inventoryItemSchema.statics.increaseOnHand = function increase({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  return this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId },
    { $inc: { qtyOnHand: qty } },
    { new: true, upsert: true }
  );
};

inventoryItemSchema.statics.decreaseOnHand = async function decrease({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId, qtyOnHand: { $gte: qty } },
    { $inc: { qtyOnHand: -qty } },
    { new: true }
  );
  if (!doc) throw new Error('insufficient_on_hand');
  return doc;
};

inventoryItemSchema.statics.reserve = async function reserve({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    {
      variant: variantId,
      warehouse: warehouseId,
      $expr: { $gte: [{ $subtract: ['$qtyOnHand', '$qtyReserved'] }, qty] },
    },
    { $inc: { qtyReserved: qty } },
    { new: true }
  );
  if (!doc) throw new Error('insufficient_available');
  return doc;
};

inventoryItemSchema.statics.release = async function release({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId, qtyReserved: { $gte: qty } },
    { $inc: { qtyReserved: -qty } },
    { new: true }
  );
  if (!doc) throw new Error('nothing_to_release');
  return doc;
};

inventoryItemSchema.statics.commit = async function commit({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    {
      variant: variantId,
      warehouse: warehouseId,
      qtyReserved: { $gte: qty },
      qtyOnHand: { $gte: qty },
    },
    { $inc: { qtyReserved: -qty, qtyOnHand: -qty } },
    { new: true }
  );
  if (!doc) throw new Error('commit_failed_insufficient');
  return doc;
};

export default mongoose.model('InventoryItem', inventoryItemSchema);
