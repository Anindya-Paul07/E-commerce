import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Badge from "@/components/ui/badge"

export default function Home() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [cats, setCats] = useState([])
  const [catsLoading, setCatsLoading] = useState(true)
  const [catsErr, setCatsErr] = useState('')

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

  return (
    <div className="container space-y-10 py-10">
      {/* Hero */}
      <section className="relative rounded-lg bg-gradient-to-r from-muted to-transparent p-8">
        <h2 className="text-3xl font-bold tracking-tight">End-of-Season Sale</h2>
        <p className="mt-1 text-muted-foreground">Up to 40% off on selected styles.</p>
        <div className="mt-6 flex gap-3">
          {/* Shop now -> smooth scroll to products section on THIS page */}
          <Button type="button" onClick={scrollToProducts}>Shop now</Button>

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
          {/* optional "View all" could also scroll; leaving out to keep single-page listing */}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading products…</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(p => (
            <Card key={p._id} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="truncate">
                    {/* Keep your detail route as-is; if you use /products/:slug, change below accordingly */}
                    <Link to={`/product/${p.slug}`} className="hover:underline">{p.title}</Link>
                  </CardTitle>
                  {p.tags?.[0] && <Badge>{p.tags[0]}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <Link to={`/products/${p.slug}`}>
                  {p.images?.[0]
                    ? <img
                        src={p.images[0]}
                        alt={p.title}
                        className="aspect-square w-full rounded-md object-cover bg-muted/60 transition-colors group-hover:bg-muted"
                      />
                    : <div className="aspect-square w-full rounded-md bg-muted/60 group-hover:bg-muted transition-colors" />
                  }
                </Link>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">${Number(p.price).toFixed(2)}</span>
                  <Button size="sm">Add to cart</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
