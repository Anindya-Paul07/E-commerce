import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../model/user.model.js';
import HomePageContent from '../model/home-page-content.model.js';

function tokenFor(user, roles = user.roles || []) {
  return jwt.sign({ sub: user._id.toString(), roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

describe('Admin homepage content API', () => {
  let mongo;
  let adminUser;
  let adminHeader;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'admin-homepage-test' });
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
      .get('/api/admin/homepage')
      .set('Authorization', adminHeader)
      .expect(200);

    expect(res.body.content.slug).toBe('default');
    expect(res.body.content.hero).toMatchObject({ enabled: true });
    expect(res.body.content.carousel).toEqual([]);
  });

  test('rejects non-admin requests', async () => {
    const seller = await User.create({
      email: 'seller@example.com',
      passwordHash: 'hash',
      roles: ['seller'],
    });
    const sellerHeader = `Bearer ${tokenFor(seller, ['seller'])}`;

    await request(app)
      .put('/api/admin/homepage')
      .set('Authorization', sellerHeader)
      .send({ hero: { title: 'Nope' } })
      .expect(403);
  });

  test('updates homepage content and persists sanitized values', async () => {
    const payload = {
      hero: {
        title: '  Summer savings  ',
        subtitle: 'Up to 50% off select items',
        ctaLabel: 'Shop now',
        ctaHref: '/sale',
        backgroundImage: 'https://cdn.example.com/hero.jpg',
        enabled: true,
      },
      carousel: [
        {
          title: '  New Arrivals ',
          caption: 'Fresh styles every week',
          imageUrl: 'https://cdn.example.com/slide.jpg',
          href: '/collections/new',
          active: true,
        },
        {
          title: '',
          caption: '',
          imageUrl: '',
        },
      ],
      notification: {
        message: 'Free shipping over $50',
        type: 'success',
        ctaLabel: 'Learn more',
        ctaHref: '/shipping',
        enabled: true,
      },
      couponBlocks: [
        {
          title: 'Welcome coupon',
          description: 'Take 10% off your first order',
          code: 'WELCOME10',
          expiresAt: '2030-01-01T00:00:00.000Z',
          enabled: true,
        },
        {
          title: '',
          description: '',
          code: '',
        },
      ],
      categoryCapsules: {
        heading: {
          eyebrow: 'Curated Universes',
          title: 'Shop by story',
          subtitle: 'Elevated edits each week',
        },
        cta: {
          label: 'View all stories',
          href: '/stories',
        },
        items: [
          {
            name: 'Modern Home',
            description: 'Interior icons for mindful spaces',
            href: '/category/modern-home',
            badge: 'Story 1',
            mediaUrl: 'https://cdn.example.com/cat.jpg',
          },
        ],
      },
      brandHighlights: {
        heading: {
          eyebrow: 'Partner studios',
          title: 'Brands we love',
        },
        items: [
          {
            name: 'Studio Nova',
            description: 'Analog meets digital soundscapes',
            logoUrl: 'https://cdn.example.com/logo.svg',
            href: '/brands/studio-nova',
          },
        ],
      },
      testimonials: {
        heading: {
          eyebrow: 'Seller voices',
          title: 'Why creators choose us',
        },
        items: [
          {
            quote: 'A flagship experience from day one.',
            name: 'Casey Lee',
            role: 'Founder, Arc Supply',
            avatarUrl: 'https://cdn.example.com/avatar.jpg',
          },
        ],
      },
      sellerCta: {
        heading: 'Launch your flagship',
        body: 'Apply to join a collective of design-led brands.',
        primaryCta: { label: 'Apply now', href: '/seller/apply' },
        secondaryCta: { label: 'View guidelines', href: '/seller/guidelines' },
      },
      theme: {
        activePreset: 'twilight',
        availablePresets: [
          { key: 'daylight', name: 'Daylight', mode: 'day', accent: '#6366f1' },
          { key: 'twilight', name: 'Twilight', mode: 'night', accent: '#f97316' },
        ],
        overrides: {
          '--hero-background': 'radial-gradient(circle, rgba(99,102,241,0.18), transparent)',
        },
      },
    };

    const res = await request(app)
      .put('/api/admin/homepage')
      .set('Authorization', adminHeader)
      .send(payload)
      .expect(200);

    expect(res.body.content.hero.title).toBe('Summer savings');
    expect(res.body.content.carousel).toHaveLength(1);
    expect(res.body.content.carousel[0]).toMatchObject({
      title: 'New Arrivals',
      order: 0,
      active: true,
    });
    expect(res.body.content.notification).toMatchObject({
      message: 'Free shipping over $50',
      type: 'success',
      enabled: true,
    });
    expect(res.body.content.couponBlocks).toHaveLength(1);
    expect(res.body.content.couponBlocks[0]).toMatchObject({
      code: 'WELCOME10',
      enabled: true,
    });
    expect(res.body.content.categoryCapsules.items).toHaveLength(1);
    expect(res.body.content.categoryCapsules.heading.title).toBe('Shop by story');
    expect(res.body.content.brandHighlights.items[0]).toMatchObject({ name: 'Studio Nova' });
    expect(res.body.content.testimonials.items[0]).toMatchObject({ name: 'Casey Lee' });
    expect(res.body.content.sellerCta).toMatchObject({ heading: 'Launch your flagship' });
    expect(res.body.content.theme).toMatchObject({ activePreset: 'twilight' });

    const stored = await HomePageContent.findOne({ slug: 'default' }).lean();
    expect(stored.hero.title).toBe('Summer savings');
    expect(stored.updatedBy.toString()).toBe(adminUser._id.toString());
    expect(new Date(stored.couponBlocks[0].expiresAt).toISOString()).toBe('2030-01-01T00:00:00.000Z');
    expect(stored.theme.activePreset).toBe('twilight');

    const publicRes = await request(app)
      .get('/api/homepage')
      .expect(200);
    expect(publicRes.body.content.hero.title).toBe('Summer savings');
    expect(publicRes.body.content.theme.activePreset).toBe('twilight');
  });

  test('manages homepage collections via item endpoints', async () => {
    await request(app)
      .post('/api/admin/homepage/items')
      .set('Authorization', adminHeader)
      .send({
        collection: 'carousel',
        item: {
          title: 'Editorial spotlight',
          imageUrl: 'https://cdn.example.com/hero.jpg',
          href: '/collections/editorial',
        },
      })
      .expect(201);

    await request(app)
      .post('/api/admin/homepage/items')
      .set('Authorization', adminHeader)
      .send({
        collection: 'carousel',
        item: {
          title: 'Limited capsule',
          imageUrl: 'https://cdn.example.com/capsule.jpg',
          href: '/collections/capsule',
        },
      })
      .expect(201);

    let doc = await HomePageContent.findOne({ slug: 'default' }).lean();
    expect(doc.carousel).toHaveLength(2);

    await request(app)
      .patch('/api/admin/homepage/reorder')
      .set('Authorization', adminHeader)
      .send({ collection: 'carousel', order: [1, 0] })
      .expect(200);

    doc = await HomePageContent.findOne({ slug: 'default' }).lean();
    expect(doc.carousel[0].title).toBe('Limited capsule');
    expect(doc.carousel[0].order).toBe(0);

    await request(app)
      .delete('/api/admin/homepage/items')
      .set('Authorization', adminHeader)
      .send({ collection: 'carousel', index: 0 })
      .expect(200);

    doc = await HomePageContent.findOne({ slug: 'default' }).lean();
    expect(doc.carousel).toHaveLength(1);
    expect(doc.carousel[0].title).toBe('Editorial spotlight');
  });
});
