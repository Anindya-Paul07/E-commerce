import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['customer'] }, // 'admin','staff','customer'
    phone: { type: String, trim: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    sellerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
