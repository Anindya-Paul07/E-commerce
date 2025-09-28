import mongoose from 'mongoose';

const warehouseStockSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellerListing',
      required: true,
      index: true,
    },
    catalogVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CatalogVariant',
      required: true,
      index: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    qtyOnHand: { type: Number, default: 0 },
    qtyReserved: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

warehouseStockSchema.index({ listing: 1, catalogVariant: 1, warehouse: 1 }, { unique: true });

warehouseStockSchema.virtual('qtyAvailable').get(function qtyAvailable() {
  return Math.max(0, (this.qtyOnHand || 0) - (this.qtyReserved || 0));
});

warehouseStockSchema.statics.ensure = function ensure({ listingId, catalogVariantId, warehouseId }) {
  return this.findOneAndUpdate(
    { listing: listingId, catalogVariant: catalogVariantId, warehouse: warehouseId },
    { $setOnInsert: { qtyOnHand: 0, qtyReserved: 0 } },
    { new: true, upsert: true }
  );
};

warehouseStockSchema.statics.increaseOnHand = function increaseOnHand({ listingId, catalogVariantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  return this.findOneAndUpdate(
    { listing: listingId, catalogVariant: catalogVariantId, warehouse: warehouseId },
    { $inc: { qtyOnHand: qty } },
    { new: true, upsert: true }
  );
};

warehouseStockSchema.statics.decreaseOnHand = async function decreaseOnHand({ listingId, catalogVariantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    { listing: listingId, catalogVariant: catalogVariantId, warehouse: warehouseId, qtyOnHand: { $gte: qty } },
    { $inc: { qtyOnHand: -qty } },
    { new: true }
  );
  if (!doc) throw new Error('insufficient_on_hand');
  return doc;
};

warehouseStockSchema.statics.reserve = async function reserve({ listingId, catalogVariantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    {
      listing: listingId,
      catalogVariant: catalogVariantId,
      warehouse: warehouseId,
      $expr: { $gte: [{ $subtract: ['$qtyOnHand', '$qtyReserved'] }, qty] },
    },
    { $inc: { qtyReserved: qty } },
    { new: true }
  );
  if (!doc) throw new Error('insufficient_available');
  return doc;
};

warehouseStockSchema.statics.release = async function release({ listingId, catalogVariantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    { listing: listingId, catalogVariant: catalogVariantId, warehouse: warehouseId, qtyReserved: { $gte: qty } },
    { $inc: { qtyReserved: -qty } },
    { new: true }
  );
  if (!doc) throw new Error('nothing_to_release');
  return doc;
};

warehouseStockSchema.statics.commit = async function commit({ listingId, catalogVariantId, warehouseId, qty }) {
  if (qty <= 0) throw new Error('qty must be > 0');
  const doc = await this.findOneAndUpdate(
    {
      listing: listingId,
      catalogVariant: catalogVariantId,
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

export default mongoose.model('WarehouseStock', warehouseStockSchema);
