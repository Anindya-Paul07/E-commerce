import mongoose from 'mongoose';

const fulfillmentEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'allocated', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'canceled', 'returned'],
    },
    at: { type: Date, default: () => new Date() },
    notes: { type: String, trim: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerListing' },
    catalogProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogProduct' },
    catalogVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogVariant' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    title: { type: String, required: true },
    variantTitle: { type: String, default: '' },
    sku: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    qty: { type: Number, required: true, min: 1 },
    commissionRate: { type: Number, min: 0, max: 1 },
    commissionAmount: { type: Number, min: 0 },
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'allocated', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'canceled', 'returned'],
      default: 'pending',
      index: true,
    },
    fulfillmentEvents: { type: [fulfillmentEventSchema], default: [] },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

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
  fulfillmentSummary: {
    status: {
      type: String,
      enum: ['pending', 'allocated', 'packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'canceled', 'returned'],
      default: 'pending',
      index: true,
    },
    estimatedDeliveryStart: { type: Date },
    estimatedDeliveryEnd: { type: Date },
    promisedBy: { type: Date },
    trackingNumber: { type: String, trim: true },
    carrier: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    lastUpdatedAt: { type: Date },
  },
  settlement: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'settled', 'refunded', 'disputed'],
      default: 'pending',
    },
    commissionTotal: { type: Number, default: 0 },
    netPayoutTotal: { type: Number, default: 0 },
    payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
    ledgerEntries: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LedgerEntry',
        },
      ],
      default: [],
    },
  },
  compliance: {
    holdPlaced: { type: Boolean, default: false },
    holdReason: { type: String, trim: true },
    riskScore: { type: Number, default: 0 },
  },
  customerNotes: { type: String, trim: true },
  internalNotes: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
