import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: { type: String, default: 'US' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  number: { type: String, unique: true, index: true }, // e.g. ORD-2025-00001
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0, default: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending','paid','shipped','delivered','canceled'], default: 'pending', index: true },
  paymentMethod: { type: String, enum: ['cod','online'], default: 'cod' },
  shippingAddress: addressSchema,
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
