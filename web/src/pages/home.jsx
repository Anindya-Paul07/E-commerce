import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import { useTheme } from '@/context/ThemeContext'
import { HERO_ASSETS, EDITORIAL_ASSETS } from '@/lib/assets'

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [cats, setCats] = useState([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [catsErr, setCatsErr] = useState('')
  const { theme } = useTheme()
  const navigate = useNavigate()

  // Dropdown state
  const [showCatMenu, setShowCatMenu] = useState(false)
  const catMenuRef = useRef(null)
  const productsRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api.get('/catalog/listings?limit=8')
        setItems(items || [])
      } catch (e) {
        setErr(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api.get('/categories?limit=20')
        setCats(items || [])
      } catch (e) {
        setCatsErr(e.message)
      } finally {
        setCatsLoading(false)
      }
    })()
  }, [])

  // Close dropdown on outside click / Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!showCatMenu) return
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) setShowCatMenu(false)
    }
    function onKey(e) { if (e.key === 'Escape') setShowCatMenu(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [showCatMenu])

  function scrollToProducts() {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-12 py-10">
      {/* Hero */}
      <section className="relative border-y bg-secondary/60">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${theme.hero.background})` }}
          aria-hidden
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[2.5fr_1fr] lg:px-8">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {theme.hero.headline}
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              {theme.hero.subheadline}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={() => navigate(theme.hero.ctaHref)}>
                {theme.hero.ctaLabel}
              </Button>
              <Button type="button" variant="outline" onClick={scrollToProducts}>
                Browse featured
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {theme.highlights?.map((item) => (
                <span key={item} className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <aside className="rounded-xl bg-card/90 p-4 shadow-lg ring-1 ring-border">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick catalogue
            </h3>
            <div className="space-y-2">
              {Object.values(HERO_ASSETS).map((asset) => (
                <Link key={asset.title} to={asset.href} className="flex items-center gap-3 rounded-md border border-border/60 bg-card/70 px-3 py-2 text-sm shadow-sm transition hover:-translate-y-px hover:shadow">
                  <span className="min-w-[48px] overflow-hidden rounded-md">
                    <img src={asset.image} alt="" className="h-12 w-12 object-cover" />
                  </span>
                  <span className="font-medium text-foreground">{asset.title}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 lg:grid-cols-[2.7fr_1.3fr] lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Shop by category</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCatMenu(v => !v)}
              aria-haspopup="menu"
              aria-expanded={showCatMenu}
            >
              All categories
              <svg
                className={`ml-2 h-4 w-4 transition-transform ${showCatMenu ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z" clipRule="evenodd" />
              </svg>
            </Button>

            {showCatMenu && (
              <div role="menu" tabIndex={-1} className="absolute z-50 mt-2 w-64 overflow-hidden rounded-md border bg-card shadow-lg">
                <div className="border-b px-3 py-2 text-sm font-medium">Categories</div>
                {catsLoading && <div className="px-3 py-3 text-sm text-muted-foreground">Loading…</div>}
                {!catsLoading && catsErr && <div className="px-3 py-3 text-sm text-red-600">{catsErr}</div>}
                {!catsLoading && !catsErr && cats.length === 0 && (
                  <div className="px-3 py-3 text-sm text-muted-foreground">No categories yet.</div>
                )}
                {!catsLoading && !catsErr && cats.length > 0 && (
                  <ul className="max-h-72 overflow-auto py-1">
                    {cats.map((c) => (
                      <li key={c._id}>
                        <Link
                          to={`/category/${c.slug}`}
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => setShowCatMenu(false)}
                        >
                          <span className="truncate">{c.name}</span>
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
        </section>

        <aside className="space-y-4">
          <h3 className="text-xl font-semibold">Marketplace stories</h3>
          <div className="space-y-3">
            {EDITORIAL_ASSETS.map((story) => (
              <Card key={story.title} className="border bg-card/90">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{story.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{story.copy}</p>
                  <Button size="sm" variant="ghost" className="px-0" onClick={() => navigate(story.href)}>
                    {story.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </aside>
      </div>

      {/* Products (on Home) */}
      <section ref={productsRef} id="products" className="mx-auto max-w-6xl space-y-4 px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-semibold">Featured products</h3>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border bg-card/80 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-5 w-10 rounded" />
                </div>
                <div className="skeleton aspect-square w-full rounded-lg" />
                <div className="mt-4 flex items-center justify-between">
                  <div className="skeleton h-4 w-16 rounded" />
                  <div className="skeleton h-9 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map(listing => {
              const product = listing.catalogProduct || {}
              const offers = listing.offers || []
              const firstOffer = offers[0]
              return (
                <Card key={listing._id} className="group border-none bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate text-base font-semibold">
                      <Link to={`/product/${product.slug}`} className="hover:underline">{product.name}</Link>
                    </CardTitle>
                    {product.brand && <Badge>{product.brand}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to={`/product/${product.slug}`}>
                    {product.images?.[0]
                      ? <img
                          src={product.images[0]}
                          alt={product.name}
                          className="aspect-square w-full rounded-lg object-cover bg-muted/60 transition duration-300 group-hover:scale-[1.02]"
                        />
                      : <div className="aspect-square w-full rounded-lg bg-muted" />
                    }
                  </Link>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {firstOffer?.price != null ? `$${Number(firstOffer.price).toFixed(2)}` : 'See pricing'}
                    </span>
                    <Button size="sm" asChild>
                      <Link to={`/product/${product.slug}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
