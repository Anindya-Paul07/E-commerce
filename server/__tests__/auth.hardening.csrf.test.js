import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import User from '../model/user.model.js';

function extractCookie(cookies, name) {
  const raw = (cookies || []).find((c) => c.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.split(';')[0].split('=')[1];
}

describe('CSRF for cookie-auth state change (logout)', () => {
  let mongo;
  let agent;
  let cookieName;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'auth-csrf-test' });
    const passwordHash = await bcrypt.hash('secret123', 10);
    await User.create({ name: 'A', email: 'a@example.com', passwordHash });
    agent = request.agent(app);
    cookieName = process.env.COOKIE_NAME || 'ecom_jwt';
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  test('POST /api/auth/logout requires CSRF when using cookie-auth', async () => {
    // login to get JWT cookie
    const login = await agent.post('/api/auth/login').send({ email: 'a@example.com', password: 'secret123' }).expect(200);
    const loginCookies = login.headers['set-cookie'] || [];
    const jwtCookie = loginCookies.find((c) => c.includes(cookieName));
    expect(jwtCookie).toBeTruthy();

    // missing CSRF → 403
    await agent.post('/api/auth/logout').expect(403);

    // get CSRF token cookie
    const csrf = await agent.get('/api/auth/csrf').expect(200);
    const csrfCookies = csrf.headers['set-cookie'] || [];
    const csrfToken = extractCookie(csrfCookies, 'csrf_token');
    expect(csrfToken).toBeTruthy();

    // supply header → 200 and cookie cleared
    const out = await agent.post('/api/auth/logout').set('x-csrf-token', csrfToken).expect(200);
    expect(out.body).toEqual({ ok: true });
  });
});
