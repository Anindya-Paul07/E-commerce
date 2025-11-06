import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerListing' },
    catalogProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' },
    catalogVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogVariant' },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    title: { type: String, required: true },
    variantTitle: { type: String, default: '' },
    sku: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    commissionRate: { type: Number, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    currency: { type: String, default: 'USD' },
    coupon: {
      code: { type: String, uppercase: true, trim: true },
      discountType: { type: String, enum: ['percentage', 'fixed'] },
      discountValue: { type: Number, min: 0 },
      amount: { type: Number, min: 0, default: 0 },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      appliedAt: { type: Date },
    },
  },
  { timestamps: true }
);

cartSchema.methods.subtotal = function subtotal() {
  return (this.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
};

cartSchema.methods.discountTotal = function discountTotal() {
  const amount = this.coupon?.amount;
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, amount);
};

cartSchema.methods.total = function total() {
  const subtotal = this.subtotal();
  const discount = this.discountTotal();
  return Math.max(0, subtotal - discount);
};

export default mongoose.model('Cart', cartSchema);
