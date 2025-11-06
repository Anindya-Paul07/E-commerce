import SellerPageContent, { SELLER_HERO_DEFAULTS, SELLER_THEME_DEFAULTS } from '../model/seller-page-content.model.js';

const DEFAULT_CONTACT = Object.freeze({
  headline: 'Need help with your application?',
  body: 'Our merchant success team is here to support you with onboarding, product setup, and fulfilment guidance.',
  email: 'onboard@flux-commerce.test',
  phone: '+1 555 010 2025',
  cta: { label: 'Contact merchant team', href: 'mailto:onboard@flux-commerce.test' },
});

const DEFAULT_CONTENT_RESPONSE = Object.freeze({
  slug: 'default',
  hero: { ...SELLER_HERO_DEFAULTS },
  pillars: [],
  callouts: [],
  testimonials: [],
  faqs: [],
  contact: { ...DEFAULT_CONTACT },
  theme: { ...SELLER_THEME_DEFAULTS },
  version: 1,
  published: true,
  createdAt: null,
  updatedAt: null,
});

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeHero(input) {
  if (!input || typeof input !== 'object') return { ...SELLER_HERO_DEFAULTS };
  return {
    eyebrow: toTrimmedString(input.eyebrow) || SELLER_HERO_DEFAULTS.eyebrow,
    title: toTrimmedString(input.title) || SELLER_HERO_DEFAULTS.title,
    subtitle: toTrimmedString(input.subtitle) || SELLER_HERO_DEFAULTS.subtitle,
    backgroundImage: toTrimmedString(input.backgroundImage),
    primaryCta: {
      label: toTrimmedString(input.primaryCta?.label) || SELLER_HERO_DEFAULTS.primaryCta.label,
      href: toTrimmedString(input.primaryCta?.href) || SELLER_HERO_DEFAULTS.primaryCta.href,
    },
    secondaryCta: {
      label: toTrimmedString(input.secondaryCta?.label) || SELLER_HERO_DEFAULTS.secondaryCta.label,
      href: toTrimmedString(input.secondaryCta?.href) || SELLER_HERO_DEFAULTS.secondaryCta.href,
    },
  };
}

function hasMeaningfulValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === 'object') return Object.values(value).some((item) => hasMeaningfulValue(item));
  if (typeof value === 'number') return false;
  return Boolean(value);
}

function normalizeOrderedItems(items, limit, mapper) {
  if (!Array.isArray(items)) return [];
  const normalized = [];
  items.forEach((item, index) => {
    const base = mapper(item) || {};
    const hasContent = Object.entries(base).some(([key, value]) => key !== 'order' && hasMeaningfulValue(value));
    if (!hasContent) return;
    normalized.push({ ...base, order: toNumber(item?.order, normalized.length ? normalized.length : index) });
  });
  return normalized.slice(0, limit).map((entry, idx) => ({ ...entry, order: idx }));
}

function normalizePillars(items) {
  return normalizeOrderedItems(items, 6, (item) => ({
    title: toTrimmedString(item?.title),
    description: toTrimmedString(item?.description),
    icon: toTrimmedString(item?.icon),
  }));
}

function normalizeCallouts(items) {
  return normalizeOrderedItems(items, 4, (item) => ({
    title: toTrimmedString(item?.title),
    body: toTrimmedString(item?.body),
    mediaUrl: toTrimmedString(item?.mediaUrl),
    cta: {
      label: toTrimmedString(item?.cta?.label),
      href: toTrimmedString(item?.cta?.href),
    },
  }));
}

function normalizeTestimonials(items) {
  return normalizeOrderedItems(items, 6, (item) => ({
    quote: toTrimmedString(item?.quote),
    name: toTrimmedString(item?.name),
    role: toTrimmedString(item?.role),
    avatarUrl: toTrimmedString(item?.avatarUrl),
  }));
}

function normalizeFaqs(items) {
  return normalizeOrderedItems(items, 10, (item) => ({
    question: toTrimmedString(item?.question),
    answer: toTrimmedString(item?.answer),
  }));
}

function normalizeContact(input) {
  if (!input || typeof input !== 'object') return { ...DEFAULT_CONTACT };
  return {
    headline: toTrimmedString(input.headline) || DEFAULT_CONTACT.headline,
    body: toTrimmedString(input.body) || DEFAULT_CONTACT.body,
    email: toTrimmedString(input.email) || DEFAULT_CONTACT.email,
    phone: toTrimmedString(input.phone) || DEFAULT_CONTACT.phone,
    cta: {
      label: toTrimmedString(input.cta?.label) || DEFAULT_CONTACT.cta.label,
      href: toTrimmedString(input.cta?.href) || DEFAULT_CONTACT.cta.href,
    },
  };
}

function normalizeTheme(input) {
  if (!input || typeof input !== 'object') return { ...SELLER_THEME_DEFAULTS };
  return {
    heroGradient: toTrimmedString(input.heroGradient) || SELLER_THEME_DEFAULTS.heroGradient,
    accentColor: toTrimmedString(input.accentColor) || SELLER_THEME_DEFAULTS.accentColor,
    backgroundStyle: toTrimmedString(input.backgroundStyle) || SELLER_THEME_DEFAULTS.backgroundStyle,
  };
}

const SELLER_COLLECTIONS = {
  pillars: {
    get: (doc) => doc.pillars || [],
    normalize: (doc, items) => normalizePillars(items),
    apply: (doc, normalized) => {
      doc.pillars = normalized;
    },
  },
  callouts: {
    get: (doc) => doc.callouts || [],
    normalize: (doc, items) => normalizeCallouts(items),
    apply: (doc, normalized) => {
      doc.callouts = normalized;
    },
  },
  testimonials: {
    get: (doc) => doc.testimonials || [],
    normalize: (doc, items) => normalizeTestimonials(items),
    apply: (doc, normalized) => {
      doc.testimonials = normalized;
    },
  },
  faqs: {
    get: (doc) => doc.faqs || [],
    normalize: (doc, items) => normalizeFaqs(items),
    apply: (doc, normalized) => {
      doc.faqs = normalized;
    },
  },
};

function getCollectionConfig(collection) {
  return SELLER_COLLECTIONS[collection] || null;
}

async function loadSellerPageDoc() {
  let doc = await SellerPageContent.findOne({ slug: 'default' });
  if (!doc) doc = new SellerPageContent({ slug: 'default' });
  if (!doc.contact || typeof doc.contact !== 'object') {
    doc.contact = { ...DEFAULT_CONTACT };
  }
  return doc;
}

function requireOrderArray(order, length) {
  if (!Array.isArray(order) || order.length !== length) return false;
  const seen = new Set(order);
  if (seen.size !== length) return false;
  return order.every((idx) => Number.isInteger(idx) && idx >= 0 && idx < length);
}

export async function getSellerPageContent(req, res, next) {
  try {
    const doc = await SellerPageContent.findOne({ slug: 'default' }).lean();
    if (!doc) return res.json({ content: { ...DEFAULT_CONTENT_RESPONSE } });
    res.json({ content: doc });
  } catch (error) {
    next(error);
  }
}

export async function adminGetSellerPageContent(req, res, next) {
  return getSellerPageContent(req, res, next);
}

export async function adminUpdateSellerPageContent(req, res, next) {
  try {
    const payload = req.body || {};
    const doc = await loadSellerPageDoc();

    if (Object.prototype.hasOwnProperty.call(payload, 'hero')) {
      doc.hero = normalizeHero(payload.hero);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'pillars')) {
      doc.pillars = normalizePillars(payload.pillars);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'callouts')) {
      doc.callouts = normalizeCallouts(payload.callouts);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'testimonials')) {
      doc.testimonials = normalizeTestimonials(payload.testimonials);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'faqs')) {
      doc.faqs = normalizeFaqs(payload.faqs);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'contact')) {
      doc.contact = normalizeContact(payload.contact);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'theme')) {
      doc.theme = normalizeTheme(payload.theme);
    }

    if (req.user?._id) doc.updatedBy = req.user._id;

    await doc.save();
    res.json({ content: doc.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function adminAddSellerPageItem(req, res, next) {
  try {
    const { collection, item } = req.body || {};
    const config = getCollectionConfig(collection);
    if (!config) return res.status(400).json({ error: 'Unsupported collection' });

    const doc = await loadSellerPageDoc();
    const items = config.get(doc);
    const normalized = config.normalize(doc, [...items, item || {}]);
    config.apply(doc, normalized);

    if (req.user?._id) doc.updatedBy = req.user._id;
    await doc.save();

    res.status(201).json({ collection, items: config.get(doc) });
  } catch (error) {
    next(error);
  }
}

export async function adminRemoveSellerPageItem(req, res, next) {
  try {
    const { collection, index } = req.body || {};
    const config = getCollectionConfig(collection);
    if (!config) return res.status(400).json({ error: 'Unsupported collection' });
    if (!Number.isInteger(index)) return res.status(400).json({ error: 'index must be an integer' });

    const doc = await loadSellerPageDoc();
    const items = config.get(doc).slice();
    if (index < 0 || index >= items.length) return res.status(404).json({ error: 'Item not found' });

    items.splice(index, 1);
    const normalized = config.normalize(doc, items);
    config.apply(doc, normalized);

    if (req.user?._id) doc.updatedBy = req.user._id;
    await doc.save();

    res.json({ collection, items: config.get(doc) });
  } catch (error) {
    next(error);
  }
}

export async function adminReorderSellerPageCollection(req, res, next) {
  try {
    const { collection, order } = req.body || {};
    const config = getCollectionConfig(collection);
    if (!config) return res.status(400).json({ error: 'Unsupported collection' });

    const doc = await loadSellerPageDoc();
    const items = config.get(doc).slice();
    if (!requireOrderArray(order, items.length)) {
      return res.status(400).json({ error: 'Invalid order array' });
    }

    const reordered = order.map((idx) => items[idx]);
    const normalized = config.normalize(doc, reordered);
    config.apply(doc, normalized);

    if (req.user?._id) doc.updatedBy = req.user._id;
    await doc.save();

    res.json({ collection, items: config.get(doc) });
  } catch (error) {
    next(error);
  }
}

export const __testables = {
  normalizeHero,
  normalizePillars,
  normalizeCallouts,
  normalizeTestimonials,
  normalizeFaqs,
  normalizeContact,
  normalizeTheme,
  SELLER_COLLECTIONS,
};
