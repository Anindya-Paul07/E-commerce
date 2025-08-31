import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },             // snapshot
  price: { type: Number, required: true, min: 0 },     // snapshot
  image: { type: String, default: '' },                // snapshot
  qty: { type: Number, required: true, min: 1, default: 1 },
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
