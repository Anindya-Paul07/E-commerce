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
  },
  { timestamps: true }
);

cartSchema.methods.subtotal = function subtotal() {
  return (this.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
};

export default mongoose.model('Cart', cartSchema);
