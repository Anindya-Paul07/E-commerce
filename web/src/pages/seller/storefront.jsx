import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'

const ACCENT_OPTIONS = [
  { value: '#6366f1', label: 'Indigo flagship' },
  { value: '#0ea5e9', label: 'Aqua studio' },
  { value: '#f97316', label: 'Sunset drop' },
  { value: '#22d3ee', label: 'Cyan bloom' },
  { value: '#1d4ed8', label: 'Voyager' },
]

const HERO_DEFAULTS = {
  eyebrow: 'Inside the flagship',
  title: 'Welcome to our storefront',
  subtitle: 'Curated collections and signature releases from our studio.',
  backgroundImage: '',
  primaryCta: { label: 'Shop collection', href: '/products' },
  secondaryCta: { label: 'Contact us', href: '/support' },
}

const CAROUSEL_TEMPLATE = { title: '', caption: '', imageUrl: '', href: '' }

function hydrate(payload = {}) {
  return {
    hero: { ...HERO_DEFAULTS, ...(payload.hero || {}) },
    carousel: Array.isArray(payload.carousel) ? payload.carousel : [],
    palette: {
      accentColor: payload.palette?.accentColor || ACCENT_OPTIONS[0].value,
      heroGradient: payload.palette?.heroGradient || '',
      backgroundStyle: payload.palette?.backgroundStyle || '',
    },
  }
}

export default function SellerStorefrontPage() {
  const [content, setContent] = useState(hydrate())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      const { marketing } = await api.get('/sellers/storefront')
      setContent(hydrate(marketing))
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load storefront settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  function updateHero(field, value) {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }))
  }

  function updateHeroCta(type, field, value) {
    setContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [type]: { ...(prev.hero?.[type] || {}), [field]: value },
      },
    }))
  }

  function addCarouselItem() {
    setContent((prev) => ({
      ...prev,
      carousel: [...prev.carousel, { ...CAROUSEL_TEMPLATE }],
    }))
  }

  function updateCarousel(index, field, value) {
    setContent((prev) => ({
      ...prev,
      carousel: prev.carousel.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  function removeCarousel(index) {
    setContent((prev) => ({
      ...prev,
      carousel: prev.carousel.filter((_, i) => i !== index),
    }))
  }

  function moveCarousel(index, direction) {
    setContent((prev) => {
      const items = [...prev.carousel]
      const target = index + direction
      if (target < 0 || target >= items.length) return prev
      const [removed] = items.splice(index, 1)
      items.splice(target, 0, removed)
      return { ...prev, carousel: items }
    })
  }

  const paletteOptions = useMemo(() => ACCENT_OPTIONS, [])

  async function handleSave() {
    try {
      setSaving(true)
      const payload = {
        ...content,
        palette: content.palette,
      }
      const { marketing } = await api.put('/sellers/storefront', payload)
      setContent(hydrate(marketing))
      notify.success('Storefront saved')
    } catch (err) {
      notify.error(err.message || 'Failed to save storefront')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Storefront experience</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading storefront configuration…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Storefront CMS</h1>
          <p className="text-sm text-muted-foreground">Fine-tune your hero, campaign carousel, and accent palette.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.hero.eyebrow}
                onChange={(e) => updateHero('eyebrow', e.target.value)}
                placeholder="Eyebrow copy"
              />
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-lg font-semibold"
                value={content.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                placeholder="Headline"
              />
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2"
                value={content.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                placeholder="Subheading"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Primary CTA label</label>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.primaryCta?.label || ''}
                    onChange={(e) => updateHeroCta('primaryCta', 'label', e.target.value)}
                    placeholder="Shop now"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Primary CTA link</label>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.primaryCta?.href || ''}
                    onChange={(e) => updateHeroCta('primaryCta', 'href', e.target.value)}
                    placeholder="/collections/new"
                  />
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Secondary CTA label</label>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.secondaryCta?.label || ''}
                    onChange={(e) => updateHeroCta('secondaryCta', 'label', e.target.value)}
                    placeholder="Contact us"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Secondary CTA link</label>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.secondaryCta?.href || ''}
                    onChange={(e) => updateHeroCta('secondaryCta', 'href', e.target.value)}
                    placeholder="mailto:support@example.com"
                  />
                </div>
              </div>
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.hero.backgroundImage || ''}
                onChange={(e) => updateHero('backgroundImage', e.target.value)}
                placeholder="Hero background image URL"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign carousel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" variant="outline" size="sm" onClick={addCarouselItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Add slide
              </Button>
              {content.carousel.length === 0 && (
                <p className="text-sm text-muted-foreground">No slides yet. Add your first campaign tile.</p>
              )}
              {content.carousel.map((item, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveCarousel(index, -1)} disabled={index === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveCarousel(index, 1)} disabled={index === content.carousel.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCarousel(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={item.title}
                    onChange={(e) => updateCarousel(index, 'title', e.target.value)}
                    placeholder="Slide title"
                  />
                  <textarea
                    className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2"
                    value={item.caption}
                    onChange={(e) => updateCarousel(index, 'caption', e.target.value)}
                    placeholder="Caption"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={item.imageUrl}
                    onChange={(e) => updateCarousel(index, 'imageUrl', e.target.value)}
                    placeholder="Image URL"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={item.href}
                    onChange={(e) => updateCarousel(index, 'href', e.target.value)}
                    placeholder="Destination link"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Accent colour</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {paletteOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setContent((prev) => ({ ...prev, palette: { ...prev.palette, accentColor: option.value } }))}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                      content.palette.accentColor === option.value ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full border" style={{ background: option.value }} />
                    {option.label}
                  </button>
                ))}
              </div>
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.palette.heroGradient}
                onChange={(e) => setContent((prev) => ({ ...prev, palette: { ...prev.palette, heroGradient: e.target.value } }))}
                placeholder="Hero gradient override (optional)"
              />
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.palette.backgroundStyle}
                onChange={(e) => setContent((prev) => ({ ...prev, palette: { ...prev.palette, backgroundStyle: e.target.value } }))}
                placeholder="Background style override (optional)"
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <PreviewPanel content={content} />
        </aside>
      </div>
    </div>
  )
}

function PreviewPanel({ content }) {
  const accent = content.palette.accentColor
  return (
    <Card className="border-primary/30 bg-card/90 shadow-xl">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="rounded-2xl p-6 text-card-foreground"
          style={{
            background: content.palette.heroGradient || `linear-gradient(135deg, ${accent}22, ${accent}11)`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-card-foreground/80">{content.hero.eyebrow}</p>
          <h3 className="text-lg font-semibold text-card-foreground">{content.hero.title}</h3>
          <p className="text-card-foreground/90">{content.hero.subtitle}</p>
        </div>
        {content.carousel.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Carousel</p>
            <div className="rounded-lg border bg-background/80 px-4 py-3 text-sm">
              <p className="font-semibold text-foreground">{content.carousel[0].title || 'Untitled slide'}</p>
              <p className="text-muted-foreground">{content.carousel[0].caption}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
