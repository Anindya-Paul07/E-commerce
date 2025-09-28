import mongoose from 'mongoose';

const taskEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'canceled', 'exception'],
      required: true,
    },
    message: { type: String, trim: true },
    at: { type: Date, default: () => new Date() },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    carrier: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    eta: { type: Date },
    events: {
      type: [
        {
          status: { type: String, trim: true },
          location: { type: String, trim: true },
          description: { type: String, trim: true },
          at: { type: Date, default: () => new Date() },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const fulfillmentTaskSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderItemIndex: { type: Number },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'SellerListing' },
    catalogVariant: { type: mongoose.Schema.Types.ObjectId, ref: 'CatalogVariant' },
    sku: { type: String, trim: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', index: true },
    type: {
      type: String,
      enum: ['pick', 'pack', 'ship', 'handoff', 'return'],
      default: 'pick',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'canceled', 'exception'],
      default: 'pending',
      index: true,
    },
    priority: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tracking: trackingSchema,
    events: { type: [taskEventSchema], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

fulfillmentTaskSchema.index({ warehouse: 1, status: 1, priority: -1 });
fulfillmentTaskSchema.index({ seller: 1, status: 1 });
fulfillmentTaskSchema.index({ listing: 1, status: 1 });

export default mongoose.model('FulfillmentTask', fulfillmentTaskSchema);
