import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../model/user.model.js';

describe('Auth cookies (flags & basics)', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'auth-cookies-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  test('POST /api/auth/login sets a secure, httpOnly cookie (Secure only if ENV.COOKIE_SECURE=true)', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    await User.create({ name: 'A', email: 'a@example.com', passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'secret123' })
      .expect(200);

    const setCookie = res.headers['set-cookie'] || [];
    const cookie = setCookie.find((c) => c.includes(process.env.COOKIE_NAME || 'ecom_jwt'));
    expect(cookie).toBeTruthy();

    expect(cookie).toMatch(/HttpOnly/i);
    // default test env uses COOKIE_SAMESITE=lax (via env.js default)
    expect(cookie).toMatch(/SameSite=Lax/i);

    if ((process.env.COOKIE_SECURE || 'false') === 'true') {
      expect(cookie).toMatch(/Secure/i);
    } else {
      expect(cookie).not.toMatch(/Secure/i);
    }
  });
});
