import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema(
  {
    preset: { type: String, trim: true, default: 'modern' },
    palette: {
      primary: { type: String, trim: true, default: '#0f766e' },
      secondary: { type: String, trim: true, default: '#0ea5e9' },
      accent: { type: String, trim: true, default: '#facc15' },
      background: { type: String, trim: true, default: '#ffffff' },
      foreground: { type: String, trim: true, default: '#0f172a' },
    },
    typography: {
      heading: { type: String, trim: true, default: 'Inter' },
      body: { type: String, trim: true, default: 'Inter' },
    },
    layout: {
      heroStyle: { type: String, trim: true, default: 'split' },
      productCard: { type: String, trim: true, default: 'glass' },
      navigation: { type: String, trim: true, default: 'floating' },
      showVideoHero: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

themeSchema.index({ preset: 1 });

const socialSchema = new mongoose.Schema(
  {
    platform: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const heroAssetSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, trim: true },
    headline: { type: String, trim: true },
    subheadline: { type: String, trim: true },
    ctaLabel: { type: String, trim: true },
    ctaHref: { type: String, trim: true },
  },
  { _id: false }
);

const marketingHeroSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    backgroundImage: { type: String, trim: true, default: '' },
    primaryCta: {
      label: { type: String, trim: true, default: '' },
      href: { type: String, trim: true, default: '' },
    },
    secondaryCta: {
      label: { type: String, trim: true, default: '' },
      href: { type: String, trim: true, default: '' },
    },
  },
  { _id: false }
);

const marketingCarouselSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    href: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const marketingPaletteSchema = new mongoose.Schema(
  {
    accentColor: { type: String, trim: true, default: '' },
    heroGradient: { type: String, trim: true, default: '' },
    backgroundStyle: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const MARKETING_HERO_DEFAULTS = Object.freeze({
  eyebrow: 'Inside the flagship',
  title: 'Welcome to our storefront',
  subtitle: 'Curated collections and signature releases from our studio.',
  backgroundImage: '',
  primaryCta: { label: 'Shop collection', href: '/products' },
  secondaryCta: { label: 'Contact us', href: '/support' },
});

const MARKETING_PALETTE_DEFAULTS = Object.freeze({
  accentColor: '#6366f1',
  heroGradient: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.08))',
  backgroundStyle: 'radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 55%)',
});

const shopSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    tagLine: { type: String, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden'],
      default: 'draft',
      index: true,
    },
    hero: heroAssetSchema,
    logoUrl: { type: String, trim: true },
    coverImageUrl: { type: String, trim: true },
    theme: themeSchema,
    seo: {
      title: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      keywords: { type: [String], default: [] },
    },
    featureFlags: {
      showFeaturedProducts: { type: Boolean, default: true },
      showTestimonials: { type: Boolean, default: false },
      showStorySection: { type: Boolean, default: false },
      allowCustomLandingPages: { type: Boolean, default: false },
    },
    featuredProductIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      default: [],
    },
    socials: { type: [socialSchema], default: [] },
    badges: {
      type: [
        {
          label: { type: String, trim: true },
          icon: { type: String, trim: true },
          issuedAt: { type: Date, default: () => new Date() },
          expiresAt: { type: Date },
        },
      ],
      default: [],
    },
    metrics: {
      visits30d: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      boostedScore: { type: Number, default: 0 },
      lastBoostedAt: { type: Date },
    },
    settings: {
      preferredLocale: { type: String, default: 'en' },
      country: { type: String, default: 'US' },
      currency: { type: String, default: 'USD' },
      fulfillmentMode: { type: String, enum: ['platform', 'hybrid'], default: 'platform' },
    },
    marketing: {
      hero: { type: marketingHeroSchema, default: () => ({ ...MARKETING_HERO_DEFAULTS }) },
      carousel: { type: [marketingCarouselSchema], default: () => [] },
      palette: { type: marketingPaletteSchema, default: () => ({ ...MARKETING_PALETTE_DEFAULTS }) },
      version: { type: Number, default: 1 },
      published: { type: Boolean, default: true },
      updatedAt: { type: Date, default: () => new Date() },
    },
  },
  { timestamps: true }
);

shopSchema.index({ slug: 1 });
shopSchema.index({ status: 1 });
shopSchema.index({ 'metrics.boostedScore': -1 });

export default mongoose.model('Shop', shopSchema);
