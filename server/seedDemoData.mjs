import 'dotenv/config.js';
import mongoose from 'mongoose';

import Category from './model/category.model.js';
import Brand from './model/brands.model.js';
import Product from './model/product.model.js';
import Warehouse from './model/warehouse.model.js';

const { MONGO_URI = 'mongodb://127.0.0.1:27017/ecom' } = process.env;

function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const categorySeed = [
  {
    name: 'Future Fashion',
    slug: 'future-fashion',
    description: 'Next-gen apparel and accessories crafted with adaptive textiles and modular design.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
  },
  {
    name: 'Home Studio',
    slug: 'home-studio',
    description: 'Acoustic essentials, desk setups, and instruments for the modern creator.',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
  },
  {
    name: 'Wellness Rituals',
    slug: 'wellness-rituals',
    description: 'Daily routines engineered for recovery, mindfulness, and longevity.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 3,
  },
  {
    name: 'Travel Atelier',
    slug: 'travel-atelier',
    description: 'Carry-on heroes and multi-use gear designed for global movement.',
    image: 'https://images.unsplash.com/photo-1529753253655-470be9a42781?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 4,
  },
];

const brandSeed = [
  {
    name: 'Studio Nova',
    description: 'Sound-forward lifestyle systems engineered for warm analog experiences.',
    logo: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80',
    website: 'https://studionova.example',
    sortOrder: 1,
  },
  {
    name: 'Aether & Co.',
    description: 'Tactile interior essentials blending recycled materials and ambient tech.',
    logo: 'https://images.unsplash.com/photo-1616628182501-d48a34f494a4?auto=format&fit=crop&w=400&q=80',
    website: 'https://aetherco.example',
    sortOrder: 2,
  },
  {
    name: 'Helix Athletics',
    description: 'Adaptive performance wear with biometric fabrics and modular layers.',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80',
    website: 'https://helixathletics.example',
    sortOrder: 3,
  },
];

const warehouseSeed = [
  {
    name: 'Brooklyn Fulfillment Hub',
    code: 'BK-1',
    address: {
      line1: '25 River Street',
      city: 'Brooklyn',
      state: 'NY',
      postalCode: '11201',
      country: 'USA',
    },
    isDefault: true,
  },
  {
    name: 'Los Angeles Micro-Fulfillment',
    code: 'LA-1',
    address: {
      line1: '845 Sunset Boulevard',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90012',
      country: 'USA',
    },
    isDefault: false,
  },
];

const productSeed = [
  {
    title: 'Aurora Wireless Headphones',
    slug: 'aurora-wireless-headphones',
    description: 'Adaptive noise-cancelling headphones with spatial audio profiling.',
    price: 199,
    compareAtPrice: 249,
    images: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    ],
    brand: 'Studio Nova',
    categories: ['home-studio'],
    tags: ['audio', 'wireless', 'bluetooth'],
    stock: 120,
  },
  {
    title: 'Lumen Adaptive Lamp',
    slug: 'lumen-adaptive-lamp',
    description: 'Smart desktop lighting with circadian-friendly warmth scheduling.',
    price: 148,
    compareAtPrice: 189,
    images: [
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    ],
    brand: 'Aether & Co.',
    categories: ['home-studio'],
    tags: ['lighting', 'workspace'],
    stock: 80,
  },
  {
    title: 'Flux Seamless Blazer',
    slug: 'flux-seamless-blazer',
    description: 'Machine-washable blazer with thermo-regulating yarn for all-day wear.',
    price: 228,
    compareAtPrice: 268,
    images: [
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
    ],
    brand: 'Helix Athletics',
    categories: ['future-fashion'],
    tags: ['apparel', 'workwear'],
    stock: 65,
  },
  {
    title: 'Serene Ritual Diffuser',
    slug: 'serene-ritual-diffuser',
    description: 'Ultrasonic diffuser with biofeedback integration and timer presets.',
    price: 98,
    images: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    ],
    brand: 'Aether & Co.',
    categories: ['wellness-rituals'],
    tags: ['wellness', 'aromatherapy'],
    stock: 110,
  },
  {
    title: 'Velocity Modular Duffel',
    slug: 'velocity-modular-duffel',
    description: 'Travel-ready duffel with detachable tech pouch and compression panels.',
    price: 168,
    images: [
      'https://images.unsplash.com/photo-1529603993320-37aa1c66b0d3?auto=format&fit=crop&w=1200&q=80',
    ],
    brand: 'Helix Athletics',
    categories: ['travel-atelier'],
    tags: ['travel', 'gear'],
    stock: 90,
  },
  {
    title: 'Pulse Recovery Mat',
    slug: 'pulse-recovery-mat',
    description: 'Infrared recovery mat with targeted compression capsules for athletes.',
    price: 245,
    images: [
      'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1200&q=80',
    ],
    brand: 'Helix Athletics',
    categories: ['wellness-rituals'],
    tags: ['recovery', 'wellness'],
    stock: 55,
  },
];

async function upsertCategories() {
  const operations = categorySeed.map(async (category) => {
    const slug = category.slug || slugify(category.name);
    const doc = await Category.findOneAndUpdate(
      { slug },
      {
        ...category,
        slug,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc;
  });
  const docs = await Promise.all(operations);
  console.log(`✅ Seeded ${docs.length} categories`);
  return docs;
}

async function upsertBrands() {
  const operations = brandSeed.map(async (brand) => {
    const slug = brand.slug || slugify(brand.name);
    const doc = await Brand.findOneAndUpdate(
      { slug },
      {
        ...brand,
        slug,
        status: 'active',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc;
  });
  const docs = await Promise.all(operations);
  console.log(`✅ Seeded ${docs.length} brands`);
  return docs;
}

async function upsertWarehouses() {
  const operations = warehouseSeed.map(async (warehouse) => {
    const doc = await Warehouse.findOneAndUpdate(
      { code: warehouse.code },
      warehouse,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc;
  });
  const docs = await Promise.all(operations);
  console.log(`✅ Seeded ${docs.length} warehouses`);
  return docs;
}

async function upsertProducts(categoryDocs) {
  const categoryMap = new Map(categoryDocs.map((doc) => [doc.slug, doc._id]));

  const operations = productSeed.map(async (product) => {
    const slug = product.slug || slugify(product.title);
    const categoryIds = (product.categories || [])
      .map((categorySlug) => categoryMap.get(categorySlug))
      .filter(Boolean);

    const payload = {
      ...product,
      slug,
      categories: categoryIds,
      status: 'active',
      visibility: 'public',
      metadata: { seeded: true },
    };

    const doc = await Product.findOneAndUpdate(
      { slug },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc;
  });
  const docs = await Promise.all(operations);
  console.log(`✅ Seeded ${docs.length} products`);
  return docs;
}

async function main() {
  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB_NAME || undefined });
  console.log('🌱 Connected to MongoDB');

  const categories = await upsertCategories();
  await Promise.all([upsertBrands(), upsertWarehouses()]);
  await upsertProducts(categories);

  await mongoose.disconnect();
  console.log('🌿 Demo data seeding complete');
}

main().catch(async (error) => {
  console.error('❌ Failed to seed demo data', error);
  await mongoose.disconnect();
  process.exit(1);
});
