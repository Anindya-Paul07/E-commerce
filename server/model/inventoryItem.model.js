import mongoose from 'mongoose'

const inventoryItemSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    qtyOnHand: { type: Number, default: 0 },     // physical stock
    qtyReserved: { type: Number, default: 0 },   // held for carts/orders (not yet shipped)
    lowStockThreshold: { type: Number, default: 0 },
  },
  { timestamps: true }
)

inventoryItemSchema.index({ variant: 1, warehouse: 1 }, { unique: true })

// Virtual available = onHand - reserved
inventoryItemSchema.virtual('qtyAvailable').get(function () {
  return Math.max(0, (this.qtyOnHand || 0) - (this.qtyReserved || 0))
})

// -------- Atomic helpers (safe with concurrency) --------

// Ensure a record exists for (variant, warehouse)
inventoryItemSchema.statics.ensure = async function (variantId, warehouseId) {
  return this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId },
    { $setOnInsert: { qtyOnHand: 0, qtyReserved: 0 } },
    { new: true, upsert: true }
  )
}

// Increase physical stock (receiving, adjustments)
inventoryItemSchema.statics.increaseOnHand = async function ({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0')
  return this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId },
    { $inc: { qtyOnHand: qty } },
    { new: true, upsert: true }
  )
}

// Decrease physical stock (write-off, shipment without reservation)
inventoryItemSchema.statics.decreaseOnHand = async function ({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0')
  const doc = await this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId, qtyOnHand: { $gte: qty } },
    { $inc: { qtyOnHand: -qty } },
    { new: true }
  )
  if (!doc) throw new Error('insufficient_on_hand')
  return doc
}

// Reserve from available (cart step)
inventoryItemSchema.statics.reserve = async function ({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0')
  const doc = await this.findOneAndUpdate(
    {
      variant: variantId,
      warehouse: warehouseId,
      $expr: { $gte: [{ $subtract: ['$qtyOnHand', '$qtyReserved'] }, qty] }, // available >= qty
    },
    { $inc: { qtyReserved: qty } },
    { new: true }
  )
  if (!doc) throw new Error('insufficient_available')
  return doc
}

// Release reservation (cart abandoned / item removed)
inventoryItemSchema.statics.release = async function ({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0')
  const doc = await this.findOneAndUpdate(
    { variant: variantId, warehouse: warehouseId, qtyReserved: { $gte: qty } },
    { $inc: { qtyReserved: -qty } },
    { new: true }
  )
  if (!doc) throw new Error('nothing_to_release')
  return doc
}

// Commit reservation into shipment (after order paid/fulfilled):
// reduces onHand by qty and reduces reserved by qty (net available unchanged at commit time)
inventoryItemSchema.statics.commit = async function ({ variantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0')
  const doc = await this.findOneAndUpdate(
    {
      variant: variantId,
      warehouse: warehouseId,
      qtyReserved: { $gte: qty },
      qtyOnHand: { $gte: qty },
    },
    { $inc: { qtyReserved: -qty, qtyOnHand: -qty } },
    { new: true }
  )
  if (!doc) throw new Error('commit_failed_insufficient')
  return doc
}

export default mongoose.model('InventoryItem', inventoryItemSchema)