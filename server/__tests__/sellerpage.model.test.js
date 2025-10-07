import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import SellerPageContent, { SELLER_HERO_DEFAULTS, SELLER_THEME_DEFAULTS } from '../model/seller-page-content.model.js';

describe('SellerPageContent model', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'seller-page-model-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('applies defaults for hero, theme, and collections', async () => {
    const doc = await SellerPageContent.create({});

    expect(doc.slug).toBe('default');
    expect(doc.hero).toMatchObject({
      eyebrow: SELLER_HERO_DEFAULTS.eyebrow,
      title: SELLER_HERO_DEFAULTS.title,
    });
    expect(Array.isArray(doc.pillars)).toBe(true);
    expect(Array.isArray(doc.callouts)).toBe(true);
    expect(Array.isArray(doc.testimonials)).toBe(true);
    expect(Array.isArray(doc.faqs)).toBe(true);
    expect(doc.contact.headline).toBeTruthy();
    expect(doc.theme).toMatchObject({
      heroGradient: SELLER_THEME_DEFAULTS.heroGradient,
    });
  });

  it('increments version on modification', async () => {
    const doc = await SellerPageContent.create({ hero: { title: 'Original' } });
    const version = doc.version;

    doc.hero.title = 'Updated';
    await doc.save();

    expect(doc.version).toBe(version + 1);
  });
});
