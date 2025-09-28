import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';
import User from '../../model/user.model.js';
import Seller from '../../model/seller.model.js';
import Shop from '../../model/shop.model.js';

let mongoServer;

export async function setupDatabase() {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  const { connectDB } = await import('../../config/db.js');
  await connectDB();
}

export async function teardownDatabase() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function resetDatabase() {
  const { db, readyState } = mongoose.connection;
  if (!db || readyState !== 1) return;

  const collections = await db.collections();
  await Promise.all(
    collections
      .filter((collection) => !collection.collectionName.startsWith('system.'))
      .map((collection) => collection.deleteMany({}))
  );
}

export function getApp() {
  return app;
}

export async function createUser({ name = 'Test User', email, roles = ['customer'], sellerProfile } = {}) {
  const user = await User.create({
    name,
    email: email || `${Date.now()}@example.com`,
    passwordHash: 'hashed',
    roles,
    sellerProfile,
  });
  return user;
}

export function createAuthHeader(user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return `Bearer ${token}`;
}

export async function ensureSellerForUser(user, { displayName = 'Test Seller', slug } = {}) {
  let seller = await Seller.findOne({ user: user._id });
  if (!seller) {
    seller = await Seller.create({
      user: user._id,
      displayName,
      slug: slug || `seller-${user._id.toString()}`,
      status: 'approved',
      verificationStatus: 'verified',
    });
    user.roles = Array.from(new Set([...(user.roles || []), 'seller']));
    user.sellerProfile = seller._id;
    await user.save();
  }

  let shop = await Shop.findOne({ seller: seller._id });
  if (!shop) {
    shop = await Shop.create({
      seller: seller._id,
      name: `${displayName} shop`,
      slug: `${seller.slug}-shop`,
      status: 'draft',
    });
  }

  return { seller, shop };
}
