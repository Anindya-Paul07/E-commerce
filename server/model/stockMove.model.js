import mongoose from 'mongoose'

const stockMoveSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['in', 'out', 'adjust', 'reserve', 'release', 'commit', 'transfer'],
      required: true,
      index: true
    },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    qty: { type: Number, required: true }, // positive amounts; direction implied by type
    fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, default: '' }, // e.g., "purchase-order #123", "manual adjust"
    note: { type: String, default: '' },
    snapshot: {
      qtyOnHand: Number,
      qtyReserved: Number,
    },
  },
  { timestamps: true }
)

stockMoveSchema.index({ createdAt: -1 })
stockMoveSchema.index({ variant: 1, createdAt: -1 })

export default mongoose.model('StockMove', stockMoveSchema)