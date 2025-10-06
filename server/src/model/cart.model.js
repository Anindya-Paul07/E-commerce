import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerListing' },
  catalogProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' },
  catalogVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogVariant' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  title: { type: String, required: true },             // snapshot
  variantTitle: { type: String, default: '' },         // snapshot
  sku: { type: String, default: '' },                  // snapshot
  price: { type: Number, required: true, min: 0 },     // snapshot
  image: { type: String, default: '' },                // snapshot
  qty: { type: Number, required: true, min: 1, default: 1 },
  commissionRate: { type: Number, min: 0, max: 1 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true },
  items: { type: [cartItemSchema], default: [] },
  currency: { type: String, default: 'USD' },
}, { timestamps: true });

cartSchema.methods.subtotal = function () {
  return this.items.reduce((s, it) => s + it.price * it.qty, 0);
};

export default mongoose.model('Cart', cartSchema);
