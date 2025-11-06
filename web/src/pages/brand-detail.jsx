import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default function BrandDetailPage() {
  const { slug } = useParams()
  const [brand, setBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState([])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const [{ brand: brandPayload }, productPayload] = await Promise.all([
          api.get(`/brands/${slug}`),
          api.get(`/products?brand=${slug}&limit=12&status=active`).catch(() => ({ items: [] })),
        ])
        if (!active) return
        setBrand(brandPayload)
        setProducts(productPayload.items || [])
      } catch (err) {
        if (!active) return
        setError(err.message || 'Failed to load brand')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [slug])

  const launchLabel = useMemo(() => brand?.createdAt ? new Date(brand.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null, [brand])
  const productCount = brand?.metrics?.productCount || products.length
  const minPrice = brand?.metrics?.minPrice
  const maxPrice = brand?.metrics?.maxPrice
  const priceRange = minPrice != null && maxPrice != null
    ? (minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`)
    : null

  if (loading) {
    return (
      <div className="container space-y-6 py-10">
        <div className="h-9 w-52 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-3xl border bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="animate-pulse bg-muted/40">
              <div className="aspect-square w-full rounded-t-md bg-muted" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted/80" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container space-y-4 py-10">
        <h1 className="text-3xl font-semibold text-foreground">Brand unavailable</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild>
          <Link to="/brands">Browse all brands</Link>
        </Button>
      </div>
    )
  }

  if (!brand) {
    return null
  }

  return (
    <div className="container space-y-10 py-10">
      <section className="overflow-hidden rounded-3xl border bg-card/90 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <Badge variant={brand.status === 'active' ? 'default' : 'outline'} className="uppercase tracking-[0.3em]">
              {brand.status === 'draft' ? 'Coming soon' : 'Marketplace brand'}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">{brand.name}</h1>
              {launchLabel && <p className="text-sm text-muted-foreground">Partner since {launchLabel}</p>}
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">{brand.description || 'This partner brand is curating their flagship experience inside our marketplace. Check back soon for their spotlight collections.'}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline">{productCount} product{productCount === 1 ? '' : 's'}</Badge>
              {priceRange && <Badge variant="outline">Price range {priceRange}</Badge>}
              {brand.sortOrder != null && <Badge variant="outline">Priority {brand.sortOrder + 1}</Badge>}
            </div>
            <div className="flex flex-wrap gap-3">
              {productCount > 0 && (
                <Button asChild size="lg">
                  <Link to={`/search?q=${encodeURIComponent(brand.name)}&brand=${encodeURIComponent(brand.slug || brand.name)}`}>
                    Shop {brand.name}
                  </Link>
                </Button>
              )}
              {brand.website && (
                <Button asChild variant="outline" size="lg">
                  <a href={brand.website} target="_blank" rel="noreferrer">Visit brand site</a>
                </Button>
              )}
              <Button asChild variant="ghost" size="lg">
                <Link to="/brands">Back to brands</Link>
              </Button>
            </div>
          </div>
          <div className="flex h-56 w-full max-w-sm flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted p-6">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Brand logo</span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Collections</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/search?q=${encodeURIComponent(brand.name)}`}>View all</Link>
          </Button>
        </div>
        {productCount === 0 && (
          <p className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            This brand is onboarding their catalog. Check back soon for curated collections and best sellers.
          </p>
        )}
        {products.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product._id} className="h-full">
                <div className="aspect-square w-full overflow-hidden rounded-t-3xl bg-muted">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Product</div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{brand.name}</p>
                  <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.title}</h3>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(product.price)}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/product/${product.slug}`}>View product</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
