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
import CatalogVariant from '../../model/catalog-variant.model.js';

const app = () => request(getApp());

async function createAdminAuth() {
  const user = await createUser({
    email: `admin-${Date.now()}@example.com`,
    roles: ['customer', 'admin'],
  });
  const token = createAuthHeader(user);
  return { user, token };
}

async function seedCatalogProduct(authHeader) {
  const response = await app()
    .post('/api/admin/catalog/products')
    .set('Authorization', authHeader)
    .send({
      name: 'Pro Wireless Mouse',
      brand: 'Acme',
      description: 'High precision mouse',
      variants: [
        {
          sku: 'MOUSE-STD',
          pricing: { listPrice: 49.99 },
        },
        {
          sku: 'MOUSE-PRO',
          pricing: { listPrice: 69.99, compareAtPrice: 79.99 },
        },
      ],
    })
    .expect(201);

  return response.body;
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

describe('Admin catalog management', () => {
  it('creates catalog products with variants and returns the contract shape', async () => {
    const { token } = await createAdminAuth();

    const { product, variants } = await seedCatalogProduct(token);

    expect(product).toBeDefined();
    expect(product).toMatchObject({
      name: 'Pro Wireless Mouse',
      brand: 'Acme',
      slug: expect.stringContaining('pro-wireless-mouse'),
      status: 'draft',
      moderationState: 'pending',
    });
    expect(Array.isArray(variants)).toBe(true);
    expect(variants).toHaveLength(2);
    variants.forEach((variant) => {
      expect(variant).toMatchObject({
        catalogProduct: product._id,
        pricing: {
          currency: 'USD',
          listPrice: expect.any(Number),
        },
      });
    });

    const storedVariants = await CatalogVariant.find({ catalogProduct: product._id });
    expect(storedVariants).toHaveLength(2);
  });

  it('updates and deletes catalog variants', async () => {
    const { token } = await createAdminAuth();
    const { product, variants } = await seedCatalogProduct(token);
    const variantToUpdate = variants[0];

    const updateResponse = await app()
      .patch(`/api/admin/catalog/variants/${variantToUpdate._id}`)
      .set('Authorization', token)
      .send({
        pricing: { listPrice: 59.99 },
        status: 'active',
      })
      .expect(200);

    expect(updateResponse.body.variant.pricing.listPrice).toBeCloseTo(59.99);
    expect(updateResponse.body.variant.status).toBe('active');

    await app()
      .delete(`/api/admin/catalog/variants/${variantToUpdate._id}`)
      .set('Authorization', token)
      .expect(204);

    const remaining = await CatalogVariant.find({ catalogProduct: product._id });
    expect(remaining).toHaveLength(1);
  });

  it('manages seller listings via admin endpoints with filters', async () => {
    const { token } = await createAdminAuth();
    const { product, variants } = await seedCatalogProduct(token);

    const sellerUser = await createUser({
      email: `seller-${Date.now()}@example.com`,
      roles: ['customer', 'seller'],
    });
    const { seller } = await ensureSellerForUser(sellerUser, { displayName: 'Best Seller' });

    const listingResponse = await app()
      .post('/api/admin/catalog/listings')
      .set('Authorization', token)
      .send({
        sellerId: seller._id,
        catalogProductId: product._id,
        status: 'active',
        moderationState: 'approved',
        offers: [
          { variant: variants[0]._id, price: 64.99 },
          { variant: variants[1]._id, price: 84.99 },
        ],
      })
      .expect(201);

    expect(listingResponse.body.listing).toMatchObject({
      seller: expect.objectContaining({ _id: seller._id.toString() }),
      catalogProduct: expect.objectContaining({ _id: product._id.toString() }),
      status: 'active',
      offers: expect.arrayContaining([
        expect.objectContaining({ price: 64.99 }),
        expect.objectContaining({ price: 84.99 }),
      ]),
    });

    const listResponse = await app()
      .get('/api/admin/catalog/listings?status=active')
      .set('Authorization', token)
      .expect(200);

    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].offers).toHaveLength(2);

    const forbiddenResponse = await app()
      .post('/api/admin/catalog/products')
      .set('Authorization', createAuthHeader(sellerUser))
      .send({ name: 'Unauthorized Product', variants: [{ sku: 'NOPE', pricing: { listPrice: 10 } }] });

    expect(forbiddenResponse.status).toBe(403);

    const catalogList = await app()
      .get('/api/admin/catalog/products')
      .set('Authorization', token)
      .expect(200);

    expect(catalogList.body.items[0]).toHaveProperty('variantCount', 2);
  });
});
