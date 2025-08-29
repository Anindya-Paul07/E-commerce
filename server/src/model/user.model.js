import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['customer'] }, // 'admin','staff','customer'
    status: { type: String, enum: ['active', 'disabled'], default: 'active' }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
