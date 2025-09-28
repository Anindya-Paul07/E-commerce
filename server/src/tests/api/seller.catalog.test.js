import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  setupDatabase,
  teardownDatabase,
  resetDatabase,
  getApp,
  createUser,
  createAuthHeader,
  ensureSellerForUser,
} from '../utils/test-app.js';
import CatalogProduct from '../../model/catalog-product.model.js';
import CatalogVariant from '../../model/catalog-variant.model.js';

const app = () => request(getApp());

async function seedCatalog() {
  const product = await CatalogProduct.create({
    name: 'Handcrafted Mug',
    slug: `handcrafted-mug-${Date.now()}`,
    brand: 'Artisan Co',
    status: 'draft',
    moderationState: 'approved',
    lifecycle: 'active',
  });

  const variant = await CatalogVariant.create({
    catalogProduct: product._id,
    sku: `MUG-${Date.now()}`,
    title: 'Standard Mug',
    status: 'active',
    pricing: { currency: 'USD', listPrice: 24.5 },
  });

  return { product, variant };
}

async function createSellerContext() {
  const user = await createUser({ email: `seller-${Date.now()}@example.com`, roles: ['customer'] });
  const { seller } = await ensureSellerForUser(user, { displayName: 'Craft Seller' });
  const token = createAuthHeader(user);
  return { user, seller, token };
}

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('Seller catalog listings', () => {
  it('allows sellers to create, list, and update their listings', async () => {
    const { product, variant } = await seedCatalog();
    const { token } = await createSellerContext();

    const createResponse = await app()
      .post('/api/sellers/listings')
      .set('Authorization', token)
      .send({
        catalogProductId: product._id,
        status: 'draft',
        offers: [{ variant: variant._id, price: 29.99, stock: 5 }],
      })
      .expect(201);

    expect(createResponse.body.listing).toMatchObject({
      catalogProduct: expect.objectContaining({ _id: product._id.toString() }),
      moderationState: 'pending',
      offers: [expect.objectContaining({ price: 29.99, stock: 5 })],
    });

    const listingId = createResponse.body.listing._id;

    const listResponse = await app()
      .get('/api/sellers/listings')
      .set('Authorization', token)
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0]._id).toBe(listingId);

    const updateResponse = await app()
      .patch(`/api/sellers/listings/${listingId}`)
      .set('Authorization', token)
      .send({ offers: [{ variant: variant._id, price: 34.99, stock: 3 }] })
      .expect(200);

    expect(updateResponse.body.listing.offers[0]).toMatchObject({ price: 34.99, stock: 3 });
    expect(updateResponse.body.listing.moderationState).toBe('pending');
  });

  it('prevents sellers from modifying listings they do not own', async () => {
    const { product, variant } = await seedCatalog();
    const { token: ownerToken } = await createSellerContext();

    const listingResponse = await app()
      .post('/api/sellers/listings')
      .set('Authorization', ownerToken)
      .send({
        catalogProductId: product._id,
        offers: [{ variant: variant._id, price: 18.5 }],
      })
      .expect(201);

    const { token: otherSellerToken } = await createSellerContext();

    await app()
      .patch(`/api/sellers/listings/${listingResponse.body.listing._id}`)
      .set('Authorization', otherSellerToken)
      .send({ status: 'active' })
      .expect(404);
  });

  it('returns forbidden for users without seller role', async () => {
    const { product, variant } = await seedCatalog();
    const user = await createUser({ email: `customer-${Date.now()}@example.com`, roles: ['customer'] });
    const token = createAuthHeader(user);

    const response = await app()
      .post('/api/sellers/listings')
      .set('Authorization', token)
      .send({
        catalogProductId: product._id,
        offers: [{ variant: variant._id, price: 19.99 }],
      });

    expect(response.status).toBe(403);
  });
});
