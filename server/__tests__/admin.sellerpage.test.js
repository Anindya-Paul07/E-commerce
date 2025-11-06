import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import SellerPageContent from '../model/seller-page-content.model.js';

function tokenFor(user, roles = user.roles || []) {
  return jwt.sign({ sub: user._id.toString(), roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Admin seller page content API', () => {
  let mongo;
  let adminUser;
  let adminHeader;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'admin-seller-page-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    adminUser = await User.create({
      email: 'admin@example.com',
      passwordHash: 'hash',
      roles: ['admin'],
    });
    adminHeader = `Bearer ${tokenFor(adminUser, ['admin'])}`;
  });

  test('returns default content when no entry exists', async () => {
    const res = await request(app)
      .get('/api/admin/seller-page')
      .set('Authorization', adminHeader)
      .expect(200);

    expect(res.body.content.hero.title).toBeTruthy();
    expect(res.body.content.pillars).toEqual([]);
    expect(res.body.content.theme.heroGradient).toBeTruthy();
  });

  test('rejects non-admin updates', async () => {
    const seller = await User.create({ email: 'seller@example.com', passwordHash: 'hash', roles: ['seller'] });
    const sellerHeader = `Bearer ${tokenFor(seller, ['seller'])}`;

    await request(app)
      .put('/api/admin/seller-page')
      .set('Authorization', sellerHeader)
      .send({ hero: { title: 'Not allowed' } })
      .expect(403);
  });

  test('updates seller page content and persists sanitized values', async () => {
    const payload = {
      hero: {
        eyebrow: 'flagship collective',
        title: '  Build your flagship ',
        subtitle: 'Partner with concierge merchandising.',
        backgroundImage: 'https://cdn.example.com/hero.jpg',
        primaryCta: { label: 'Join now', href: '/seller/apply' },
        secondaryCta: { label: 'View playbook', href: '/seller/playbook' },
      },
      pillars: [
        { title: 'Merchandising', description: 'Editorial support', icon: 'sparkles' },
        { title: '', description: '', icon: '' },
      ],
      callouts: [
        {
          title: 'Concierge onboarding',
          body: 'Dedicated merchant success managers help you set up your shop.',
          mediaUrl: 'https://cdn.example.com/callout.jpg',
          cta: { label: 'Meet the team', href: '/seller/team' },
        },
      ],
      testimonials: [
        {
          quote: 'The marketplace supercharged our reach in weeks.',
          name: 'Jordan Avery',
          role: 'Founder, Lumen Goods',
        },
      ],
      faqs: [
        { question: 'How long does approval take?', answer: 'Most applications receive a response in under 5 business days.' },
      ],
      contact: {
        headline: 'Need more details?',
        body: 'Email the merchant success team.',
        email: 'success@example.com',
        phone: '+1 555 222 3456',
        cta: { label: 'Book a consult', href: '/seller/consult' },
      },
      theme: {
        heroGradient: 'linear-gradient(135deg, rgba(59,130,246,0.45), rgba(14,165,233,0.25))',
        accentColor: '#0ea5e9',
      },
    };

    const res = await request(app)
      .put('/api/admin/seller-page')
      .set('Authorization', adminHeader)
      .send(payload)
      .expect(200);

    expect(res.body.content.hero.title).toBe('Build your flagship');
    expect(res.body.content.pillars).toHaveLength(1);
    expect(res.body.content.callouts[0]).toMatchObject({ title: 'Concierge onboarding' });
    expect(res.body.content.testimonials[0]).toMatchObject({ name: 'Jordan Avery' });
    expect(res.body.content.faqs[0].question).toMatch(/approval/gi);
    expect(res.body.content.contact.email).toBe('success@example.com');
    expect(res.body.content.theme.accentColor).toBe('#0ea5e9');

    const stored = await SellerPageContent.findOne({ slug: 'default' }).lean();
    expect(stored.hero.title).toBe('Build your flagship');
    expect(stored.updatedBy.toString()).toBe(adminUser._id.toString());
    expect(stored.pillars).toHaveLength(1);

    const publicRes = await request(app)
      .get('/api/seller-page')
      .expect(200);
    expect(publicRes.body.content.hero.title).toBe('Build your flagship');
  });

  test('manages seller page collections via item endpoints', async () => {
    await request(app)
      .post('/api/admin/seller-page/items')
      .set('Authorization', adminHeader)
      .send({
        collection: 'pillars',
        item: { title: 'Merchandising', description: 'Editorial support', icon: 'sparkles' },
      })
      .expect(201);

    await request(app)
      .post('/api/admin/seller-page/items')
      .set('Authorization', adminHeader)
      .send({
        collection: 'pillars',
        item: { title: 'Fulfilment', description: 'Unified logistics', icon: 'boxes' },
      })
      .expect(201);

    let doc = await SellerPageContent.findOne({ slug: 'default' }).lean();
    expect(doc.pillars).toHaveLength(2);

    await request(app)
      .patch('/api/admin/seller-page/reorder')
      .set('Authorization', adminHeader)
      .send({ collection: 'pillars', order: [1, 0] })
      .expect(200);

    doc = await SellerPageContent.findOne({ slug: 'default' }).lean();
    expect(doc.pillars[0].title).toBe('Fulfilment');

    await request(app)
      .delete('/api/admin/seller-page/items')
      .set('Authorization', adminHeader)
      .send({ collection: 'pillars', index: 0 })
      .expect(200);

    doc = await SellerPageContent.findOne({ slug: 'default' }).lean();
    expect(doc.pillars).toHaveLength(1);
    expect(doc.pillars[0].title).toBe('Merchandising');
  });
});
