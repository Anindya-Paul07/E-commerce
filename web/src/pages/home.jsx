import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { notify } from '@/lib/notify'
import { useAppDispatch } from '@/store/hooks'
import { addToCart as addToCartThunk } from '@/store/slices/cartSlice'

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [cats, setCats] = useState([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [catsErr, setCatsErr] = useState('')
  const dispatch = useAppDispatch()

  // Dropdown state
  const [showCatMenu, setShowCatMenu] = useState(false)
  const catMenuRef = useRef(null)
  const productsRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const { items } = await api.get('/products?limit=8&status=active&sort=-createdAt')
        setItems(items)
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

  // Add to cart for cards
  async function addToCart(productId) {
    try {
      await dispatch(addToCartThunk({ productId, qty: 1 }));
      notify.success('Added to cart');
    } catch (e) {
      notify.error(e.message || 'Failed to add to cart');
    }
  }

  return (
    <div className="container space-y-10 py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/12 via-primary/8 to-secondary p-8 shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          End-of-Season Sale
        </h2>
        <p className="mt-2 max-w-xl text-base text-muted-foreground">
          Elevate your everyday essentials with curated drops and limited-run collaborations inspired by modern retail leaders.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {/* Shop now -> smooth scroll to products section on THIS page */}
          <Button type="button" onClick={scrollToProducts}>Shop now</Button>

          {/* Browse brands (NEW) */}
          <Button asChild variant="outline">
            <Link to="/brands">Browse brands</Link>
          </Button>

          {/* Explore categories dropdown */}
          <div className="relative" ref={catMenuRef}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCatMenu(v => !v)}
              aria-haspopup="menu"
              aria-expanded={showCatMenu}
            >
              Explore categories
              <svg
                className={`ml-2 h-4 w-4 transition-transform ${showCatMenu ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z" clipRule="evenodd" />
              </svg>
            </Button>

            {showCatMenu && (
              <div role="menu" tabIndex={-1} className="absolute z-50 mt-2 w-56 overflow-hidden rounded-md border bg-card shadow-lg">
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
        </div>
      </section>

      {/* Products (on Home) */}
      <section ref={productsRef} id="products" className="space-y-4">
        <div className="flex items-end justify-between">
          <h3 className="text-xl font-semibold">Featured</h3>
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
            {items.map(p => (
              <Card key={p._id} className="group border-none bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate text-base font-semibold">
                      <Link to={`/product/${p.slug}`} className="hover:underline">{p.title}</Link>
                    </CardTitle>
                    {p.tags?.[0] && <Badge>{p.tags[0]}</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to={`/product/${p.slug}`}>
                    {p.images?.[0]
                      ? <img
                          src={p.images[0]}
                          alt={p.title}
                          className="aspect-square w-full rounded-lg object-cover bg-muted/60 transition duration-300 group-hover:scale-[1.02]"
                        />
                      : <div className="aspect-square w-full rounded-lg bg-muted" />
                    }
                  </Link>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold">${Number(p.price).toFixed(2)}</span>
                    <Button size="sm" onClick={() => addToCart(p._id)}>Add to cart</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
