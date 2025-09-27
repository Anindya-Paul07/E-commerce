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
  },
  { timestamps: true }
);

shopSchema.index({ slug: 1 });
shopSchema.index({ status: 1 });
shopSchema.index({ 'metrics.boostedScore': -1 });

export default mongoose.model('Shop', shopSchema);
