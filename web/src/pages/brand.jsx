import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { MOCK_HOMEPAGE_CONTENT } from '@/data/mockStorefront'

const BRAND_SECTION_FALLBACK = MOCK_HOMEPAGE_CONTENT.brandHighlights

function hydrateBrandHighlights(raw = {}) {
  const fallback = BRAND_SECTION_FALLBACK || { heading: {}, items: [] }
  const section = raw?.brandHighlights ?? raw ?? {}
  const heading = {
    eyebrow: section.heading?.eyebrow || fallback.heading?.eyebrow || '',
    title: section.heading?.title || fallback.heading?.title || 'Brands',
    subtitle: section.heading?.subtitle || fallback.heading?.subtitle || '',
  }
  const items = Array.isArray(section.items) && section.items.length
    ? section.items
    : Array.isArray(fallback.items)
      ? fallback.items
      : []
  return { heading, items }
}

const SORT_OPTIONS = [
  { value: 'sortOrder name', label: 'Featured' },
  { value: 'name', label: 'Name · A → Z' },
  { value: '-name', label: 'Name · Z → A' },
  { value: '-createdAt', label: 'Newest' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
]

const ALPHABET = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#']

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  const maximumFractionDigits = value % 1 === 0 ? 0 : 2
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits }).format(value)
}

export default function BrandsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [cms, setCms] = useState(() => hydrateBrandHighlights())
  const [cmsLoading, setCmsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sort, setSort] = useState('sortOrder name')
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(24)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [initial, setInitial] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)
  const previousItemsRef = useRef([])
  const previousMetaRef = useRef({ total: 0, pages: 1, page: 1, limit })
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if (debouncedQuery && initial) {
      setInitial('')
    }
  }, [debouncedQuery, initial])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr('')
      setUsingFallback(false)
      try {
        const searchParams = new URLSearchParams()
        searchParams.set('limit', String(limit))
        searchParams.set('page', String(page))
        searchParams.set('sort', sort)
        if (statusFilter) searchParams.set('status', statusFilter)
        if (debouncedQuery) searchParams.set('q', debouncedQuery)
        if (initial) searchParams.set('initial', initial)

        const response = await api.get(`/brands?${searchParams.toString()}`)
        if (cancelled) return
        const incomingItems = response.items || []
        setItems((prev) => {
          if (page === 1) return incomingItems
          const existingIds = new Set(prev.map((item) => item._id))
          const merged = [...prev]
          incomingItems.forEach((item) => {
            if (!existingIds.has(item._id)) merged.push(item)
          })
          return merged
        })
        previousItemsRef.current = page === 1 ? incomingItems : [...previousItemsRef.current, ...incomingItems]
        previousMetaRef.current = {
          total: response.total || 0,
          pages: response.pages || 1,
          page,
          limit,
        }
        setTotal(response.total || 0)
        setPages(response.pages || 1)
        setUsingFallback(false)
      } catch (e) {
        if (cancelled) return
        setErr(e.message || 'Failed to load brands')
        if (previousItemsRef.current.length) {
          setItems(previousItemsRef.current)
          setTotal(previousMetaRef.current.total)
          setPages(previousMetaRef.current.pages)
          setUsingFallback(true)
        } else {
          setItems([])
          setTotal(0)
          setPages(1)
          setUsingFallback(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, limit, page, sort, statusFilter, initial, refreshToken])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setCmsLoading(true)
        const { content } = await api.get('/homepage')
        if (!active) return
        const hasPublishedContent = Boolean(content) && content.published !== false
        setCms(hasPublishedContent ? hydrateBrandHighlights(content) : hydrateBrandHighlights())
      } catch {
        if (!active) return
        setCms(hydrateBrandHighlights())
      } finally {
        if (active) setCmsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const highlightSource = cmsLoading ? BRAND_SECTION_FALLBACK?.items : cms.items
  const highlightItems = Array.isArray(highlightSource) ? highlightSource : []
  const heroHighlight = highlightItems[0]
  const secondaryHighlights = highlightItems.slice(1, 4)
  const effectiveTotal = total || items.length
  const showingFrom = items.length ? Math.min((page - 1) * limit + 1, effectiveTotal) : 0
  const showingTo = items.length ? Math.min(showingFrom + items.length - 1, effectiveTotal) : 0
  const canPrev = page > 1
  const canNext = page < pages
  const handleRetry = () => setRefreshToken((token) => token + 1)
  const isInitialLoad = loading && page === 1 && items.length === 0
  const isFetchingMore = loading && page > 1

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return undefined
    if (!canNext) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loading && page < pages) {
            setPage((prev) => (prev < pages ? prev + 1 : prev))
          }
        })
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [canNext, loading, page, pages])
  let metaSummary = loading
    ? 'Loading brands…'
    : effectiveTotal
      ? `Showing ${showingFrom.toLocaleString()}-${showingTo.toLocaleString()} of ${effectiveTotal.toLocaleString()} brands`
      : debouncedQuery
        ? `No matches for “${debouncedQuery}”`
        : 'No brands available.'
  if (!loading && err && !usingFallback) metaSummary = 'Unable to load brands.'
  if (!loading && !err && initial) {
    const label = initial === '#' ? '0-9' : initial
    metaSummary = `${metaSummary} · ${label}-brands`
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-2">
        {cms.heading.eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{cms.heading.eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{cms.heading.title || 'Brands'}</h1>
        {cms.heading.subtitle && <p className="max-w-2xl text-sm text-muted-foreground">{cms.heading.subtitle}</p>}
      </div>

      {heroHighlight && (
        <section className="space-y-6">
          <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-background to-background shadow-xl">
            <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center">
              <div className="flex-1 space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">Featured brand</p>
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                  {heroHighlight.name || 'Flagship partner spotlight'}
                </h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {heroHighlight.description || 'Discover the storytelling and signature products from our flagship marketplace partners.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {heroHighlight.href && (
                    <Button asChild size="lg">
                      <a href={heroHighlight.href} target="_blank" rel="noreferrer">
                        Shop {heroHighlight.name ? heroHighlight.name.split(' ')[0] : 'brand'}
                      </a>
                    </Button>
                  )}
                  <Button size="lg" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    View all highlights
                  </Button>
                </div>
              </div>
              <div className="relative flex h-48 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-card/80 p-6 md:h-60 md:w-60">
                {heroHighlight.logoUrl ? (
                  <img src={heroHighlight.logoUrl} alt={heroHighlight.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Brand highlight</span>
                )}
              </div>
            </div>
          </div>

          {secondaryHighlights.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">More featured partners</p>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {secondaryHighlights.map((highlight, index) => (
                  <Card
                    key={highlight.name || highlight._id || `highlight-${index}`}
                    className="min-w-[260px] flex-1 border bg-card/90 backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border bg-muted">
                          {highlight.logoUrl ? (
                            <img src={highlight.logoUrl} alt={highlight.name || 'Featured brand'} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Brand</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{highlight.name || 'Featured brand'}</h3>
                          {highlight.description && <p className="text-xs text-muted-foreground line-clamp-2">{highlight.description}</p>}
                        </div>
                      </div>
                      {highlight.href && (
                        <Button asChild size="sm" variant="outline">
                          <a href={highlight.href} target="_blank" rel="noreferrer">
                            Explore
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card/60 px-4 py-3 text-sm shadow-sm">
        <span className="mr-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">Browse alphabet</span>
        {ALPHABET.map((label) => {
          const value = label === 'All' ? '' : label === '#' ? '#' : label
          const active = initial === value
          return (
            <Button
              key={label}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              className="h-8 px-2"
              aria-pressed={active}
              onClick={() => {
                setInitial(value)
                setPage(1)
              }}
            >
              {label}
            </Button>
          )
        })}
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label htmlFor="brand-search" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Search brands
              </label>
              <input
                id="brand-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Search by name or description"
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="brand-status" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </label>
              <select
                id="brand-status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value)
                  setPage(1)
                }}
                className="mt-1 h-10 rounded-md border bg-background px-3 text-sm"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="brand-sort" className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Sort
              </label>
              <select
                id="brand-sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value)
                  setPage(1)
                }}
                className="mt-1 h-10 rounded-md border bg-background px-3 text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {metaSummary}
              {usingFallback && (
                <span className="ml-2 text-amber-600">Showing cached results</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:block">Per page</span>
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value))
                  setPage(1)
                }}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                {[12, 24, 48].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {isInitialLoad
            ? Array.from({ length: limit }).map((_, index) => (
              <Card key={`brand-skeleton-${index}`} className="animate-pulse bg-muted/40">
                <div className="aspect-[3/2] w-full rounded-md bg-muted" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted/80" />
                </div>
              </Card>
            ))
            : items.map((brand) => {
              const launchedAt = brand.createdAt ? new Date(brand.createdAt) : null
              const updatedAt = brand.updatedAt ? new Date(brand.updatedAt) : null
              const launchLabel = launchedAt ? launchedAt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : null
              const updatedLabel = updatedAt ? updatedAt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : null
              const statusLabel = brand.status === 'draft' ? 'Coming soon' : 'Active'
              const priorityBadge = Number.isFinite(brand.sortOrder) ? `Priority ${brand.sortOrder + 1}` : null
              const description = brand.description?.trim() || 'This partner brand is preparing their flagship experience. Stay tuned.'
              const metrics = brand.metrics || {}
              const productCount = metrics.productCount || 0
              const minPrice = Number.isFinite(metrics.minPrice) ? metrics.minPrice : null
              const maxPrice = Number.isFinite(metrics.maxPrice) ? metrics.maxPrice : null
              const priceRange = minPrice != null && maxPrice != null
                ? (minPrice === maxPrice ? formatCurrency(minPrice) : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`)
                : null
              const topBadge = brand.sortOrder === 0 ? 'Flagship partner' : brand.sortOrder === 1 ? 'Editor’s pick' : null
              return (
                <Card key={brand._id} className="group flex h-full flex-col justify-between">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="truncate text-lg">{brand.name}</CardTitle>
                      <Badge variant={brand.status === 'active' ? 'default' : 'outline'} className="shrink-0 uppercase tracking-[0.2em]">
                        {statusLabel}
                      </Badge>
                    </div>
                    {priorityBadge && (
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{priorityBadge}</p>
                    )}
                    {topBadge && (
                      <Badge variant="default" className="mt-1 bg-primary text-primary-foreground">{topBadge}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-md border bg-muted p-2">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="aspect-[3/2] w-full object-contain" />
                        ) : (
                          <div className="aspect-[3/2] w-full rounded-md bg-muted" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {launchLabel && (
                          <Badge variant="outline" className="border-transparent bg-secondary/60 text-muted-foreground">
                            Since {launchLabel}
                          </Badge>
                        )}
                        {updatedLabel && (
                          <Badge variant="outline">
                            Updated {updatedLabel}
                          </Badge>
                        )}
                        {productCount > 0 && (
                          <Badge variant="outline">
                            {productCount} product{productCount === 1 ? '' : 's'}
                          </Badge>
                        )}
                        {priceRange && (
                          <Badge variant="outline" className="bg-muted/60">
                            {priceRange}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                      <Button asChild size="sm">
                        <Link to={`/brand/${brand.slug || brand._id}`}>
                          View brand hub
                        </Link>
                      </Button>
                      {brand.website && (
                        <Button asChild size="sm" variant="outline">
                          <a href={brand.website} target="_blank" rel="noreferrer">
                            Visit website
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
        {isFetchingMore && (
          <div className="flex justify-center py-4 text-sm text-muted-foreground">
            Loading more brands…
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => canPrev && setPage((prev) => Math.max(prev - 1, 1))} disabled={!canPrev}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => canNext && setPage((prev) => Math.min(prev + 1, pages))} disabled={!canNext}>
              Next
            </Button>
            {err && (
              <Button variant="default" size="sm" onClick={handleRetry} disabled={loading}>
                Try again
              </Button>
            )}
          </div>
        </div>
        {canNext && (
          <div className="flex flex-col items-center gap-3 pt-4">
            <div ref={loadMoreRef} className="h-6 w-full" aria-hidden="true" />
            <Button variant="outline" size="sm" onClick={() => !loading && setPage((prev) => Math.min(prev + 1, pages))} disabled={loading}>
              Load more brands
            </Button>
          </div>
        )}
        {err && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {usingFallback ? `${err}. Showing the last available results.` : err}
          </div>
        )}
      </div>
    </div>
  )
}
