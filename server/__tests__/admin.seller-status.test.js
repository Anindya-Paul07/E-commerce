import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import Seller from '../model/seller.model.js';

function tokenFor(user, roles = user.roles || []) {
  return jwt.sign({ sub: user._id.toString(), roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Admin seller status workflow', () => {
  let mongo;
  let adminUser;
  let adminAuthHeader;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'admin-seller-status-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    adminUser = await User.create({
      email: 'admin@example.com',
      passwordHash: 'test',
      roles: ['admin'],
    });
    adminAuthHeader = `Bearer ${tokenFor(adminUser, ['admin'])}`;
  });

  test('lists pending sellers and allows status transitions', async () => {
    const pendingUser = await User.create({
      email: 'pending@example.com',
      passwordHash: 'test',
      roles: ['seller'],
    });
    const pendingSeller = await Seller.create({
      user: pendingUser._id,
      displayName: 'Pending Seller',
      legalName: 'Pending Seller LLC',
      slug: 'pending-seller',
      status: 'pending',
      verificationStatus: 'pending',
      contact: { email: 'pending@example.com' },
    });

    const approvedUser = await User.create({
      email: 'approved@example.com',
      passwordHash: 'test',
      roles: ['seller'],
    });
    await Seller.create({
      user: approvedUser._id,
      displayName: 'Approved Seller',
      legalName: 'Approved Corp',
      slug: 'approved-seller',
      status: 'approved',
      verificationStatus: 'verified',
    });

    const listRes = await request(app)
      .get('/api/admin/sellers?status=pending')
      .set('Authorization', adminAuthHeader)
      .expect(200);

    expect(listRes.body.items).toHaveLength(1);
    expect(listRes.body.items[0]._id).toBe(pendingSeller._id.toString());

    const approveRes = await request(app)
      .patch(`/api/admin/sellers/${pendingSeller._id.toString()}/status`)
      .set('Authorization', adminAuthHeader)
      .send({
        status: 'approved',
        verificationStatus: 'verified',
        riskScore: 12,
        notes: 'Looks good',
      })
      .expect(200);

    expect(approveRes.body.seller.status).toBe('approved');
    expect(approveRes.body.seller.verificationStatus).toBe('verified');

    let refreshed = await Seller.findById(pendingSeller._id).lean();
    expect(refreshed.status).toBe('approved');
    expect(refreshed.verificationStatus).toBe('verified');
    expect(refreshed.kyc?.riskScore).toBe(12);
    expect(refreshed.notes).toBe('Looks good');

    const rejectRes = await request(app)
      .patch(`/api/admin/sellers/${pendingSeller._id.toString()}/status`)
      .set('Authorization', adminAuthHeader)
      .send({
        status: 'rejected',
        verificationStatus: 'rejected',
        notes: 'Missing documents',
      })
      .expect(200);

    expect(rejectRes.body.seller.status).toBe('rejected');
    expect(rejectRes.body.seller.verificationStatus).toBe('rejected');

    refreshed = await Seller.findById(pendingSeller._id).lean();
    expect(refreshed.status).toBe('rejected');
    expect(refreshed.verificationStatus).toBe('rejected');
    expect(refreshed.notes).toBe('Missing documents');
  });

  test('requires admin role to update seller status', async () => {
    const sellerUser = await User.create({
      email: 'customer@example.com',
      passwordHash: 'test',
      roles: ['seller'],
    });
    const seller = await Seller.create({
      user: sellerUser._id,
      displayName: 'Demo Seller',
      slug: 'demo-seller',
      status: 'pending',
      verificationStatus: 'pending',
    });

    const customer = await User.create({
      email: 'customer@shop.test',
      passwordHash: 'test',
      roles: ['customer'],
    });
    const customerHeader = `Bearer ${tokenFor(customer, ['customer'])}`;

    await request(app)
      .patch(`/api/admin/sellers/${seller._id.toString()}/status`)
      .set('Authorization', customerHeader)
      .send({ status: 'approved', verificationStatus: 'verified' })
      .expect(403);
  });
});

