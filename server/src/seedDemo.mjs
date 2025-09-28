import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import User from './model/user.model.js';
import Category from './model/category.model.js';
import Product from './model/product.model.js';
import Brand from './model/brand.model.js';
import Seller from './model/seller.model.js';
import Shop from './model/shop.model.js';
import { sanitizeRoles } from './lib/roles.js';
import { ensureDefaultVariantForProduct, receiveStock } from './controller/inventory.controller.js';

dotenv.config();

async function createUser({ name, email, passwordHash, roles }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, passwordHash, roles: sanitizeRoles(roles) });
}

async function ensureCategory({ name, slug, description = '', image = '' }) {
  let category = await Category.findOne({ slug });
  if (!category) {
    category = await Category.create({ name, slug, description, image, isActive: true, sortOrder: 0 });
  }
  return category;
}

async function ensureBrand({ name, slug, logo, description, website }) {
  let brand = await Brand.findOne({ slug });
  if (!brand) {
    brand = await Brand.create({ name, slug, logo, description, website, status: 'active', sortOrder: 0 });
  }
  return brand;
}

async function ensureSeller({ userId, displayName, legalName, contact, shopConfig, themeKey }) {
  let seller = await Seller.findOne({ user: userId });
  if (!seller) {
    seller = await Seller.create({
      user: userId,
      displayName,
      legalName,
      status: 'approved',
      verificationStatus: 'verified',
      contact,
      metrics: { totalOrders: 1250, grossMerchandiseValue: 879545 },
      notes: 'Demo seller for marketplace tour.',
    });
  }

  let shop = await Shop.findOne({ seller: seller._id });
  if (!shop) {
    shop = await Shop.create({
      seller: seller._id,
      name: shopConfig.name,
      slug: shopConfig.slug,
      tagLine: shopConfig.tagLine,
      description: shopConfig.description,
      theme: { preset: themeKey },
      status: 'published',
    });
  }

  return { seller, shop };
}

async function ensureProduct(payload) {
  let product = await Product.findOne({ slug: payload.slug });
  if (!product) {
    product = await Product.create(payload);
    await ensureDefaultVariantForProduct(product._id);
    await receiveStock({ productId: product._id, qty: payload.stock || 20, reason: 'demo_seed' });
  }
  return product;
}

async function main() {
  await connectDB();

  const passwordHash = '$2a$10$1r3DY9nqCuWHa3gwPrm3eOThIWQYtUSxZ34rnOG0r8dGS2ymlk/w.'; // "Password123" hashed

  const categories = [
    { name: 'Electronics', slug: 'electronics', description: 'Phones, gadgets, smart home and accessories.' },
    { name: 'Home', slug: 'home', description: 'Furniture, decor, kitchen and more.' },
    { name: 'Fashion', slug: 'fashion', description: 'Apparel, footwear and accessories.' },
    { name: 'Beauty', slug: 'beauty', description: 'Skincare, cosmetics and personal care.' },
    { name: 'Sports', slug: 'sports', description: 'Fitness, outdoor and active lifestyle.' },
  ];
  const categoryDocs = await Promise.all(categories.map(ensureCategory));
  const categoryMap = Object.fromEntries(categoryDocs.map((doc) => [doc.slug, doc]));

  const brands = [
    {
      name: 'Aperture Labs',
      slug: 'aperture-labs',
      logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=60',
      description: 'Cutting-edge gadgets engineered for modern life.',
      website: 'https://example.com/aperture',
    },
    {
      name: 'Urban Habitat',
      slug: 'urban-habitat',
      logo: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=200&q=60',
      description: 'Minimalist home & living essentials.',
      website: 'https://example.com/urban-habitat',
    },
    {
      name: 'Atlas Active',
      slug: 'atlas-active',
      logo: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=200&q=60',
      description: 'Performance-driven sportswear for every adventure.',
      website: 'https://example.com/atlas-active',
    },
  ];
  const brandDocs = await Promise.all(brands.map(ensureBrand));
  const brandMap = Object.fromEntries(brandDocs.map((doc) => [doc.slug, doc]));

  const sellersConfig = [
    {
      name: 'Aurora Tech',
      email: 'seller1@example.com',
      displayName: 'Aurora Tech Outlet',
      legalName: 'Aurora Technology LLC',
      themeKey: 'techpulse',
      shop: {
        name: 'Aurora Tech Outlet',
        slug: 'aurora-tech-outlet',
        tagLine: 'Next-gen gadgets curated daily',
        description: 'Amazon-style tech storefront featuring deals of the day and verified sellers.',
      },
    },
    {
      name: 'Hearth & Home',
      email: 'seller2@example.com',
      displayName: 'Hearth & Home Collective',
      legalName: 'Hearth Home Co.',
      themeKey: 'sunrise',
      shop: {
        name: 'Hearth & Home Collective',
        slug: 'hearth-home-collective',
        tagLine: 'Warm, welcoming home essentials',
        description: 'Furniture and decor showcased in lifestyle collections reminiscent of Amazon Home.',
      },
    },
    {
      name: 'Momentum Sports',
      email: 'seller3@example.com',
      displayName: 'Momentum Sports Hub',
      legalName: 'Momentum Sports Ltd.',
      themeKey: 'modern',
      shop: {
        name: 'Momentum Sports Hub',
        slug: 'momentum-sports-hub',
        tagLine: 'Gear that keeps up with you',
        description: 'Activewear, equipment and outdoor essentials curated into shoppable rails.',
      },
    },
  ];

  const sellerDocs = [];
  for (const sellerConfig of sellersConfig) {
    const user = await createUser({
      name: sellerConfig.name,
      email: sellerConfig.email,
      passwordHash,
      roles: ['seller'],
    });
    const { seller, shop } = await ensureSeller({
      userId: user._id,
      displayName: sellerConfig.displayName,
      legalName: sellerConfig.legalName,
      contact: { phone: '+1 (555) 010-5678', email: sellerConfig.email, supportEmail: 'support@example.com' },
      shopConfig: sellerConfig.shop,
      themeKey: sellerConfig.themeKey,
    });
    sellerDocs.push({ seller, shop });
  }

  const products = [
    {
      title: 'Aperture Nova Smart Speaker',
      slug: 'aperture-nova-speaker',
      description: 'Voice assistant with immersive 360° audio and Amazon-style skill integrations.',
      price: 129.99,
      compareAtPrice: 149.99,
      images: [
        'https://images.unsplash.com/photo-1517059224940-d4af9eec41e5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80',
      ],
      brand: brandMap['aperture-labs']._id,
      categories: [categoryMap.electronics._id],
      sellerIndex: 0,
      stock: 80,
      tags: ['deal-of-the-day'],
    },
    {
      title: 'LumaGlow Ambient Floor Lamp',
      slug: 'lumaglow-floor-lamp',
      description: 'Smart RGB lamp with app control, inspired by Amazon’s premium lighting showcases.',
      price: 89.0,
      images: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
      ],
      brand: brandMap['urban-habitat']._id,
      categories: [categoryMap.home._id],
      sellerIndex: 1,
      stock: 120,
      tags: ['amazon-choice'],
    },
    {
      title: 'Momentum TrailRunner Pro Shoes',
      slug: 'momentum-trailrunner-pro',
      description: 'Performance sneakers engineered for trail comfort and durability.',
      price: 139.5,
      images: [
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
      ],
      brand: brandMap['atlas-active']._id,
      categories: [categoryMap.sports._id, categoryMap.fashion._id],
      sellerIndex: 2,
      stock: 65,
      tags: ['best-seller'],
    },
    {
      title: 'Hearthstone Cast Iron Skillet Set',
      slug: 'hearthstone-cast-iron-skillet-set',
      description: 'Classic cast iron skillet duo pre-seasoned for kitchen-to-table versatility.',
      price: 74.99,
      images: [
        'https://images.unsplash.com/photo-1506368083636-6defb67639e0?auto=format&fit=crop&w=1200&q=80',
      ],
      brand: brandMap['urban-habitat']._id,
      categories: [categoryMap.home._id],
      sellerIndex: 1,
      stock: 90,
      tags: ['home-essentials'],
    },
    {
      title: 'Aperture Horizon 4K Drone',
      slug: 'aperture-horizon-4k-drone',
      description: 'Foldable drone with 4K camera, 3-axis gimbal and 35-minute flight time.',
      price: 599.0,
      images: [
        'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1200&q=80',
      ],
      brand: brandMap['aperture-labs']._id,
      categories: [categoryMap.electronics._id, categoryMap.sports._id],
      sellerIndex: 0,
      stock: 40,
      tags: ['top-rated'],
    },
    {
      title: 'Momentum Flex Resistance Band Kit',
      slug: 'momentum-flex-band-kit',
      description: 'Color-coded resistance bands with anchor system for versatile workouts.',
      price: 59.99,
      images: [
        'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1200&q=80',
      ],
      brand: brandMap['atlas-active']._id,
      categories: [categoryMap.sports._id],
      sellerIndex: 2,
      stock: 110,
      tags: ['amazon-choice'],
    },
  ];

  for (const productConfig of products) {
    const { seller, shop } = sellerDocs[productConfig.sellerIndex];
    await ensureProduct({
      title: productConfig.title,
      slug: productConfig.slug,
      description: productConfig.description,
      price: productConfig.price,
      compareAtPrice: productConfig.compareAtPrice,
      images: productConfig.images,
      brand: productConfig.brand,
      categories: productConfig.categories,
      seller: seller._id,
      shop: shop._id,
      status: 'active',
      stock: productConfig.stock,
      tags: productConfig.tags,
      visibility: 'public',
    });
  }

  console.log('✅ Demo marketplace data seeded');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  mongoose.connection.close();
  process.exit(1);
});
