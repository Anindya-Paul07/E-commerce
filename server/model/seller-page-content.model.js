import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema(
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

const pillarSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const calloutSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    mediaUrl: { type: String, trim: true, default: '' },
    cta: {
      label: { type: String, trim: true, default: '' },
      href: { type: String, trim: true, default: '' },
    },
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

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, default: '' },
    answer: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const contactBlockSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    cta: {
      label: { type: String, trim: true, default: '' },
      href: { type: String, trim: true, default: '' },
    },
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    heroGradient: { type: String, trim: true, default: '' },
    accentColor: { type: String, trim: true, default: '' },
    backgroundStyle: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const DEFAULT_HERO = Object.freeze({
  eyebrow: 'Seller collective',
  title: 'Launch your flagship inside a multi-brand icon',
  subtitle: 'Partner with a concierge marketplace curated for design-led boutiques.',
  backgroundImage: '',
  primaryCta: { label: 'Start application', href: '/seller/apply' },
  secondaryCta: { label: 'Review requirements', href: '/seller/guidelines' },
});

const DEFAULT_THEME = Object.freeze({
  heroGradient: 'linear-gradient(135deg, rgba(250,250,250,0.75), rgba(176,208,255,0.35))',
  accentColor: '#6366f1',
  backgroundStyle: 'radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 55%)',
});

const DEFAULT_CONTACT = Object.freeze({
  headline: 'Need help with your application?',
  body: 'Our merchant success team is here to support you with onboarding, product setup, and fulfilment guidance.',
  email: 'onboard@flux-commerce.test',
  phone: '+1 555 010 2025',
  cta: { label: 'Contact merchant team', href: 'mailto:onboard@flux-commerce.test' },
});

const sellerPageContentSchema = new mongoose.Schema(
  {
    slug: { type: String, trim: true, unique: true, default: 'default' },
    hero: { type: heroSchema, default: () => ({ ...DEFAULT_HERO }) },
    pillars: { type: [pillarSchema], default: () => [] },
    callouts: { type: [calloutSchema], default: () => [] },
    testimonials: { type: [testimonialSchema], default: () => [] },
    faqs: { type: [faqSchema], default: () => [] },
    contact: { type: contactBlockSchema, default: () => ({ ...DEFAULT_CONTACT }) },
    theme: { type: themeSchema, default: () => ({ ...DEFAULT_THEME }) },
    version: { type: Number, default: 1 },
    published: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

sellerPageContentSchema.pre('save', function preSave(next) {
  if (!this.slug) this.slug = 'default';
  if (!this.version) this.version = 1;
  else if (!this.isNew && this.isModified()) this.version += 1;
  next();
});

sellerPageContentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.updatedBy;
    delete ret.__v;
    return ret;
  },
});

export const SELLER_HERO_DEFAULTS = DEFAULT_HERO;
export const SELLER_THEME_DEFAULTS = DEFAULT_THEME;

export default mongoose.model('SellerPageContent', sellerPageContentSchema);
