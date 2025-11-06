import HomePageContent, {
  HERO_DEFAULTS,
  NOTIFICATION_DEFAULTS,
  CATEGORY_DEFAULTS,
  BRANDS_DEFAULTS,
  TESTIMONIALS_DEFAULTS,
  SELLER_CTA_DEFAULTS,
  THEME_DEFAULTS,
} from '../model/home-page-content.model.js';

const DEFAULT_CONTENT_RESPONSE = Object.freeze({
  slug: 'default',
  hero: { ...HERO_DEFAULTS },
  carousel: [],
  notification: { ...NOTIFICATION_DEFAULTS },
  couponBlocks: [],
  categoryCapsules: {
    heading: { ...CATEGORY_DEFAULTS.heading },
    cta: { ...CATEGORY_DEFAULTS.cta },
    items: [],
  },
  brandHighlights: {
    heading: { ...BRANDS_DEFAULTS.heading },
    items: [],
  },
  testimonials: {
    heading: { ...TESTIMONIALS_DEFAULTS.heading },
    items: [],
  },
  sellerCta: { ...SELLER_CTA_DEFAULTS },
  theme: { ...THEME_DEFAULTS },
  version: 1,
  published: true,
  createdAt: null,
  updatedAt: null,
});

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeHero(input) {
  if (!input || typeof input !== 'object') return { ...HERO_DEFAULTS, enabled: false };
  return {
    title: toTrimmedString(input.title) || HERO_DEFAULTS.title,
    subtitle: toTrimmedString(input.subtitle),
    ctaLabel: toTrimmedString(input.ctaLabel),
    ctaHref: toTrimmedString(input.ctaHref),
    backgroundImage: toTrimmedString(input.backgroundImage),
    eyebrow: toTrimmedString(input.eyebrow),
    enabled: toBoolean(input.enabled, true),
  };
}

function normalizeCarousel(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => ({
      title: toTrimmedString(item?.title),
      caption: toTrimmedString(item?.caption || item?.description),
      imageUrl: toTrimmedString(item?.imageUrl || item?.image),
      href: toTrimmedString(item?.href || item?.ctaHref),
      order: toNumber(item?.order, index),
      active: toBoolean(item?.active, true),
    }))
    .filter((entry) => entry.title || entry.caption || entry.imageUrl)
    .slice(0, 8)
    .map((entry, idx) => ({ ...entry, order: idx }));
}

function normalizeNotification(input) {
  if (!input || typeof input !== 'object') return { ...NOTIFICATION_DEFAULTS };
  const message = toTrimmedString(input.message);
  const type = ['info', 'success', 'warning', 'danger'].includes(input.type)
    ? input.type
    : NOTIFICATION_DEFAULTS.type;
  const enabled = toBoolean(input.enabled, Boolean(message));
  return {
    message,
    type,
    ctaLabel: toTrimmedString(input.ctaLabel),
    ctaHref: toTrimmedString(input.ctaHref),
    enabled,
  };
}

function normalizeCouponBlocks(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item, index) => {
      const code = toTrimmedString(item?.code);
      const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : undefined;
      return {
        title: toTrimmedString(item?.title),
        description: toTrimmedString(item?.description),
        code,
        finePrint: toTrimmedString(item?.finePrint),
        imageUrl: toTrimmedString(item?.imageUrl),
        href: toTrimmedString(item?.href || item?.ctaHref),
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : undefined,
        enabled: toBoolean(item?.enabled, Boolean(code)),
        order: index,
      };
    })
    .filter((item) => item.code || item.title)
    .slice(0, 6)
    .map((entry, idx) => ({ ...entry, order: idx }));
}

function normalizeSectionHeading(sectionHeading = {}, defaults = {}) {
  return {
    eyebrow: toTrimmedString(sectionHeading.eyebrow) || defaults.eyebrow || '',
    title: toTrimmedString(sectionHeading.title) || defaults.title || '',
    subtitle: toTrimmedString(sectionHeading.subtitle),
  };
}

function normalizeCategoryCapsules(section) {
  const heading = normalizeSectionHeading(section?.heading, CATEGORY_DEFAULTS.heading);
  const cta = {
    label: toTrimmedString(section?.cta?.label),
    href: toTrimmedString(section?.cta?.href),
  };
  const items = Array.isArray(section?.items) ? section.items : [];
  return {
    heading,
    cta,
    items: items
      .map((item, index) => ({
        name: toTrimmedString(item?.name),
        description: toTrimmedString(item?.description),
        href: toTrimmedString(item?.href),
        badge: toTrimmedString(item?.badge),
        mediaUrl: toTrimmedString(item?.mediaUrl),
        order: toNumber(item?.order, index),
      }))
      .filter((entry) => entry.name || entry.description || entry.href)
      .slice(0, 6)
      .map((entry, idx) => ({ ...entry, order: idx })),
  };
}

function normalizeBrandHighlights(section) {
  const heading = normalizeSectionHeading(section?.heading, BRANDS_DEFAULTS.heading);
  const items = Array.isArray(section?.items) ? section.items : [];
  return {
    heading,
    items: items
      .map((item, index) => ({
        name: toTrimmedString(item?.name),
        description: toTrimmedString(item?.description),
        logoUrl: toTrimmedString(item?.logoUrl),
        href: toTrimmedString(item?.href),
        order: toNumber(item?.order, index),
      }))
      .filter((entry) => entry.name || entry.description || entry.logoUrl)
      .slice(0, 8)
      .map((entry, idx) => ({ ...entry, order: idx })),
  };
}

function normalizeTestimonials(section) {
  const heading = normalizeSectionHeading(section?.heading, TESTIMONIALS_DEFAULTS.heading);
  const items = Array.isArray(section?.items) ? section.items : [];
  return {
    heading,
    items: items
      .map((item, index) => ({
        quote: toTrimmedString(item?.quote),
        name: toTrimmedString(item?.name),
        role: toTrimmedString(item?.role),
        avatarUrl: toTrimmedString(item?.avatarUrl),
        order: toNumber(item?.order, index),
      }))
      .filter((entry) => entry.quote && entry.name)
      .slice(0, 6)
      .map((entry, idx) => ({ ...entry, order: idx })),
  };
}

function normalizeSellerCta(section) {
  return {
    heading: toTrimmedString(section?.heading) || SELLER_CTA_DEFAULTS.heading,
    body: toTrimmedString(section?.body),
    primaryCta: {
      label: toTrimmedString(section?.primaryCta?.label),
      href: toTrimmedString(section?.primaryCta?.href),
    },
    secondaryCta: {
      label: toTrimmedString(section?.secondaryCta?.label),
      href: toTrimmedString(section?.secondaryCta?.href),
    },
  };
}

function normalizeThemeMeta(theme) {
  const activePreset = toTrimmedString(theme?.activePreset) || THEME_DEFAULTS.activePreset;
  const availablePresets = Array.isArray(theme?.availablePresets)
    ? theme.availablePresets
        .map((preset) => ({
          key: toTrimmedString(preset?.key),
          name: toTrimmedString(preset?.name),
          mode: ['day', 'night'].includes(preset?.mode) ? preset.mode : 'day',
          accent: toTrimmedString(preset?.accent),
        }))
        .filter((preset) => preset.key && preset.name)
        .slice(0, 8)
    : [];
  const overrides = {};
  if (theme?.overrides && typeof theme.overrides === 'object') {
    Object.entries(theme.overrides).forEach(([key, value]) => {
      if (typeof value === 'string') overrides[key] = value.trim();
    });
  }
  const resolvedActive = availablePresets.some((preset) => preset.key === activePreset)
    ? activePreset
    : activePreset || THEME_DEFAULTS.activePreset;
  return {
    activePreset: resolvedActive,
    availablePresets,
    overrides,
  };
}

function ensureSectionDefaults(doc) {
  if (!doc.categoryCapsules) {
    doc.categoryCapsules = { heading: { ...CATEGORY_DEFAULTS.heading }, cta: { ...CATEGORY_DEFAULTS.cta }, items: [] };
  }
  if (!doc.brandHighlights) {
    doc.brandHighlights = { heading: { ...BRANDS_DEFAULTS.heading }, items: [] };
  }
  if (!doc.testimonials) {
    doc.testimonials = { heading: { ...TESTIMONIALS_DEFAULTS.heading }, items: [] };
  }
}

const HOMEPAGE_COLLECTIONS = {
  carousel: {
    get: (doc) => doc.carousel || [],
    normalize: (doc, items) => ({ items: normalizeCarousel(items) }),
    apply: (doc, normalized) => {
      doc.carousel = normalized.items;
    },
    response: (doc) => doc.carousel,
  },
  couponBlocks: {
    get: (doc) => doc.couponBlocks || [],
    normalize: (doc, items) => ({ items: normalizeCouponBlocks(items) }),
    apply: (doc, normalized) => {
      doc.couponBlocks = normalized.items;
    },
    response: (doc) => doc.couponBlocks,
  },
  categoryCapsules: {
    get: (doc) => {
      ensureSectionDefaults(doc);
      return doc.categoryCapsules.items || [];
    },
    normalize: (doc, items) => {
      ensureSectionDefaults(doc);
      return normalizeCategoryCapsules({
        heading: doc.categoryCapsules.heading,
        cta: doc.categoryCapsules.cta,
        items,
      });
    },
    apply: (doc, normalized) => {
      doc.categoryCapsules = {
        heading: normalized.heading,
        cta: normalized.cta,
        items: normalized.items,
      };
    },
    response: (doc) => doc.categoryCapsules,
  },
  brandHighlights: {
    get: (doc) => {
      ensureSectionDefaults(doc);
      return doc.brandHighlights.items || [];
    },
    normalize: (doc, items) => {
      ensureSectionDefaults(doc);
      return normalizeBrandHighlights({
        heading: doc.brandHighlights.heading,
        items,
      });
    },
    apply: (doc, normalized) => {
      doc.brandHighlights = {
        heading: normalized.heading,
        items: normalized.items,
      };
    },
    response: (doc) => doc.brandHighlights,
  },
  testimonials: {
    get: (doc) => {
      ensureSectionDefaults(doc);
      return doc.testimonials.items || [];
    },
    normalize: (doc, items) => {
      ensureSectionDefaults(doc);
      return normalizeTestimonials({
        heading: doc.testimonials.heading,
        items,
      });
    },
    apply: (doc, normalized) => {
      doc.testimonials = {
        heading: normalized.heading,
        items: normalized.items,
      };
    },
    response: (doc) => doc.testimonials,
  },
};

function getCollectionConfig(collection) {
  return HOMEPAGE_COLLECTIONS[collection] || null;
}

async function loadHomepageDoc() {
  let doc = await HomePageContent.findOne({ slug: 'default' });
  if (!doc) doc = new HomePageContent({ slug: 'default' });
  ensureSectionDefaults(doc);
  return doc;
}

function requireOrderArray(order, length) {
  if (!Array.isArray(order) || order.length !== length) return false;
  const seen = new Set(order);
  if (seen.size !== length) return false;
  return order.every((idx) => Number.isInteger(idx) && idx >= 0 && idx < length);
}

function buildCollectionResponse(collection, doc, config) {
  const data = config.response ? config.response(doc) : config.get(doc);
  return { collection, data };
}

export async function getHomepageContent(req, res, next) {
  try {
    const doc = await HomePageContent.findOne({ slug: 'default' }).lean();
    if (!doc) return res.json({ content: { ...DEFAULT_CONTENT_RESPONSE } });
    return res.json({ content: doc });
  } catch (error) {
    next(error);
  }
}

export async function adminGetHomepageContent(req, res, next) {
  try {
    const doc = await HomePageContent.findOne({ slug: 'default' }).lean();
    if (!doc) return res.json({ content: { ...DEFAULT_CONTENT_RESPONSE } });
    res.json({ content: doc });
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateHomepageContent(req, res, next) {
  try {
    const payload = req.body || {};
    const doc = await loadHomepageDoc();

    if (Object.prototype.hasOwnProperty.call(payload, 'hero')) {
      doc.hero = normalizeHero(payload.hero);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'carousel')) {
      doc.carousel = normalizeCarousel(payload.carousel);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'notification')) {
      doc.notification = normalizeNotification(payload.notification);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'couponBlocks')) {
      doc.couponBlocks = normalizeCouponBlocks(payload.couponBlocks);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'categoryCapsules')) {
      const normalized = normalizeCategoryCapsules(payload.categoryCapsules);
      doc.categoryCapsules = {
        heading: normalized.heading,
        cta: normalized.cta,
        items: normalized.items,
      };
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'brandHighlights')) {
      const normalized = normalizeBrandHighlights(payload.brandHighlights);
      doc.brandHighlights = {
        heading: normalized.heading,
        items: normalized.items,
      };
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'testimonials')) {
      const normalized = normalizeTestimonials(payload.testimonials);
      doc.testimonials = {
        heading: normalized.heading,
        items: normalized.items,
      };
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'sellerCta')) {
      doc.sellerCta = normalizeSellerCta(payload.sellerCta);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'theme')) {
      doc.theme = normalizeThemeMeta(payload.theme);
    }

    if (req.user?._id) {
      doc.updatedBy = req.user._id;
    }

    await doc.save();

    res.json({ content: doc.toJSON() });
  } catch (error) {
    next(error);
  }
}

export async function adminAddHomepageItem(req, res, next) {
  try {
    const { collection, item } = req.body || {};
    const config = getCollectionConfig(collection);
    if (!config) return res.status(400).json({ error: 'Unsupported collection' });

    const doc = await loadHomepageDoc();
    const items = config.get(doc);
    const normalized = config.normalize(doc, [...items, item || {}]);
    config.apply(doc, normalized);

    if (req.user?._id) doc.updatedBy = req.user._id;
    await doc.save();

    res.status(201).json(buildCollectionResponse(collection, doc, config));
  } catch (error) {
    next(error);
  }
}

export async function adminRemoveHomepageItem(req, res, next) {
  try {
    const { collection, index } = req.body || {};
    const config = getCollectionConfig(collection);
    if (!config) return res.status(400).json({ error: 'Unsupported collection' });
    if (!Number.isInteger(index)) return res.status(400).json({ error: 'index must be an integer' });

    const doc = await loadHomepageDoc();
    const items = config.get(doc).slice();
    if (index < 0 || index >= items.length) return res.status(404).json({ error: 'Item not found' });

    items.splice(index, 1);
    const normalized = config.normalize(doc, items);
    config.apply(doc, normalized);

    if (req.user?._id) doc.updatedBy = req.user._id;
    await doc.save();

    res.json(buildCollectionResponse(collection, doc, config));
  } catch (error) {
    next(error);
  }
}

export async function adminReorderHomepageCollection(req, res, next) {
  try {
    const { collection, order } = req.body || {};
    const config = getCollectionConfig(collection);
    if (!config) return res.status(400).json({ error: 'Unsupported collection' });

    const doc = await loadHomepageDoc();
    const items = config.get(doc).slice();
    if (!requireOrderArray(order, items.length)) {
      return res.status(400).json({ error: 'Invalid order array' });
    }

    const reordered = order.map((idx) => items[idx]);
    const normalized = config.normalize(doc, reordered);
    config.apply(doc, normalized);

    if (req.user?._id) doc.updatedBy = req.user._id;
    await doc.save();

    res.json(buildCollectionResponse(collection, doc, config));
  } catch (error) {
    next(error);
  }
}

export const __testables = {
  normalizeHero,
  normalizeCarousel,
  normalizeNotification,
  normalizeCouponBlocks,
  normalizeCategoryCapsules,
  normalizeBrandHighlights,
  normalizeTestimonials,
  normalizeSellerCta,
  normalizeThemeMeta,
  HOMEPAGE_COLLECTIONS,
};
