import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import HomePageContent from '../model/home-page-content.model.js';

describe('HomePageContent model', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri(), { dbName: 'homepage-model-test' });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('applies defaults for slug, hero, notification and extended sections', async () => {
    const doc = await HomePageContent.create({});

    expect(doc.slug).toBe('default');
    expect(doc.hero).toMatchObject({
      title: '',
      subtitle: '',
      enabled: true,
    });
    expect(doc.notification).toMatchObject({
      message: '',
      enabled: false,
    });
    expect(doc.categoryCapsules?.heading?.title).toBeTruthy();
    expect(Array.isArray(doc.categoryCapsules?.items)).toBe(true);
    expect(doc.brandHighlights?.heading?.title).toBeTruthy();
    expect(Array.isArray(doc.brandHighlights?.items)).toBe(true);
    expect(doc.testimonials?.heading?.title).toBeTruthy();
    expect(Array.isArray(doc.testimonials?.items)).toBe(true);
    expect(doc.sellerCta?.heading).toBeTruthy();
    expect(doc.theme).toMatchObject({ activePreset: 'daylight' });
    expect(doc.version).toBe(1);
  });

  it('increments the content version when modified', async () => {
    const doc = await HomePageContent.create({ hero: { title: 'Welcome' } });
    const initialVersion = doc.version;

    doc.hero.title = 'Updated headline';
    await doc.save();

    expect(doc.version).toBe(initialVersion + 1);
  });
});
