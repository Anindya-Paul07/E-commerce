import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { buildFormData } from '@/lib/form-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'

const EMPTY_SELLER = {
  displayName: '',
  legalName: '',
}

const EMPTY_SHOP = {
  name: '',
  tagLine: '',
  description: '',
  status: 'draft',
  logoUrl: '',
  coverImageUrl: '',
  hero: {
    type: 'image',
    url: '',
    headline: '',
    subheadline: '',
    ctaLabel: '',
    ctaHref: '',
  },
}

function normalizeShop(raw = {}) {
  const hero = raw.hero || {}
  return {
    name: raw.name || '',
    tagLine: raw.tagLine || '',
    description: raw.description || '',
    status: raw.status || 'draft',
    logoUrl: raw.logoUrl || '',
    coverImageUrl: raw.coverImageUrl || '',
    hero: {
      type: hero.type || 'image',
      url: hero.url || '',
      headline: hero.headline || '',
      subheadline: hero.subheadline || '',
      ctaLabel: hero.ctaLabel || '',
      ctaHref: hero.ctaHref || '',
    },
  }
}

export default function AdminShopPage() {
  const [seller, setSeller] = useState(EMPTY_SELLER)
  const [shop, setShop] = useState(EMPTY_SHOP)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [heroFile, setHeroFile] = useState(null)
  const [logoInputKey, setLogoInputKey] = useState(0)
  const [coverInputKey, setCoverInputKey] = useState(0)
  const [heroInputKey, setHeroInputKey] = useState(0)

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.get('/sellers/me')
        if (data?.seller) {
          setSeller({
            displayName: data.seller.displayName || '',
            legalName: data.seller.legalName || '',
          })
        }
        if (data?.shop) {
          setShop(normalizeShop(data.shop))
        }
      } catch (err) {
        setError(err.message || 'Failed to load seller profile')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const heroTypeOptions = useMemo(() => (
    [
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
    ]
  ), [])

  function setSellerField(field, value) {
    setSeller(prev => ({ ...prev, [field]: value }))
  }

  function setShopField(field, value) {
    setShop(prev => ({ ...prev, [field]: value }))
  }

  function setHeroField(field, value) {
    setShop(prev => ({ ...prev, hero: { ...(prev.hero || {}), [field]: value } }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!seller.displayName.trim()) throw new Error('Display name is required')
      if (!shop.name.trim()) throw new Error('Shop name is required')

      const payload = {
        displayName: seller.displayName,
        legalName: seller.legalName,
        shop: JSON.stringify({
          name: shop.name,
          tagLine: shop.tagLine,
          description: shop.description,
          status: shop.status,
          logoUrl: shop.logoUrl,
          coverImageUrl: shop.coverImageUrl,
          hero: shop.hero,
        }),
      }

      const files = {
        shopLogo: logoFile || undefined,
        shopCover: coverFile || undefined,
        shopHero: heroFile || undefined,
      }

      const formData = buildFormData(payload, files)
      const data = await api.putForm('/sellers/me', formData)
      if (data?.seller) {
        setSeller({
          displayName: data.seller.displayName || '',
          legalName: data.seller.legalName || '',
        })
      }
      if (data?.shop) {
        setShop(normalizeShop(data.shop))
      }
      setLogoFile(null); setCoverFile(null); setHeroFile(null)
      setLogoInputKey(k => k + 1)
      setCoverInputKey(k => k + 1)
      setHeroInputKey(k => k + 1)
      notify.success('Shop settings saved')
    } catch (err) {
      const message = err.message || 'Save failed'
      setError(message)
      notify.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Shop CMS</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop CMS</CardTitle>
          <p className="text-sm text-muted-foreground">Manage the storefront hero, branding and messaging for your seller shop.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} encType="multipart/form-data" className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
              <input
                className="h-10 rounded-md border bg-background px-3"
                value={seller.displayName}
                onChange={(e) => setSellerField('displayName', e.target.value)}
                placeholder="Seller display name"
                required
              />
              <input
                className="h-10 rounded-md border bg-background px-3"
                value={seller.legalName}
                onChange={(e) => setSellerField('legalName', e.target.value)}
                placeholder="Legal business name"
              />
            </div>

            <input
              className="h-10 rounded-md border bg-background px-3"
              value={shop.name}
              onChange={(e) => setShopField('name', e.target.value)}
              placeholder="Shop name"
              required
            />
            <input
              className="h-10 rounded-md border bg-background px-3"
              value={shop.tagLine}
              onChange={(e) => setShopField('tagLine', e.target.value)}
              placeholder="Shop tagline"
            />

            <textarea
              className="min-h-[80px] rounded-md border bg-background px-3 py-2 lg:col-span-2"
              value={shop.description}
              onChange={(e) => setShopField('description', e.target.value)}
              placeholder="Shop description"
            />

            <select
              className="h-10 rounded-md border bg-background px-3"
              value={shop.status}
              onChange={(e) => setShopField('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="hidden">Hidden</option>
            </select>

            <div className="flex flex-col gap-2 text-sm">
              <label className="font-medium">Logo URL</label>
              <input
                className="h-10 rounded-md border bg-background px-3"
                value={shop.logoUrl}
                onChange={(e) => setShopField('logoUrl', e.target.value)}
                placeholder="https://cdn.yourbrand.com/logo.png"
              />
              <input
                key={logoInputKey}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  setLogoFile(file)
                }}
                className="text-xs"
              />
              {logoFile && <span className="text-xs text-muted-foreground">Selected: {logoFile.name}</span>}
            </div>

            <div className="flex flex-col gap-2 text-sm">
              <label className="font-medium">Cover image URL</label>
              <input
                className="h-10 rounded-md border bg-background px-3"
                value={shop.coverImageUrl}
                onChange={(e) => setShopField('coverImageUrl', e.target.value)}
                placeholder="https://cdn.yourbrand.com/cover.jpg"
              />
              <input
                key={coverInputKey}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null
                  setCoverFile(file)
                }}
                className="text-xs"
              />
              {coverFile && <span className="text-xs text-muted-foreground">Selected: {coverFile.name}</span>}
            </div>

            <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2 text-sm">
                <label className="font-medium">Hero asset</label>
                <select
                  className="h-10 rounded-md border bg-background px-3"
                  value={shop.hero.type}
                  onChange={(e) => setHeroField('type', e.target.value)}
                >
                  {heroTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  value={shop.hero.url}
                  onChange={(e) => setHeroField('url', e.target.value)}
                  placeholder="https://cdn.yourbrand.com/hero.jpg"
                />
                <input
                  key={heroInputKey}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null
                    setHeroFile(file)
                  }}
                  className="text-xs"
                />
                {heroFile && <span className="text-xs text-muted-foreground">Selected: {heroFile.name}</span>}
              </div>

              <div className="grid gap-2 text-sm">
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  value={shop.hero.headline}
                  onChange={(e) => setHeroField('headline', e.target.value)}
                  placeholder="Hero headline"
                />
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  value={shop.hero.subheadline}
                  onChange={(e) => setHeroField('subheadline', e.target.value)}
                  placeholder="Hero subheadline"
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="h-10 rounded-md border bg-background px-3"
                    value={shop.hero.ctaLabel}
                    onChange={(e) => setHeroField('ctaLabel', e.target.value)}
                    placeholder="CTA label"
                  />
                  <input
                    className="h-10 rounded-md border bg-background px-3"
                    value={shop.hero.ctaHref}
                    onChange={(e) => setHeroField('ctaHref', e.target.value)}
                    placeholder="CTA link"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex gap-2">
              <Button disabled={saving}>{saving ? 'Saving…' : 'Save shop content'}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLogoFile(null); setCoverFile(null); setHeroFile(null)
                  setLogoInputKey(k => k + 1)
                  setCoverInputKey(k => k + 1)
                  setHeroInputKey(k => k + 1)
                }}
              >
                Reset uploads
              </Button>
            </div>

            {error && <p className="lg:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
