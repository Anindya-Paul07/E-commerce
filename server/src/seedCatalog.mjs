import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CatalogProduct from './model/catalog-product.model.js';
import CatalogVariant from './model/catalog-variant.model.js';

dotenv.config();

const { MONGO_URI = 'mongodb://127.0.0.1:27017/ecom' } = process.env;

async function seedCatalog() {
  await mongoose.connect(MONGO_URI);

  const existing = await CatalogProduct.countDocuments();
  if (existing > 0) {
    console.log('Catalog products already seeded. Skipping.');
    await mongoose.disconnect();
    return;
  }

  const now = new Date();

  const catalogProducts = [
    {
      name: 'Eco Essentials Water Bottle',
      slug: 'eco-essentials-water-bottle',
      summary: 'Insulated stainless steel bottle for daily hydration.',
      description: 'Keeps beverages cold for 24 hours and hot for 12 hours.',
      status: 'active',
      moderationState: 'approved',
      brand: 'Eco Essentials',
      tags: ['hydration', 'eco'],
      defaultImage: '/uploads/fixture-bottle.jpg',
      images: ['/uploads/fixture-bottle.jpg'],
      attributes: [
        { key: 'capacity', value: '750', unit: 'ml' },
        { key: 'material', value: 'stainless steel' },
      ],
      metadata: { seededAt: now },
      variants: [
        {
          sku: 'BOTTLE-750-BLK',
          title: 'Black 750ml',
          status: 'active',
          pricing: { currency: 'USD', listPrice: 28.99 },
        },
        {
          sku: 'BOTTLE-750-GLD',
          title: 'Gold 750ml',
          status: 'active',
          pricing: { currency: 'USD', listPrice: 29.99 },
        },
      ],
    },
    {
      name: 'ComfyCloud Memory Foam Pillow',
      slug: 'comfycloud-memory-foam-pillow',
      summary: 'Adaptive memory foam pillow with cooling gel layer.',
      description: 'Ergonomic support for restful sleep.',
      status: 'active',
      moderationState: 'approved',
      brand: 'ComfyCloud',
      tags: ['sleep', 'comfort'],
      defaultImage: '/uploads/fixture-pillow.jpg',
      images: ['/uploads/fixture-pillow.jpg'],
      attributes: [
        { key: 'size', value: 'Standard' },
        { key: 'cover', value: 'removable and washable' },
      ],
      metadata: { seededAt: now },
      variants: [
        {
          sku: 'PILLOW-STD',
          title: 'Standard',
          status: 'active',
          pricing: { currency: 'USD', listPrice: 39.99 },
        },
      ],
    },
  ];

  for (const entry of catalogProducts) {
    const { variants = [], ...productData } = entry;
    const product = await CatalogProduct.create(productData);
    const payloads = variants.map((variant) => ({
      ...variant,
      catalogProduct: product._id,
    }));
    if (payloads.length) await CatalogVariant.insertMany(payloads);
  }

  await mongoose.disconnect();
  console.log('Catalog products seeded successfully.');
}

seedCatalog().catch(async (error) => {
  console.error('Failed to seed catalog products', error);
  await mongoose.disconnect();
  process.exit(1);
});
