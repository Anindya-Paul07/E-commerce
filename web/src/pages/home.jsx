import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { notify } from '@/lib/notify'
import { useAppDispatch } from '@/store/hooks'
import { addToCart as addToCartThunk } from '@/store/slices/cartSlice'
import { useTheme } from '@/context/ThemeContext'
import {
  MOCK_BRANDS,
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_TESTIMONIALS,
  MOCK_HOMEPAGE_CONTENT,
} from '@/data/mockStorefront'

function hydrateCms(raw = {}) {
  const fallback = MOCK_HOMEPAGE_CONTENT
  return {
    hero: { ...fallback.hero, ...(raw.hero || {}) },
    carousel: Array.isArray(raw.carousel) ? raw.carousel : fallback.carousel,
    notification: { ...fallback.notification, ...(raw.notification || {}) },
    couponBlocks: Array.isArray(raw.couponBlocks) ? raw.couponBlocks : fallback.couponBlocks,
    categoryCapsules: {
      heading: { ...fallback.categoryCapsules.heading, ...(raw.categoryCapsules?.heading || {}) },
      cta: { ...fallback.categoryCapsules.cta, ...(raw.categoryCapsules?.cta || {}) },
      items: Array.isArray(raw.categoryCapsules?.items)
        ? raw.categoryCapsules.items
        : fallback.categoryCapsules.items,
    },
    brandHighlights: {
      heading: { ...fallback.brandHighlights.heading, ...(raw.brandHighlights?.heading || {}) },
      items: Array.isArray(raw.brandHighlights?.items) ? raw.brandHighlights.items : fallback.brandHighlights.items,
    },
    testimonials: {
      heading: { ...fallback.testimonials.heading, ...(raw.testimonials?.heading || {}) },
      items: Array.isArray(raw.testimonials?.items) ? raw.testimonials.items : fallback.testimonials.items,
    },
    sellerCta: { ...fallback.sellerCta, ...(raw.sellerCta || {}) },
    theme: { ...fallback.theme, ...(raw.theme || {}) },
  }
}

function normalizeOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object') return undefined
  if (overrides instanceof Map) {
    return Object.fromEntries(Array.from(overrides.entries()).filter(([key]) => typeof key === 'string'))
  }
  return Object.fromEntries(Object.entries(overrides))
}

export default function Home() {
  const [items, setItems] = useState(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [cats, setCats] = useState(MOCK_CATEGORIES)
  const [catsLoading, setCatsLoading] = useState(true)
  const [catsErr, setCatsErr] = useState('')

  const [cms, setCms] = useState(MOCK_HOMEPAGE_CONTENT)
  const [cmsLoading, setCmsLoading] = useState(true)
  const { presets: themePresets, activePreset: globalTheme, setActivePreset: applyThemePreset } = useTheme()
  const appliedThemeRef = useRef({ key: null, overridesSig: null, presetSig: null })

  const dispatch = useAppDispatch()

  const [showCatMenu, setShowCatMenu] = useState(false)
  const catMenuRef = useRef(null)
  const productsRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const { items } = await api.get('/products?limit=8&status=active&sort=-createdAt')
        if (Array.isArray(items) && items.length) {
          setItems(items)
        }
      } catch (e) {
        setErr(e.message)
        setItems(MOCK_PRODUCTS)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setCatsLoading(true)
        const { items } = await api.get('/categories?limit=20')
        if (Array.isArray(items) && items.length) setCats(items)
      } catch (e) {
        setCatsErr(e.message)
        setCats(MOCK_CATEGORIES)
      } finally {
        setCatsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setCmsLoading(true)
        const { content } = await api.get('/homepage')
        if (!active) return
        const hasPublishedContent = Boolean(content) && content.published !== false
        const nextCms = hasPublishedContent ? hydrateCms(content) : MOCK_HOMEPAGE_CONTENT
        setCms(nextCms)
      } catch {
        if (!active) return
        setCms(MOCK_HOMEPAGE_CONTENT)
      } finally {
        if (active) setCmsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const cmsThemeKey = cms.theme?.activePreset
  const cmsOverrides = normalizeOverrides(cms.theme?.overrides)

  useEffect(() => {
    if (!themePresets || themePresets.length === 0) return
    const hasMatchingPreset = cmsThemeKey && themePresets.some((preset) => preset.key === cmsThemeKey)
    const nextKey = hasMatchingPreset ? cmsThemeKey : globalTheme
    const activePreset = themePresets.find((preset) => preset.key === nextKey)
    const overridesSig = JSON.stringify(cmsOverrides || {})
    const presetSig = JSON.stringify({
      palette: activePreset?.palette || null,
      typography: activePreset?.typography || null,
    })
    const alreadyApplied =
      appliedThemeRef.current.key === nextKey &&
      appliedThemeRef.current.overridesSig === overridesSig &&
      appliedThemeRef.current.presetSig === presetSig
    if (alreadyApplied) return
    applyThemePreset(nextKey, { presets: themePresets, overrides: cmsOverrides })
    appliedThemeRef.current = { key: nextKey, overridesSig, presetSig }
  }, [applyThemePreset, cmsOverrides, cmsThemeKey, globalTheme, themePresets])

  useEffect(() => {
    function onDocClick(e) {
      if (!showCatMenu) return
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) setShowCatMenu(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setShowCatMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showCatMenu])

  const categoriesSection = cms.categoryCapsules?.items?.length
    ? cms.categoryCapsules.items
    : MOCK_HOMEPAGE_CONTENT.categoryCapsules.items
  const brandSection = cms.brandHighlights?.items?.length
    ? cms.brandHighlights.items
    : MOCK_HOMEPAGE_CONTENT.brandHighlights.items
  const testimonialsSection = cms.testimonials?.items?.length
    ? cms.testimonials.items
    : MOCK_HOMEPAGE_CONTENT.testimonials.items

  function scrollToProducts() {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function addToCart(productId) {
    try {
      await dispatch(addToCartThunk({ productId, qty: 1 }))
      notify.success('Added to cart')
    } catch (e) {
      notify.error(e.message || 'Failed to add to cart')
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
      <div className="container relative space-y-16 py-14">
        <section
          className="relative overflow-hidden rounded-3xl border px-8 py-14 shadow-xl sm:px-12 lg:flex lg:items-center lg:gap-12"
          style={{ background: cmsOverrides?.['--hero-background'] || 'var(--hero-background)' }}
        >
          <div className="absolute -right-20 top-1/2 hidden h-[32rem] w-[32rem] -translate-y-1/2 rounded-full bg-primary/20 blur-3xl lg:block" aria-hidden="true" />
          <div className="relative z-10 space-y-6 lg:max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              {cms.hero?.eyebrow || 'Marketplace reimagined'}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {cms.hero?.title || 'A flagship experience for modern multi-brand commerce'}
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              {cms.hero?.subtitle ||
                'Discover limited-run capsules, design-led essentials, and visionary labels powered by our curated seller collective.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={scrollToProducts}>
                {cms.hero?.ctaLabel || 'Browse featured drops'}
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={cms.hero?.secondaryCta?.href || '/seller/apply'}>
                  {cms.hero?.secondaryCta?.label || 'Become a marketplace seller'}
                </Link>
              </Button>
              <div className="relative" ref={catMenuRef}>
                <Button
                  size="lg"
                  variant="ghost"
                  className="border border-transparent bg-background/70 backdrop-blur"
                  onClick={() => setShowCatMenu((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={showCatMenu}
                >
                  Curated categories
                  <svg className={`ml-2 h-4 w-4 transition-transform ${showCatMenu ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z" clipRule="evenodd" />
                  </svg>
                </Button>
                {showCatMenu && (
                  <div role="menu" tabIndex={-1} className="absolute z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-card/95 backdrop-blur shadow-2xl">
                    <div className="border-b px-4 py-3 text-sm font-semibold text-muted-foreground">Shop by narrative</div>
                    {catsLoading && <div className="px-4 py-4 text-sm text-muted-foreground">Loading stories…</div>}
                    {!catsLoading && catsErr && <div className="px-4 py-4 text-sm text-red-500">{catsErr}</div>}
                    {!catsLoading && !catsErr && (
                      <ul className="max-h-72 overflow-auto py-2">
                        {cats.map((c) => (
                          <li key={c._id}>
                            <Link
                              to={`/category/${c.slug}`}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/60"
                              onClick={() => setShowCatMenu(false)}
                            >
                              <span className="truncate font-medium text-foreground">{c.name}</span>
                              {typeof c.sortOrder === 'number' && c.sortOrder !== 0 && (
                                <span className="ml-2 shrink-0 text-xs text-muted-foreground">#{c.sortOrder}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-10 w-full max-w-xl flex-1 lg:mt-0">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
              <img
                src={
                  cms.hero?.backgroundImage ||
                  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
                }
                alt="Flagship showroom"
                className="aspect-[5/4] w-full object-cover"
              />
              <div className="space-y-2 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Flagship spotlight</p>
                <p className="text-xl font-medium text-foreground">Sculpted lighting from independent designers around the globe.</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">New this week</Badge>
                  <Badge variant="outline">Limited allocation</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {cms.notification?.enabled && (
          <div className="rounded-2xl border bg-card/80 px-6 py-4 text-sm shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{cms.notification.message}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Announcement</p>
              </div>
              {(cms.notification.ctaLabel || cms.notification.ctaHref) && (
                <Button asChild size="sm" variant="outline">
                  <Link to={cms.notification.ctaHref || '#'}>{cms.notification.ctaLabel || 'Learn more'}</Link>
                </Button>
              )}
            </div>
          </div>
        )}

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Curated universes</p>
              <h2 className="text-2xl font-semibold">{cms.categoryCapsules?.heading?.title || 'Shop by editorial universe'}</h2>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="self-start border border-input"
              onClick={scrollToProducts}
            >
              {cms.categoryCapsules?.cta?.label || 'Explore all categories'}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(cmsLoading ? MOCK_HOMEPAGE_CONTENT.categoryCapsules.items : categoriesSection).slice(0, 4).map((category) => (
              <Card key={`${category.name}-${category.order}`} className="group relative overflow-hidden border bg-gradient-to-br from-background via-background to-primary/5">
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: 'radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 55%)' }}
                />
                <CardHeader className="relative z-10 pb-4">
                  <CardTitle className="text-lg font-semibold text-foreground">{category.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardHeader>
                <CardContent className="relative z-10 flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 text-xs uppercase tracking-[0.2em] text-primary">
                    {category.badge || 'Featured'}
                  </Badge>
                  <Button asChild size="sm" variant="ghost" className="font-medium hover:text-primary">
                    <Link to={category.href || '#'}>View curation</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section ref={productsRef} id="products" className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Featured drops</p>
              <h2 className="text-2xl font-semibold">What the community is loving right now</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              {err ? <span className="text-red-500">{err} — showing editorial picks</span> : 'Hand-picked by our merchants'}
            </div>
          </div>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border bg-card/80 p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="skeleton h-5 w-3/4 rounded" />
                    <div className="skeleton h-5 w-10 rounded" />
                  </div>
                  <div className="skeleton aspect-square w-full rounded-xl" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="skeleton h-4 w-16 rounded" />
                    <div className="skeleton h-9 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((p) => (
                <Card key={p._id} className="group h-full overflow-hidden border bg-card shadow-md transition hover:-translate-y-1 hover:shadow-2xl">
                  <CardContent className="p-0">
                    <Link to={`/product/${p.slug}`} className="block">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="aspect-square w-full bg-muted" />
                      )}
                    </Link>
                  </CardContent>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="truncate text-lg font-semibold">
                        <Link to={`/product/${p.slug}`} className="hover:underline">
                          {p.title}
                        </Link>
                      </CardTitle>
                      {p.tags?.[0] && <Badge>{p.tags[0]}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Market price</p>
                        <p className="text-lg font-semibold text-foreground">${Number(p.price).toFixed(2)}</p>
                      </div>
                      <Button size="sm" className="rounded-full" onClick={() => addToCart(p._id)}>
                        Add to cart
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Partner studios</p>
              <h2 className="text-2xl font-semibold">Brands shaping the platform</h2>
            </div>
            <Button asChild variant="link" className="text-sm">
              <Link to="/seller/apply">Partner with us →</Link>
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {(cmsLoading ? MOCK_BRANDS : brandSection).slice(0, 3).map((brand) => (
              <Card key={brand.name} className="border bg-card/90 backdrop-blur">
                <CardContent className="flex gap-4 p-6">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border">
                    <img src={brand.logoUrl || brand.logo} alt={brand.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Signature brand</p>
                    <h3 className="text-lg font-semibold text-foreground">{brand.name}</h3>
                    <p className="text-sm text-muted-foreground">{brand.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-card/80 px-8 py-12 shadow-lg backdrop-blur">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{cms.testimonials?.heading?.eyebrow || 'Seller voices'}</p>
              <h2 className="text-2xl font-semibold">{cms.testimonials?.heading?.title || 'Why creators choose our marketplace'}</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/seller/apply">Start your application</Link>
            </Button>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {(cmsLoading ? MOCK_TESTIMONIALS : testimonialsSection).slice(0, 2).map((testimonial, index) => (
              <blockquote key={index} className="rounded-2xl border bg-background/80 p-6 shadow-sm">
                <p className="text-lg font-medium text-foreground">“{testimonial.quote}”</p>
                <footer className="mt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{testimonial.name}</span>
                  {testimonial.role ? ` · ${testimonial.role}` : ''}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-secondary/10 via-background to-background p-10 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">For visionary sellers</p>
              <h2 className="text-3xl font-semibold">{cms.sellerCta?.heading || 'Launch your flagship inside a multi-brand icon'}</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {cms.sellerCta?.body ||
                  'We champion boutique labels with premium storytelling, unified logistics, and concierge support. Apply today and join a collective of design-first brands with a global audience.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to={cms.sellerCta?.primaryCta?.href || '/seller/apply'}>
                  {cms.sellerCta?.primaryCta?.label || 'Submit seller application'}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={cms.sellerCta?.secondaryCta?.href || '/seller/dashboard'}>
                  {cms.sellerCta?.secondaryCta?.label || 'Seller dashboard'}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
