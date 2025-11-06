import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function BrandsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [cms, setCms] = useState(() => hydrateBrandHighlights())
  const [cmsLoading, setCmsLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('')
      try {
        const { items } = await api.get('/brands?status=active&limit=200&sort=sortOrder name')
        setItems(items || [])
      } catch (e) { setErr(e.message || 'Failed to load brands') }
      finally { setLoading(false) }
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

  const highlightItems = ((cmsLoading ? BRAND_SECTION_FALLBACK.items : cms.items) || []).slice(0, 3)

  return (
    <div className="container py-10 space-y-8">
      <div className="space-y-2">
        {cms.heading.eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{cms.heading.eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{cms.heading.title || 'Brands'}</h1>
        {cms.heading.subtitle && <p className="max-w-2xl text-sm text-muted-foreground">{cms.heading.subtitle}</p>}
      </div>

      {highlightItems.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlightItems.map((highlight, index) => (
            <Card key={highlight.name || highlight._id || `highlight-${index}`} className="border bg-card/90 backdrop-blur">
              <CardContent className="flex gap-4 p-6">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border bg-muted">
                  {highlight.logoUrl ? (
                    <img src={highlight.logoUrl} alt={highlight.name || 'Featured brand'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Brand</span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">{highlight.name || 'Featured brand'}</h3>
                  {highlight.description && <p className="text-sm text-muted-foreground">{highlight.description}</p>}
                  {highlight.href && (
                    <a href={highlight.href} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Explore
                      <span aria-hidden="true">→</span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      {!loading && !err && !items.length && <p className="text-sm text-muted-foreground">No brands yet.</p>}

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map(b => (
          <Card key={b._id} className="group">
            <CardHeader className="pb-2">
              <CardTitle className="truncate">{b.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {b.logo
                ? <img src={b.logo} alt={b.name} className="aspect-[3/2] w-full rounded-md object-contain bg-muted p-2" />
                : <div className="aspect-[3/2] w-full rounded-md bg-muted" />
              }
              {b.website && (
                <a href={b.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary hover:underline">
                  Visit website
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
