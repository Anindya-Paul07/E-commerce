import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import { ThemePreset, ThemeSetting } from '../model/theme-preset.model.js';

function tokenFor(user, roles = user.roles || []) {
  return jwt.sign({ sub: user._id.toString(), roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Theme presets API', () => {
  let mongo;
  let adminUser;
  let adminHeader;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'theme-controller-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    adminUser = await User.create({ email: 'admin@example.com', passwordHash: 'hash', roles: ['admin'] });
    adminHeader = `Bearer ${tokenFor(adminUser, ['admin'])}`;
  });

  test('seeds default presets and returns active preset', async () => {
    const res = await request(app).get('/api/themes').expect(200);

    expect(res.body.presets).toHaveLength(4);
    expect(res.body.activePreset).toBe('daylight');

    const dbCount = await ThemePreset.countDocuments();
    expect(dbCount).toBe(4);
    const setting = await ThemeSetting.findOne().lean();
    expect(setting.activePreset).toBe('daylight');
  });

  test('admin can switch the active theme', async () => {
    await request(app).get('/api/themes');

    const setRes = await request(app)
      .patch('/api/admin/themes/active')
      .set('Authorization', adminHeader)
      .send({ key: 'twilight' })
      .expect(200);

    expect(setRes.body).toMatchObject({ activePreset: 'twilight' });

    const listRes = await request(app)
      .get('/api/themes')
      .expect(200);
    expect(listRes.body.activePreset).toBe('twilight');
  });

  test('admin can create a new preset and set it default', async () => {
    await request(app).get('/api/themes');

    const payload = {
      key: 'aurora',
      label: 'Aurora',
      description: 'Luminous twilight tones with violet gradients.',
      palette: {
        name: 'Aurora',
        mode: 'night',
        accent: '#c084fc',
        surface: '#0f172a',
        text: '#f8fafc',
        gradient: 'linear-gradient(135deg, rgba(192,132,252,0.32), rgba(14,165,233,0.18))',
      },
      typography: {
        headingFont: '"Sora", sans-serif',
        bodyFont: '"Inter", sans-serif',
      },
      isDefault: true,
    };

    const createRes = await request(app)
      .post('/api/admin/themes')
      .set('Authorization', adminHeader)
      .send(payload)
      .expect(201);

    expect(createRes.body.preset.key).toBe('aurora');
    expect(createRes.body.preset.isDefault).toBe(true);

    const listRes = await request(app)
      .get('/api/themes')
      .expect(200);

    expect(listRes.body.presets.some((preset) => preset.key === 'aurora')).toBe(true);
    expect(listRes.body.activePreset).toBe('aurora');
  });
});
