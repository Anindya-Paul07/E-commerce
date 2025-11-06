export const MOCK_PRODUCTS = [
  {
    _id: 'mock-aurora-headphones',
    title: 'Aurora Wireless Headphones',
    slug: 'aurora-wireless-headphones',
    price: 199.99,
    tags: ['Audio'],
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
  },
  {
    _id: 'mock-lumen-lamp',
    title: 'Lumen Smart Lamp',
    slug: 'lumen-smart-lamp',
    price: 129.5,
    tags: ['Home'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    _id: 'mock-kinetic-sneakers',
    title: 'Kinetic Runner Sneakers',
    slug: 'kinetic-runner-sneakers',
    price: 149.0,
    tags: ['Footwear'],
    images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'],
  },
  {
    _id: 'mock-boreal-backpack',
    title: 'Boreal Travel Backpack',
    slug: 'boreal-travel-backpack',
    price: 179.0,
    tags: ['Travel'],
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'],
  },
];

export const MOCK_CATEGORIES = [
  { _id: 'mock-cat-audio', name: 'Audio Studio', slug: 'audio-studio', sortOrder: 1 },
  { _id: 'mock-cat-home', name: 'Modern Home', slug: 'modern-home', sortOrder: 2 },
  { _id: 'mock-cat-fashion', name: 'Future Fashion', slug: 'future-fashion', sortOrder: 3 },
  { _id: 'mock-cat-travel', name: 'Travel Atelier', slug: 'travel-atelier', sortOrder: 4 },
];

export const MOCK_BRANDS = [
  {
    name: 'Studio Nova',
    description: 'Sound-forward lifestyle brand crafting warm analog experiences for the digital era.',
    logo: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Aether & Co.',
    description: 'Artful interior essentials blending tactile materials with mindful technology.',
    logo: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Helix Athletics',
    description: 'Performance wear engineered for motion with recycled textiles and adaptive fits.',
    logo: 'https://images.unsplash.com/photo-1542293787938-4d2226c12e81?auto=format&fit=crop&w=200&q=80',
  },
];

export const MOCK_TESTIMONIALS = [
  {
    quote: 'Every launch feels like a curated concept store. The merchandising is flawless.',
    name: 'Danielle Truong',
    role: 'Founder, Atelier Arc',
  },
  {
    quote: 'Our seller onboarding was refreshingly human. The marketplace tech is world-class.',
    name: 'Mateo Díaz',
    role: 'Director, Lumen Goods',
  },
];

export const MOCK_HOMEPAGE_CONTENT = {
  hero: {
    eyebrow: 'Marketplace reimagined',
    title: 'A flagship experience for modern multi-brand commerce',
    subtitle: 'Discover limited-run capsules and design-led essentials curated by our merchant team.',
    ctaLabel: 'Browse featured drops',
    ctaHref: '/collections/featured',
    backgroundImage: '',
    enabled: true,
  },
  carousel: [],
  notification: {
    message: '',
    type: 'info',
    ctaLabel: '',
    ctaHref: '',
    enabled: false,
  },
  couponBlocks: [],
  categoryCapsules: {
    heading: {
      eyebrow: 'Curated universes',
      title: 'Shop by editorial universe',
      subtitle: '',
    },
    cta: { label: 'Explore all categories', href: '/categories' },
    items: MOCK_CATEGORIES.map((category, index) => ({
      name: category.name,
      description: 'Discover limited-run edits crafted by our merchant studio.',
      href: `/category/${category.slug}`,
      badge: category.sortOrder ? `Story ${category.sortOrder}` : 'Featured',
      mediaUrl: '',
      order: index,
    })),
  },
  brandHighlights: {
    heading: {
      eyebrow: 'Partner studios',
      title: 'Brands shaping the platform',
      subtitle: '',
    },
    items: MOCK_BRANDS.map((brand, index) => ({
      name: brand.name,
      description: brand.description,
      logoUrl: brand.logo,
      href: '#',
      order: index,
    })),
  },
  testimonials: {
    heading: {
      eyebrow: 'Seller voices',
      title: 'Why creators choose our marketplace',
      subtitle: '',
    },
    items: MOCK_TESTIMONIALS.map((testimonial, index) => ({
      ...testimonial,
      avatarUrl: '',
      order: index,
    })),
  },
  sellerCta: {
    heading: 'Launch your flagship inside a multi-brand icon',
    body: 'We champion boutique labels with premium storytelling, unified logistics, and concierge support.',
    primaryCta: { label: 'Submit seller application', href: '/seller/apply' },
    secondaryCta: { label: 'Seller dashboard', href: '/seller/dashboard' },
  },
  theme: {
    activePreset: 'daylight',
    availablePresets: [],
    overrides: {},
  },
};

export const MOCK_SELLER_PAGE_CONTENT = {
  hero: {
    eyebrow: 'Seller collective',
    title: 'Launch your flagship inside a multi-brand icon',
    subtitle: 'Partner with a concierge marketplace curated for design-led boutiques.',
    backgroundImage: '',
    primaryCta: { label: 'Start application', href: '/seller/apply' },
    secondaryCta: { label: 'Review requirements', href: '/seller/guidelines' },
  },
  pillars: [
    { title: 'Merchandising', description: 'Dedicated editors to craft your brand narrative.', icon: 'sparkles', order: 0 },
    { title: 'Fulfilment', description: 'Unified logistics and SLA tracking baked in.', icon: 'truck', order: 1 },
  ],
  callouts: [],
  testimonials: MOCK_TESTIMONIALS.map((testimonial, index) => ({
    ...testimonial,
    avatarUrl: '',
    order: index,
  })),
  faqs: [
    { question: 'How long does approval take?', answer: 'Most applications receive a response in under 5 business days.', order: 0 },
  ],
  contact: {
    headline: 'Need help with your application?',
    body: 'Our merchant success team is here to support you with onboarding, product setup, and fulfilment guidance.',
    email: 'onboard@flux-commerce.test',
    phone: '+1 555 010 2025',
    cta: { label: 'Contact merchant team', href: 'mailto:onboard@flux-commerce.test' },
  },
  theme: {
    heroGradient: 'linear-gradient(135deg, rgba(250,250,250,0.75), rgba(176,208,255,0.35))',
    accentColor: '#6366f1',
    backgroundStyle: 'radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 55%)',
  },
};
