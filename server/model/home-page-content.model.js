import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
    ctaLabel: { type: String, trim: true, default: '' },
    ctaHref: { type: String, trim: true, default: '' },
    backgroundImage: { type: String, trim: true, default: '' },
    eyebrow: { type: String, trim: true, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const carouselItemSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    caption: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    href: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'danger'],
      default: 'info',
    },
    ctaLabel: { type: String, trim: true, default: '' },
    ctaHref: { type: String, trim: true, default: '' },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const couponBlockSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    finePrint: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    href: { type: String, trim: true, default: '' },
    expiresAt: { type: Date },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
},
  { _id: false }
);

const sectionHeadingSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    subtitle: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const categoryCapsuleSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    href: { type: String, trim: true, default: '' },
    badge: { type: String, trim: true, default: '' },
    mediaUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const brandHighlightSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    logoUrl: { type: String, trim: true, default: '' },
    href: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    role: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ctaLinkSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: '' },
    href: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const sellerCtaSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    primaryCta: { type: ctaLinkSchema, default: () => ({}) },
    secondaryCta: { type: ctaLinkSchema, default: () => ({}) },
  },
  { _id: false }
);

const themeMetadataSchema = new mongoose.Schema(
  {
    activePreset: { type: String, trim: true, default: 'daylight' },
    availablePresets: {
      type: [
        {
          key: { type: String, trim: true, required: true },
          name: { type: String, trim: true, required: true },
          mode: { type: String, enum: ['day', 'night'], default: 'day' },
          accent: { type: String, trim: true, default: '' },
        },
      ],
      default: () => [],
    },
    overrides: {
      type: Map,
      of: String,
      default: () => ({}),
    },
  },
  { _id: false }
);

const DEFAULT_NOTIFICATION = Object.freeze({
  message: '',
  type: 'info',
  ctaLabel: '',
  ctaHref: '',
  enabled: false,
});

const DEFAULT_HERO = Object.freeze({
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaHref: '',
  backgroundImage: '',
  eyebrow: '',
  enabled: true,
});

const DEFAULT_CATEGORIES_SECTION = Object.freeze({
  heading: { eyebrow: 'Curated universes', title: 'Shop by editorial universe', subtitle: '' },
  cta: { label: '', href: '' },
  items: [],
});

const DEFAULT_BRANDS_SECTION = Object.freeze({
  heading: { eyebrow: 'Partner studios', title: 'Brands shaping the platform', subtitle: '' },
  items: [],
});

const DEFAULT_TESTIMONIALS_SECTION = Object.freeze({
  heading: { eyebrow: 'Seller voices', title: 'Why creators choose our marketplace', subtitle: '' },
  items: [],
});

const DEFAULT_SELLER_CTA = Object.freeze({
  heading: 'Launch your flagship inside a multi-brand icon',
  body: '',
  primaryCta: { label: '', href: '' },
  secondaryCta: { label: '', href: '' },
});

const DEFAULT_THEME = Object.freeze({
  activePreset: 'daylight',
  availablePresets: [],
  overrides: {},
});

const homePageContentSchema = new mongoose.Schema(
  {
    slug: { type: String, trim: true, unique: true, default: 'default' },
    hero: { type: heroSchema, default: () => ({ ...DEFAULT_HERO }) },
    carousel: { type: [carouselItemSchema], default: [] },
    notification: { type: notificationSchema, default: () => ({ ...DEFAULT_NOTIFICATION }) },
    couponBlocks: { type: [couponBlockSchema], default: [] },
    categoryCapsules: {
      heading: { type: sectionHeadingSchema, default: () => ({ ...DEFAULT_CATEGORIES_SECTION.heading }) },
      cta: { type: ctaLinkSchema, default: () => ({ ...DEFAULT_CATEGORIES_SECTION.cta }) },
      items: { type: [categoryCapsuleSchema], default: () => [] },
    },
    brandHighlights: {
      heading: { type: sectionHeadingSchema, default: () => ({ ...DEFAULT_BRANDS_SECTION.heading }) },
      items: { type: [brandHighlightSchema], default: () => [] },
    },
    testimonials: {
      heading: { type: sectionHeadingSchema, default: () => ({ ...DEFAULT_TESTIMONIALS_SECTION.heading }) },
      items: { type: [testimonialSchema], default: () => [] },
    },
    sellerCta: { type: sellerCtaSchema, default: () => ({ ...DEFAULT_SELLER_CTA }) },
    theme: { type: themeMetadataSchema, default: () => ({ ...DEFAULT_THEME }) },
    version: { type: Number, default: 1 },
    published: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

homePageContentSchema.pre('save', function preSave(next) {
  if (!this.slug) this.slug = 'default';
  if (!this.version) this.version = 1;
  else if (!this.isNew && this.isModified()) this.version += 1;
  next();
});

homePageContentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.updatedBy;
    delete ret.__v;
    return ret;
  },
});

export const HERO_DEFAULTS = DEFAULT_HERO;
export const NOTIFICATION_DEFAULTS = DEFAULT_NOTIFICATION;
export const CATEGORY_DEFAULTS = DEFAULT_CATEGORIES_SECTION;
export const BRANDS_DEFAULTS = DEFAULT_BRANDS_SECTION;
export const TESTIMONIALS_DEFAULTS = DEFAULT_TESTIMONIALS_SECTION;
export const SELLER_CTA_DEFAULTS = DEFAULT_SELLER_CTA;
export const THEME_DEFAULTS = DEFAULT_THEME;

export default mongoose.model('HomePageContent', homePageContentSchema);
