export const THEMES = {
  modern: {
    name: 'Modern Mint',
    description: 'Fresh gradients, clean typography, and rounded surfaces.',
    tokens: {
      '--background': '0 0% 100%',
      '--foreground': '222 22% 10%',
      '--primary': '158 92% 35%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '215 28% 92%',
      '--secondary-foreground': '220 22% 26%',
      '--accent': '275 73% 74%',
      '--accent-foreground': '271 43% 35%',
    },
    hero: {
      headline: 'Discover the latest drops',
      subheadline: 'Curated collections, personalised picks, and marketplace exclusives delivered by premium sellers.',
      background: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80',
      ctaLabel: 'Shop new arrivals',
      ctaHref: '/category/new-arrivals',
    },
    highlights: ['Free 2-day shipping', 'Curated by category experts', 'Marketplace protection'],
  },
  noir: {
    name: 'Noir Luxe',
    description: 'Bold, high-contrast palette with cinematic hero treatments.',
    tokens: {
      '--background': '220 18% 8%',
      '--foreground': '0 0% 98%',
      '--primary': '47 95% 55%',
      '--primary-foreground': '215 28% 12%',
      '--secondary': '223 19% 16%',
      '--secondary-foreground': '210 20% 95%',
      '--accent': '11 86% 64%',
      '--accent-foreground': '220 18% 8%',
    },
    hero: {
      headline: 'Prime access to limited editions',
      subheadline: 'Celebrate craftsmanship with curated designer collections exclusive to our marketplace.',
      background: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
      ctaLabel: 'Browse exclusives',
      ctaHref: '/category/exclusive',
    },
    highlights: ['Members-only pricing', 'Luxury authentication', 'White-glove delivery'],
  },
  sunrise: {
    name: 'Sunrise Bazaar',
    description: 'Warm neutrals and lively accents inspired by outdoor markets.',
    tokens: {
      '--background': '35 100% 96%',
      '--foreground': '25 25% 20%',
      '--primary': '14 89% 55%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '45 90% 88%',
      '--secondary-foreground': '25 30% 25%',
      '--accent': '175 74% 35%',
      '--accent-foreground': '0 0% 100%',
    },
    hero: {
      headline: 'Festival of finds',
      subheadline: 'Hand-picked artisans and small businesses bring you the best of global marketplaces.',
      background: 'https://images.unsplash.com/photo-1505904267569-80cc463c5c86?auto=format&fit=crop&w=1600&q=80',
      ctaLabel: 'Explore artisans',
      ctaHref: '/category/artisan',
    },
    highlights: ['Support small sellers', 'Carbon-neutral shipping', 'Local pickup options'],
  },
  techpulse: {
    name: 'Tech Pulse',
    description: 'Electric gradients and dense layouts inspired by Amazon’s gadget storefronts.',
    tokens: {
      '--background': '220 25% 10%',
      '--foreground': '0 0% 98%',
      '--primary': '207 87% 55%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '214 30% 18%',
      '--secondary-foreground': '0 0% 95%',
      '--accent': '47 95% 55%',
      '--accent-foreground': '215 28% 12%',
    },
    hero: {
      headline: 'Tech deals of the day',
      subheadline: 'Deep discounts on electronics, smart home, and gaming gear from verified marketplace sellers.',
      background: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
      ctaLabel: 'View lightning deals',
      ctaHref: '/category/electronics',
    },
    highlights: ['24/7 customer service', 'Extended warranties', 'Amazon-style deal carousels'],
  },
};

export function getTheme(key = 'modern') {
  return THEMES[key] || THEMES.modern;
}

export const THEME_KEYS = Object.keys(THEMES);
