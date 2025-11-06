import Shop from '../model/shop.model.js';
import Seller from '../model/seller.model.js';

const FALLBACK_HERO = Object.freeze({
  eyebrow: 'Inside the flagship',
  title: 'Welcome to our storefront',
  subtitle: 'Curated collections and signature releases from our studio.',
  backgroundImage: '',
  primaryCta: { label: 'Shop collection', href: '/products' },
  secondaryCta: { label: 'Contact us', href: '/support' },
});

const ALLOWED_ACCENTS = ['#6366f1', '#0ea5e9', '#f97316', '#22d3ee', '#1d4ed8'];
const DEFAULT_GRADIENT = 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.08))';
const DEFAULT_BACKGROUND = 'radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 55%)';

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeUrl(value) {
  const trimmed = toTrimmedString(value);
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return '';
}

function normalizeHero(input = {}) {
  return {
    eyebrow: toTrimmedString(input.eyebrow) || FALLBACK_HERO.eyebrow,
    title: toTrimmedString(input.title) || FALLBACK_HERO.title,
    subtitle: toTrimmedString(input.subtitle) || FALLBACK_HERO.subtitle,
    backgroundImage: sanitizeUrl(input.backgroundImage) || FALLBACK_HERO.backgroundImage,
    primaryCta: {
      label: toTrimmedString(input?.primaryCta?.label) || FALLBACK_HERO.primaryCta.label,
      href: sanitizeUrl(input?.primaryCta?.href) || FALLBACK_HERO.primaryCta.href,
    },
    secondaryCta: {
      label: toTrimmedString(input?.secondaryCta?.label) || FALLBACK_HERO.secondaryCta.label,
      href: sanitizeUrl(input?.secondaryCta?.href) || FALLBACK_HERO.secondaryCta.href,
    },
  };
}

function normalizeCarousel(items) {
  if (!Array.isArray(items)) return [];
  const trimmed = [];
  items.slice(0, 8).forEach((item, index) => {
    const title = toTrimmedString(item?.title);
    const caption = toTrimmedString(item?.caption);
    const imageUrl = sanitizeUrl(item?.imageUrl);
    const href = sanitizeUrl(item?.href);
    if (!title && !caption && !imageUrl) return;
    trimmed.push({
      title,
      caption,
      imageUrl,
      href,
      order: Number.isFinite(item?.order) ? item.order : index,
    });
  });
  return trimmed.map((entry, idx) => ({ ...entry, order: idx }));
}

function normalizePalette(input = {}) {
  const accent = toTrimmedString(input.accentColor).toLowerCase();
  return {
    accentColor: ALLOWED_ACCENTS.includes(accent) ? accent : ALLOWED_ACCENTS[0],
    heroGradient: toTrimmedString(input.heroGradient) || DEFAULT_GRADIENT,
    backgroundStyle: toTrimmedString(input.backgroundStyle) || DEFAULT_BACKGROUND,
  };
}

async function loadSellerShop(userId) {
  const seller = await Seller.findOne({ user: userId }).lean();
  if (!seller) return null;
  const shop = await Shop.findOne({ seller: seller._id });
  if (!shop) return null;
  return { shop, seller };
}

export async function getSellerStorefront(req, res, next) {
  try {
    const result = await loadSellerShop(req.user._id);
    if (!result) return res.status(404).json({ error: 'Seller shop not found' });
    const { shop } = result;
    const marketing = shop.marketing || {};
    res.json({
      marketing: {
        hero: marketing.hero || { ...FALLBACK_HERO },
        carousel: Array.isArray(marketing.carousel) ? marketing.carousel : [],
        palette: {
          accentColor: marketing.palette?.accentColor || ALLOWED_ACCENTS[0],
          heroGradient: marketing.palette?.heroGradient || DEFAULT_GRADIENT,
          backgroundStyle: marketing.palette?.backgroundStyle || DEFAULT_BACKGROUND,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSellerStorefront(req, res, next) {
  try {
    const result = await loadSellerShop(req.user._id);
    if (!result) return res.status(404).json({ error: 'Seller shop not found' });
    const { shop } = result;

    const payload = req.body || {};
    const hero = normalizeHero(payload.hero);
    const carousel = normalizeCarousel(payload.carousel);
    const palette = normalizePalette(payload.palette);

    shop.marketing = {
      hero,
      carousel,
      palette,
      version: (shop.marketing?.version || 1) + 1,
      published: payload.published !== false,
      updatedAt: new Date(),
    };

    await shop.save();
    res.json({ marketing: shop.marketing });
  } catch (error) {
    next(error);
  }
}
