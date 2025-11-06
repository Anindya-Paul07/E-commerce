import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, UploadCloud, Link2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'
import { useTheme } from '@/context/ThemeContext'

const HOMEPAGE_BROADCAST_CHANNEL = 'cms-homepage'
const CUSTOM_LINK_VALUE = '__custom__'
const BASE_LINK_OPTIONS = [
  { value: '', label: 'No link' },
  { value: '/', label: 'Homepage' },
  { value: '/seller/apply', label: 'Seller application' },
  { value: '/seller/dashboard', label: 'Seller dashboard' },
  { value: '/cart', label: 'Cart' },
  { value: '/login', label: 'Sign in' },
  { value: '/register', label: 'Create account' },
]

function broadcastHomepageUpdate(data = {}) {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(HOMEPAGE_BROADCAST_CHANNEL)
    channel.postMessage({ type: 'homepage:update', ...data })
    channel.close()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Failed to broadcast homepage update', error)
    }
  }
}

const DEFAULT_CONTENT = {
  hero: {
    title: 'A flagship experience for modern multi-brand commerce',
    subtitle: 'Discover limited-run capsules, design-led essentials, and visionary labels powered by our curated seller collective.',
    eyebrow: 'Marketplace reimagined',
    ctaLabel: 'Browse featured drops',
    ctaHref: '/collections/featured',
    secondaryCta: { label: 'Become a marketplace seller', href: '/seller/apply' },
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
    items: [],
  },
  brandHighlights: {
    heading: {
      eyebrow: 'Partner studios',
      title: 'Brands shaping the platform',
      subtitle: '',
    },
    items: [],
  },
  testimonials: {
    heading: {
      eyebrow: 'Seller voices',
      title: 'Why creators choose our marketplace',
      subtitle: '',
    },
    items: [],
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
}

const CAROUSEL_TEMPLATE = { title: '', caption: '', imageUrl: '', href: '' }
const COUPON_TEMPLATE = { title: '', description: '', code: '', finePrint: '', imageUrl: '', href: '', expiresAt: '', enabled: true }
const CATEGORY_TEMPLATE = { name: '', description: '', href: '', badge: '', mediaUrl: '' }
const BRAND_TEMPLATE = { name: '', description: '', logoUrl: '', href: '' }
const TESTIMONIAL_TEMPLATE = { quote: '', name: '', role: '', avatarUrl: '' }

function hydrateHomepage(raw = {}) {
  return {
    ...DEFAULT_CONTENT,
    ...raw,
    hero: {
      ...DEFAULT_CONTENT.hero,
      ...(raw.hero || {}),
      secondaryCta: {
        ...(DEFAULT_CONTENT.hero.secondaryCta || {}),
        ...(raw.hero?.secondaryCta || {}),
      },
    },
    notification: { ...DEFAULT_CONTENT.notification, ...(raw.notification || {}) },
    categoryCapsules: {
      heading: { ...DEFAULT_CONTENT.categoryCapsules.heading, ...(raw.categoryCapsules?.heading || {}) },
      cta: { ...DEFAULT_CONTENT.categoryCapsules.cta, ...(raw.categoryCapsules?.cta || {}) },
      items: Array.isArray(raw.categoryCapsules?.items) ? raw.categoryCapsules.items : [],
    },
    brandHighlights: {
      heading: { ...DEFAULT_CONTENT.brandHighlights.heading, ...(raw.brandHighlights?.heading || {}) },
      items: Array.isArray(raw.brandHighlights?.items) ? raw.brandHighlights.items : [],
    },
    testimonials: {
      heading: { ...DEFAULT_CONTENT.testimonials.heading, ...(raw.testimonials?.heading || {}) },
      items: Array.isArray(raw.testimonials?.items) ? raw.testimonials.items : [],
    },
    sellerCta: { ...DEFAULT_CONTENT.sellerCta, ...(raw.sellerCta || {}) },
    carousel: Array.isArray(raw.carousel) ? raw.carousel : [],
    couponBlocks: Array.isArray(raw.couponBlocks) ? raw.couponBlocks : [],
    theme: { ...DEFAULT_CONTENT.theme, ...(raw.theme || {}) },
  }
}

export default function AdminStorefrontCMS() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [themes, setThemes] = useState([])
  const [activeTheme, setActiveTheme] = useState('daylight')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [linkOptions, setLinkOptions] = useState(() => [...BASE_LINK_OPTIONS, { value: CUSTOM_LINK_VALUE, label: 'Custom URL…' }])
  const { setActivePreset: setGlobalTheme } = useTheme()

  const uploadAsset = useCallback(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await api.postForm('/admin/uploads', formData)
      if (!response?.url) {
        throw new Error('Upload failed')
      }
      notify.success('Image uploaded')
      return response.url
    } catch (err) {
      notify.error(err?.message || 'Failed to upload image')
      throw err
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const categories = await api.get('/categories?limit=200').catch(() => ({ items: [] }))
        if (!active) return
        const dynamic = Array.isArray(categories?.items)
          ? categories.items
              .filter((category) => category?.slug && category?.name)
              .map((category) => ({
                value: `/category/${category.slug}`,
                label: `Category · ${category.name}`,
              }))
          : []
        setLinkOptions(() => {
          const dedupe = new Map()
          ;[...BASE_LINK_OPTIONS, ...dynamic].forEach((option) => {
            if (!option || typeof option.value === 'undefined') return
            if (!dedupe.has(option.value)) dedupe.set(option.value, option)
          })
          const merged = [...dedupe.values()]
          if (!merged.some((option) => option.value === CUSTOM_LINK_VALUE)) {
            merged.push({ value: CUSTOM_LINK_VALUE, label: 'Custom URL…' })
          }
          return merged
        })
      } catch (err) {
        if (!active) return
        setLinkOptions((prev) => {
          if (prev.some((option) => option.value === CUSTOM_LINK_VALUE)) return prev
          return [...prev, { value: CUSTOM_LINK_VALUE, label: 'Custom URL…' }]
        })
        notify.error(err?.message || 'Failed to fetch categories for link options')
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const [{ content: homepage }, themePayload] = await Promise.all([
          api.get('/admin/homepage'),
          api.get('/admin/themes'),
        ])
        if (!active) return
        setContent(hydrateHomepage(homepage))
        const presetList = Array.isArray(themePayload.presets) ? themePayload.presets : []
        setThemes(presetList)
        const nextActiveKey = themePayload.activePreset || homepage?.theme?.activePreset || 'daylight'
        setActiveTheme(nextActiveKey)
        setGlobalTheme(nextActiveKey, {
          presets: presetList,
          overrides: homepage?.theme?.overrides,
        })
      } catch (err) {
        if (!active) return
        setError(err.message || 'Failed to load storefront CMS data')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [setGlobalTheme])

  const heroPreviewStyle = useMemo(() => ({
    background: content.theme?.overrides?.['--hero-background'] || content.theme?.availablePresets?.find((preset) => preset.key === activeTheme)?.gradient || 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(14,165,233,0.18))',
  }), [content.theme, activeTheme])

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

  function updateNotification(field, value) {
    setContent((prev) => ({
      ...prev,
      notification: { ...prev.notification, [field]: value },
    }))
  }

  function toggleNotificationEnabled(value) {
    setContent((prev) => ({
      ...prev,
      notification: { ...prev.notification, enabled: value },
    }))
  }

  function updateSellerCta(field, value) {
    setContent((prev) => ({
      ...prev,
      sellerCta: { ...prev.sellerCta, [field]: value },
    }))
  }

  function updateSellerCtaLink(link, field, value) {
    setContent((prev) => ({
      ...prev,
      sellerCta: {
        ...prev.sellerCta,
        [link]: { ...(prev.sellerCta?.[link] || {}), [field]: value },
      },
    }))
  }

  function updateHeading(section, field, value) {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        heading: { ...(prev[section]?.heading || {}), [field]: value },
      },
    }))
  }

  function updateSectionCta(section, field, value) {
    setContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        cta: { ...(prev[section]?.cta || {}), [field]: value },
      },
    }))
  }

  function addItem(section, template) {
    setContent((prev) => {
      const current = Array.isArray(prev[section]) ? prev[section] : prev[section]?.items || []
      if (Array.isArray(prev[section])) {
        return { ...prev, [section]: [...current, { ...template }] }
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items: [...current, { ...template }],
        },
      }
    })
  }

  function updateItem(section, index, field, value, nestedPath = null) {
    setContent((prev) => {
      const current = Array.isArray(prev[section]) ? prev[section] : prev[section]?.items
      if (!current) return prev
      const next = current.map((item, i) => {
        if (i !== index) return item
        if (nestedPath) {
          const clone = { ...item }
          let ref = clone
          for (let j = 0; j < nestedPath.length - 1; j += 1) {
            const key = nestedPath[j]
            ref[key] = { ...(ref[key] || {}) }
            ref = ref[key]
          }
          ref[nestedPath[nestedPath.length - 1]] = value
          return clone
        }
        return { ...item, [field]: value }
      })

      if (Array.isArray(prev[section])) {
        return { ...prev, [section]: next }
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items: next,
        },
      }
    })
  }

  function removeItem(section, index) {
    setContent((prev) => {
      const current = Array.isArray(prev[section]) ? prev[section] : prev[section]?.items
      if (!current) return prev
      const filtered = current.filter((_, i) => i !== index)
      if (Array.isArray(prev[section])) {
        return { ...prev, [section]: filtered }
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items: filtered,
        },
      }
    })
  }

  function moveItem(section, index, direction) {
    setContent((prev) => {
      const current = Array.isArray(prev[section]) ? prev[section] : prev[section]?.items
      if (!current) return prev
      const target = index + direction
      if (target < 0 || target >= current.length) return prev
      const next = [...current]
      const [removed] = next.splice(index, 1)
      next.splice(target, 0, removed)
      if (Array.isArray(prev[section])) {
        return { ...prev, [section]: next }
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items: next,
        },
      }
    })
  }

  async function handleThemeChange(key) {
    try {
      setActiveTheme(key)
      setContent((prev) => ({
        ...prev,
        theme: { ...prev.theme, activePreset: key },
      }))
      setGlobalTheme(key, { presets: themes, overrides: content.theme?.overrides })
      await api.patch('/admin/themes/active', { key })
      notify.success('Active theme updated')
      broadcastHomepageUpdate({ reason: 'theme-change', key, timestamp: Date.now() })
    } catch (err) {
      notify.error(err.message || 'Failed to update theme')
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const { content: payload } = await api.put('/admin/homepage', content)
      setContent(hydrateHomepage(payload))
      setGlobalTheme(payload?.theme?.activePreset || content.theme?.activePreset || activeTheme, {
        presets: themes,
        overrides: payload?.theme?.overrides,
      })
      notify.success('Storefront CMS updated')
      broadcastHomepageUpdate({ reason: 'content-update', timestamp: Date.now() })
    } catch (err) {
      notify.error(err.message || 'Failed to save storefront CMS')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Storefront CMS</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading storefront content…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Storefront CMS</h1>
          <p className="text-sm text-muted-foreground">Curate the public homepage narrative and visual system.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector themes={themes} active={activeTheme} onChange={handleThemeChange} />
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.hero.eyebrow || ''}
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
                  <label className="text-sm font-medium text-muted-foreground">Primary CTA label</label>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.ctaLabel}
                    onChange={(e) => updateHero('ctaLabel', e.target.value)}
                    placeholder="Primary CTA label"
                  />
                </div>
                <LinkPicker
                  label="Primary CTA destination"
                  value={content.hero.ctaHref}
                  onChange={(href) => updateHero('ctaHref', href)}
                  options={linkOptions}
                />
              </div>
              <ImageUploadField
                label="Background image"
                value={content.hero.backgroundImage || ''}
                onChange={(url) => updateHero('backgroundImage', url)}
                onUpload={uploadAsset}
                placeholder="Background image URL"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Secondary CTA label</label>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.secondaryCta?.label || ''}
                    onChange={(e) => updateHeroCta('secondaryCta', 'label', e.target.value)}
                    placeholder="Secondary CTA label"
                  />
                </div>
                <LinkPicker
                  label="Secondary CTA destination"
                  value={content.hero.secondaryCta?.href || ''}
                  onChange={(href) => updateHeroCta('secondaryCta', 'href', href)}
                  options={linkOptions}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Announcement bar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Enable</label>
                <Button type="button" variant={content.notification.enabled ? 'default' : 'outline'} size="sm" onClick={() => toggleNotificationEnabled(!content.notification.enabled)}>
                  {content.notification.enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.notification.message}
                onChange={(e) => updateNotification('message', e.target.value)}
                placeholder="Message"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.notification.type}
                  onChange={(e) => updateNotification('type', e.target.value)}
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.notification.ctaLabel}
                  onChange={(e) => updateNotification('ctaLabel', e.target.value)}
                  placeholder="CTA label"
                />
              </div>
              <LinkPicker
                label="CTA destination"
                value={content.notification.ctaHref}
                onChange={(href) => updateNotification('ctaHref', href)}
                options={linkOptions}
              />
            </CardContent>
          </Card>

          <EditableCollection
            title="Hero carousel"
            description="Surface current campaigns with rich imagery."
            items={content.carousel}
            onAdd={() => addItem('carousel', { ...CAROUSEL_TEMPLATE })}
            renderItem={(item, index) => (
              <div className="space-y-3" key={index}>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={item.title}
                  onChange={(e) => updateItem('carousel', index, 'title', e.target.value)}
                  placeholder="Slide title"
                />
                <textarea
                  className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2"
                  value={item.caption}
                  onChange={(e) => updateItem('carousel', index, 'caption', e.target.value)}
                  placeholder="Caption"
                />
                <ImageUploadField
                  label="Slide image"
                  value={item.imageUrl}
                  onChange={(url) => updateItem('carousel', index, 'imageUrl', url)}
                  onUpload={uploadAsset}
                  placeholder="Image URL"
                />
                <LinkPicker
                  label="Slide destination"
                  value={item.href}
                  onChange={(href) => updateItem('carousel', index, 'href', href)}
                  options={linkOptions}
                />
              </div>
            )}
            onRemove={(index) => removeItem('carousel', index)}
            onMove={(index, direction) => moveItem('carousel', index, direction)}
          />

          <EditableCollection
            title="Spotlight coupons"
            description="Offer incentives or one-time drops with expiry dates."
            items={content.couponBlocks}
            onAdd={() => addItem('couponBlocks', { ...COUPON_TEMPLATE })}
            renderItem={(block, index) => (
              <div className="space-y-3" key={index}>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={block.title}
                  onChange={(e) => updateItem('couponBlocks', index, 'title', e.target.value)}
                  placeholder="Title"
                />
                <textarea
                  className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2"
                  value={block.description}
                  onChange={(e) => updateItem('couponBlocks', index, 'description', e.target.value)}
                  placeholder="Description"
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={block.code}
                    onChange={(e) => updateItem('couponBlocks', index, 'code', e.target.value)}
                    placeholder="Code"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={block.expiresAt || ''}
                    onChange={(e) => updateItem('couponBlocks', index, 'expiresAt', e.target.value)}
                    placeholder="Expires at"
                  />
                </div>
                <ImageUploadField
                  label="Image"
                  value={block.imageUrl}
                  onChange={(url) => updateItem('couponBlocks', index, 'imageUrl', url)}
                  onUpload={uploadAsset}
                  placeholder="Image URL"
                />
                <LinkPicker
                  label="Link destination"
                  value={block.href}
                  onChange={(href) => updateItem('couponBlocks', index, 'href', href)}
                  options={linkOptions}
                />
              </div>
            )}
            onRemove={(index) => removeItem('couponBlocks', index)}
            onMove={(index, direction) => moveItem('couponBlocks', index, direction)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Category capsules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.categoryCapsules.heading.eyebrow}
                  onChange={(e) => updateHeading('categoryCapsules', 'eyebrow', e.target.value)}
                  placeholder="Eyebrow"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.categoryCapsules.heading.title}
                  onChange={(e) => updateHeading('categoryCapsules', 'title', e.target.value)}
                  placeholder="Title"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.categoryCapsules.heading.subtitle}
                  onChange={(e) => updateHeading('categoryCapsules', 'subtitle', e.target.value)}
                  placeholder="Subtitle"
                />
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.categoryCapsules.cta?.label || ''}
                  onChange={(e) => updateSectionCta('categoryCapsules', 'label', e.target.value)}
                  placeholder="CTA label"
                />
                <LinkPicker
                  label="CTA destination"
                  value={content.categoryCapsules.cta?.href || ''}
                  onChange={(href) => updateSectionCta('categoryCapsules', 'href', href)}
                  options={linkOptions}
                />
                </div>
              </div>

              <EditableCollection
                title="Category tiles"
                description="Curated narratives or collections."
                items={content.categoryCapsules.items}
                onAdd={() => addItem('categoryCapsules', { ...CATEGORY_TEMPLATE })}
                renderItem={(item, index) => (
                  <div className="space-y-3" key={index}>
                    <input
                      className="h-9 w-full rounded-md border bg-background px-3"
                      value={item.name}
                      onChange={(e) => updateItem('categoryCapsules', index, 'name', e.target.value)}
                      placeholder="Name"
                    />
                    <textarea
                      className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2"
                      value={item.description}
                      onChange={(e) => updateItem('categoryCapsules', index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3"
                        value={item.badge}
                        onChange={(e) => updateItem('categoryCapsules', index, 'badge', e.target.value)}
                        placeholder="Badge"
                      />
                      <LinkPicker
                        label="Link destination"
                        value={item.href}
                        onChange={(href) => updateItem('categoryCapsules', index, 'href', href)}
                        options={linkOptions}
                      />
                    </div>
                    <ImageUploadField
                      label="Tile image"
                      value={item.mediaUrl}
                      onChange={(url) => updateItem('categoryCapsules', index, 'mediaUrl', url)}
                      onUpload={uploadAsset}
                      placeholder="Image URL"
                    />
                  </div>
                )}
                onRemove={(index) => removeItem('categoryCapsules', index)}
                onMove={(index, direction) => moveItem('categoryCapsules', index, direction)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partnered brands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.brandHighlights.heading.eyebrow}
                  onChange={(e) => updateHeading('brandHighlights', 'eyebrow', e.target.value)}
                  placeholder="Eyebrow"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.brandHighlights.heading.title}
                  onChange={(e) => updateHeading('brandHighlights', 'title', e.target.value)}
                  placeholder="Title"
                />
              </div>
              <EditableCollection
                title="Brand highlights"
                description="Spotlight featured partners."
                items={content.brandHighlights.items}
                onAdd={() => addItem('brandHighlights', { ...BRAND_TEMPLATE })}
                renderItem={(brand, index) => (
                  <div className="space-y-3" key={index}>
                    <input
                      className="h-9 w-full rounded-md border bg-background px-3"
                      value={brand.name}
                      onChange={(e) => updateItem('brandHighlights', index, 'name', e.target.value)}
                      placeholder="Brand name"
                    />
                    <textarea
                      className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2"
                      value={brand.description}
                      onChange={(e) => updateItem('brandHighlights', index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                    <ImageUploadField
                      label="Logo"
                      value={brand.logoUrl}
                      onChange={(url) => updateItem('brandHighlights', index, 'logoUrl', url)}
                      onUpload={uploadAsset}
                      placeholder="Logo URL"
                    />
                    <LinkPicker
                      label="Destination"
                      value={brand.href}
                      onChange={(href) => updateItem('brandHighlights', index, 'href', href)}
                      options={linkOptions}
                    />
                  </div>
                )}
                onRemove={(index) => removeItem('brandHighlights', index)}
                onMove={(index, direction) => moveItem('brandHighlights', index, direction)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testimonials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.testimonials.heading.eyebrow}
                  onChange={(e) => updateHeading('testimonials', 'eyebrow', e.target.value)}
                  placeholder="Eyebrow"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.testimonials.heading.title}
                  onChange={(e) => updateHeading('testimonials', 'title', e.target.value)}
                  placeholder="Title"
                />
              </div>
              <EditableCollection
                title="Quotes"
                description="Give voice to existing sellers."
                items={content.testimonials.items}
                onAdd={() => addItem('testimonials', { ...TESTIMONIAL_TEMPLATE })}
                renderItem={(item, index) => (
                  <div className="space-y-3" key={index}>
                    <textarea
                      className="min-h-[60px] w-full rounded-md border bg-background px-3 py-2"
                      value={item.quote}
                      onChange={(e) => updateItem('testimonials', index, 'quote', e.target.value)}
                      placeholder="Quote"
                    />
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3"
                        value={item.name}
                        onChange={(e) => updateItem('testimonials', index, 'name', e.target.value)}
                        placeholder="Name"
                      />
                      <input
                        className="h-9 w-full rounded-md border bg-background px-3"
                        value={item.role}
                        onChange={(e) => updateItem('testimonials', index, 'role', e.target.value)}
                        placeholder="Role"
                      />
                    </div>
                    <input
                      className="h-9 w-full rounded-md border bg-background px-3"
                      value={item.avatarUrl}
                      onChange={(e) => updateItem('testimonials', index, 'avatarUrl', e.target.value)}
                      placeholder="Avatar URL"
                    />
                  </div>
                )}
                onRemove={(index) => removeItem('testimonials', index)}
                onMove={(index, direction) => moveItem('testimonials', index, direction)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seller CTA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.sellerCta.heading}
                onChange={(e) => updateSellerCta('heading', e.target.value)}
                placeholder="Heading"
              />
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2"
                value={content.sellerCta.body}
                onChange={(e) => updateSellerCta('body', e.target.value)}
                placeholder="Body copy"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.sellerCta.primaryCta?.label || ''}
                  onChange={(e) => updateSellerCtaLink('primaryCta', 'label', e.target.value)}
                  placeholder="Primary CTA"
                />
                <LinkPicker
                  label="Primary destination"
                  value={content.sellerCta.primaryCta?.href || ''}
                  onChange={(href) => updateSellerCtaLink('primaryCta', 'href', href)}
                  options={linkOptions}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.sellerCta.secondaryCta?.label || ''}
                  onChange={(e) => updateSellerCtaLink('secondaryCta', 'label', e.target.value)}
                  placeholder="Secondary CTA"
                />
                <LinkPicker
                  label="Secondary destination"
                  value={content.sellerCta.secondaryCta?.href || ''}
                  onChange={(href) => updateSellerCtaLink('secondaryCta', 'href', href)}
                  options={linkOptions}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <StorefrontPreview hero={content.hero} carousel={content.carousel} categories={content.categoryCapsules.items} brandHighlights={content.brandHighlights.items} sellerCta={content.sellerCta} heroStyle={heroPreviewStyle} />
        </aside>
      </div>
    </div>
  )
}

function ThemeSelector({ themes, active, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Theme</label>
      <select
        className="h-9 rounded-md border bg-background px-3"
        value={active}
        onChange={(e) => onChange(e.target.value)}
      >
        {themes.length > 0 ? (
          themes.map((preset) => (
            <option key={preset.key} value={preset.key}>
              {preset.label} · {preset.palette.mode === 'day' ? 'Day' : 'Night'}
            </option>
          ))
        ) : (
          <option value={active}>{active}</option>
        )}
      </select>
    </div>
  )
}

function ImageUploadField({ label, value, onChange, onUpload, placeholder = 'Image URL', className }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file || !onUpload) return
    try {
      setUploading(true)
      const url = await onUpload(file)
      if (url) onChange?.(url)
    } catch (error) {
      // upload handler surfaces notifications
    } finally {
      setUploading(false)
      if (event.target) event.target.value = ''
    }
  }

  const containerClass = ['space-y-1', className].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground" htmlFor={label.replace(/\s+/g, '-').toLowerCase()}>
          {label}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={label ? label.replace(/\s+/g, '-').toLowerCase() : undefined}
          className="h-9 flex-1 rounded-md border bg-background px-3"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !onUpload}
        >
          <UploadCloud className="mr-1 h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange?.('')} disabled={uploading}>
            Clear
          </Button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {value && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{value}</span>
          <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Preview
          </a>
        </div>
      )}
    </div>
  )
}

function LinkPicker({ label, value, onChange, options = BASE_LINK_OPTIONS, className }) {
  const optionsWithCustom = useMemo(() => {
    const base = options && options.length ? options : BASE_LINK_OPTIONS
    return base.some((option) => option.value === CUSTOM_LINK_VALUE)
      ? base
      : [...base, { value: CUSTOM_LINK_VALUE, label: 'Custom URL…' }]
  }, [options])

  const isCustom = Boolean(value) && !optionsWithCustom.some((option) => option.value === value)
  const [customValue, setCustomValue] = useState(() => (isCustom ? value : ''))
  const [selectValue, setSelectValue] = useState(() => (isCustom ? CUSTOM_LINK_VALUE : value || ''))
  const inputRef = useRef(null)

  useEffect(() => {
    const custom = Boolean(value) && !optionsWithCustom.some((option) => option.value === value)
    setSelectValue(custom ? CUSTOM_LINK_VALUE : value || '')
    setCustomValue(custom ? value || '' : '')
  }, [value, optionsWithCustom])

  const handleSelectChange = (event) => {
    const next = event.target.value
    setSelectValue(next)
    if (next === CUSTOM_LINK_VALUE) {
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      onChange?.(next)
    }
  }

  const handleCustomChange = (event) => {
    const next = event.target.value
    setCustomValue(next)
    onChange?.(next)
  }

  const containerClass = ['space-y-1', className].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {label && (
        <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <Link2 className="h-4 w-4" />
          {label}
        </label>
      )}
      <select
        className="h-9 w-full rounded-md border bg-background px-3"
        value={selectValue}
        onChange={handleSelectChange}
      >
        {optionsWithCustom.map((option) => (
          <option key={option.value || 'none'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selectValue === CUSTOM_LINK_VALUE && (
        <input
          ref={inputRef}
          className="h-9 w-full rounded-md border bg-background px-3"
          value={customValue}
          onChange={handleCustomChange}
          placeholder="https://example.com or /path"
        />
      )}
    </div>
  )
}

function EditableCollection({ title, description, items, onAdd, renderItem, onRemove, onMove }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="flex items-center justify-end gap-2 pb-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, 1)} disabled={index === items.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {renderItem(item, index)}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StorefrontPreview({ hero, carousel, categories, brandHighlights, sellerCta, heroStyle }) {
  return (
    <Card className="border-primary/20 bg-card/95 shadow-lg">
      <CardHeader>
        <CardTitle>Homepage preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="space-y-2 rounded-2xl p-5 text-card-foreground" style={heroStyle}>
          <p className="text-[11px] uppercase tracking-[0.3em] text-card-foreground/80">{hero.eyebrow}</p>
          <h3 className="text-lg font-semibold text-card-foreground">{hero.title}</h3>
          <p className="text-card-foreground/90">{hero.subtitle}</p>
        </div>

        {carousel.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Carousel</p>
            <div className="rounded-lg border bg-background/70 px-4 py-3">
              <p className="text-sm font-semibold">{carousel[0].title || 'Untitled slide'}</p>
              <p className="text-xs text-muted-foreground">{carousel[0].caption}</p>
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Categories</p>
            <div className="grid gap-2">
              {categories.slice(0, 2).map((item, index) => (
                <div key={index} className="rounded-lg border bg-background/70 px-3 py-2">
                  <p className="text-sm font-medium">{item.name || 'Untitled story'}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {brandHighlights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Partner brands</p>
            <div className="rounded-lg border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              {brandHighlights[0].name || 'Brand name'} — {brandHighlights[0].description}
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-lg border bg-background/70 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Seller CTA</p>
          <h4 className="text-sm font-semibold text-foreground">{sellerCta.heading}</h4>
          <p className="text-xs text-muted-foreground">{sellerCta.body}</p>
        </div>
      </CardContent>
    </Card>
  )
}
