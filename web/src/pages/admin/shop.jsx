import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notify } from '@/lib/notify'

const EMPTY_CONTENT = {
  hero: {
    eyebrow: 'Seller collective',
    title: 'Launch your flagship inside a multi-brand icon',
    subtitle: 'Partner with a concierge marketplace curated for design-led boutiques.',
    backgroundImage: '',
    primaryCta: { label: 'Start application', href: '/seller/apply' },
    secondaryCta: { label: 'Review requirements', href: '/seller/guidelines' },
  },
  pillars: [],
  callouts: [],
  testimonials: [],
  faqs: [],
  contact: {
    headline: 'Need help with your application?',
    body: 'Our merchant success team is here to support you with onboarding, product setup, and fulfilment guidance.',
    email: 'onboard@flux-commerce.test',
    phone: '+1 555 010 2025',
    cta: { label: 'Contact merchant team', href: 'mailto:onboard@flux-commerce.test' },
  },
  theme: {
    heroGradient: 'linear-gradient(135deg, rgba(250,250,250,0.75), rgba(176,208,255,0.35))',
    accentColor: '#6366f1',
    backgroundStyle: 'radial-gradient(circle at top, rgba(99,102,241,0.12), transparent 55%)',
  },
}

const PILLAR_TEMPLATE = { title: '', description: '', icon: '' }
const CALLOUT_TEMPLATE = { title: '', body: '', mediaUrl: '', cta: { label: '', href: '' } }
const TESTIMONIAL_TEMPLATE = { quote: '', name: '', role: '', avatarUrl: '' }
const FAQ_TEMPLATE = { question: '', answer: '' }

function hydrateContent(raw = {}) {
  return {
    hero: { ...EMPTY_CONTENT.hero, ...(raw.hero || {}) },
    pillars: Array.isArray(raw.pillars) ? raw.pillars : [],
    callouts: Array.isArray(raw.callouts) ? raw.callouts : [],
    testimonials: Array.isArray(raw.testimonials) ? raw.testimonials : [],
    faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
    contact: { ...EMPTY_CONTENT.contact, ...(raw.contact || {}) },
    theme: { ...EMPTY_CONTENT.theme, ...(raw.theme || {}) },
  }
}

export default function AdminShopPage() {
  const [content, setContent] = useState(EMPTY_CONTENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const { content: payload } = await api.get('/admin/seller-page')
        if (!active) return
        setContent(hydrateContent(payload))
      } catch (err) {
        if (!active) return
        setError(err.message || 'Failed to load seller CMS content')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const hasChanges = useMemo(() => !loading, [loading])

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

  function updateTheme(field, value) {
    setContent((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }))
  }

  function addItem(section, template) {
    setContent((prev) => ({
      ...prev,
      [section]: [...(prev[section] || []), template],
    }))
  }

  function updateItem(section, index, field, value) {
    setContent((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  function updateNestedItem(section, index, fields, value) {
    setContent((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) => {
        if (i !== index) return item
        let next = { ...item }
        let ref = next
        for (let j = 0; j < fields.length - 1; j += 1) {
          const key = fields[j]
          ref[key] = { ...(ref[key] || {}) }
          ref = ref[key]
        }
        ref[fields[fields.length - 1]] = value
        return next
      }),
    }))
  }

  function removeItem(section, index) {
    setContent((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }))
  }

  function moveItem(section, index, direction) {
    setContent((prev) => {
      const items = [...prev[section]]
      const target = index + direction
      if (target < 0 || target >= items.length) return prev
      const [removed] = items.splice(index, 1)
      items.splice(target, 0, removed)
      return { ...prev, [section]: items }
    })
  }

  function updateContact(field, value) {
    setContent((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }))
  }

  function updateContactCta(field, value) {
    setContent((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        cta: { ...(prev.contact?.cta || {}), [field]: value },
      },
    }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      const { content: payload } = await api.put('/admin/seller-page', content)
      setContent(hydrateContent(payload))
      notify.success('Seller CMS updated')
    } catch (err) {
      notify.error(err.message || 'Failed to save seller CMS')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Seller CMS</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading seller experience…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Seller CMS</h1>
          <p className="text-sm text-muted-foreground">Design the seller marketing experience with live preview and structured blocks.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
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
                value={content.hero.eyebrow}
                onChange={(e) => updateHero('eyebrow', e.target.value)}
                placeholder="Eyebrow"
              />
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-lg font-semibold"
                value={content.hero.title}
                onChange={(e) => updateHero('title', e.target.value)}
                placeholder="Hero headline"
              />
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2"
                value={content.hero.subtitle}
                onChange={(e) => updateHero('subtitle', e.target.value)}
                placeholder="Hero subheading"
              />
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.hero.backgroundImage}
                onChange={(e) => updateHero('backgroundImage', e.target.value)}
                placeholder="Background image URL"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Primary CTA</p>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.primaryCta.label}
                    onChange={(e) => updateHeroCta('primaryCta', 'label', e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.primaryCta.href}
                    onChange={(e) => updateHeroCta('primaryCta', 'href', e.target.value)}
                    placeholder="/seller/apply"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Secondary CTA</p>
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.secondaryCta.label}
                    onChange={(e) => updateHeroCta('secondaryCta', 'label', e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={content.hero.secondaryCta.href}
                    onChange={(e) => updateHeroCta('secondaryCta', 'href', e.target.value)}
                    placeholder="/seller/guidelines"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <EditableCollection
            title="Value pillars"
            description="Communicate what differentiates your marketplace offering."
            items={content.pillars}
            onAdd={() => addItem('pillars', { ...PILLAR_TEMPLATE })}
            renderItem={(pillar, index) => (
              <div className="space-y-3" key={index}>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={pillar.title}
                  onChange={(e) => updateItem('pillars', index, 'title', e.target.value)}
                  placeholder="Pillar title"
                />
                <textarea
                  className="min-h-[70px] w-full rounded-md border bg-background px-3 py-2"
                  value={pillar.description}
                  onChange={(e) => updateItem('pillars', index, 'description', e.target.value)}
                  placeholder="Short description"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={pillar.icon}
                  onChange={(e) => updateItem('pillars', index, 'icon', e.target.value)}
                  placeholder="Icon token (optional)"
                />
              </div>
            )}
            onRemove={(index) => removeItem('pillars', index)}
            onMove={(index, direction) => moveItem('pillars', index, direction)}
          />

          <EditableCollection
            title="Deep-dive callouts"
            description="Highlight concierge programs, logistics, or editorial support."
            items={content.callouts}
            onAdd={() => addItem('callouts', { ...CALLOUT_TEMPLATE })}
            renderItem={(callout, index) => (
              <div className="space-y-3" key={index}>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={callout.title}
                  onChange={(e) => updateItem('callouts', index, 'title', e.target.value)}
                  placeholder="Callout title"
                />
                <textarea
                  className="min-h-[70px] w-full rounded-md border bg-background px-3 py-2"
                  value={callout.body}
                  onChange={(e) => updateItem('callouts', index, 'body', e.target.value)}
                  placeholder="Details"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={callout.mediaUrl}
                  onChange={(e) => updateItem('callouts', index, 'mediaUrl', e.target.value)}
                  placeholder="Media URL"
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={callout.cta?.label || ''}
                    onChange={(e) => updateNestedItem('callouts', index, ['cta', 'label'], e.target.value)}
                    placeholder="CTA label"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={callout.cta?.href || ''}
                    onChange={(e) => updateNestedItem('callouts', index, ['cta', 'href'], e.target.value)}
                    placeholder="CTA href"
                  />
                </div>
              </div>
            )}
            onRemove={(index) => removeItem('callouts', index)}
            onMove={(index, direction) => moveItem('callouts', index, direction)}
          />

          <EditableCollection
            title="Seller testimonials"
            description="Build trust by sharing quotes from existing marketplace partners."
            items={content.testimonials}
            onAdd={() => addItem('testimonials', { ...TESTIMONIAL_TEMPLATE })}
            renderItem={(testimonial, index) => (
              <div className="space-y-3" key={index}>
                <textarea
                  className="min-h-[70px] w-full rounded-md border bg-background px-3 py-2"
                  value={testimonial.quote}
                  onChange={(e) => updateItem('testimonials', index, 'quote', e.target.value)}
                  placeholder="Quote"
                />
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={testimonial.name}
                    onChange={(e) => updateItem('testimonials', index, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <input
                    className="h-9 w-full rounded-md border bg-background px-3"
                    value={testimonial.role}
                    onChange={(e) => updateItem('testimonials', index, 'role', e.target.value)}
                    placeholder="Role"
                  />
                </div>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={testimonial.avatarUrl}
                  onChange={(e) => updateItem('testimonials', index, 'avatarUrl', e.target.value)}
                  placeholder="Avatar URL (optional)"
                />
              </div>
            )}
            onRemove={(index) => removeItem('testimonials', index)}
            onMove={(index, direction) => moveItem('testimonials', index, direction)}
          />

          <EditableCollection
            title="FAQs"
            description="Answer the most common seller questions to streamline onboarding."
            items={content.faqs}
            onAdd={() => addItem('faqs', { ...FAQ_TEMPLATE })}
            renderItem={(faq, index) => (
              <div className="space-y-3" key={index}>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={faq.question}
                  onChange={(e) => updateItem('faqs', index, 'question', e.target.value)}
                  placeholder="Question"
                />
                <textarea
                  className="min-h-[70px] w-full rounded-md border bg-background px-3 py-2"
                  value={faq.answer}
                  onChange={(e) => updateItem('faqs', index, 'answer', e.target.value)}
                  placeholder="Answer"
                />
              </div>
            )}
            onRemove={(index) => removeItem('faqs', index)}
            onMove={(index, direction) => moveItem('faqs', index, direction)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Contact block</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.contact.headline}
                onChange={(e) => updateContact('headline', e.target.value)}
                placeholder="Headline"
              />
              <textarea
                className="min-h-[70px] w-full rounded-md border bg-background px-3 py-2"
                value={content.contact.body}
                onChange={(e) => updateContact('body', e.target.value)}
                placeholder="Support copy"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.contact.email}
                  onChange={(e) => updateContact('email', e.target.value)}
                  placeholder="Team email"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.contact.phone}
                  onChange={(e) => updateContact('phone', e.target.value)}
                  placeholder="Phone"
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.contact.cta?.label || ''}
                  onChange={(e) => updateContactCta('label', e.target.value)}
                  placeholder="CTA label"
                />
                <input
                  className="h-9 w-full rounded-md border bg-background px-3"
                  value={content.contact.cta?.href || ''}
                  onChange={(e) => updateContactCta('href', e.target.value)}
                  placeholder="CTA href"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.theme.heroGradient}
                onChange={(e) => updateTheme('heroGradient', e.target.value)}
                placeholder="Hero gradient"
              />
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.theme.accentColor}
                onChange={(e) => updateTheme('accentColor', e.target.value)}
                placeholder="#6366f1"
              />
              <input
                className="h-9 w-full rounded-md border bg-background px-3"
                value={content.theme.backgroundStyle}
                onChange={(e) => updateTheme('backgroundStyle', e.target.value)}
                placeholder="Background style"
              />
            </CardContent>
          </Card>

          <SellerPreview content={content} />
        </aside>
      </div>
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
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border p-4">
            <div className="flex items-center justify-end gap-2 pb-3">
              <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onMove(index, 1)}
                disabled={index === items.length - 1}
              >
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

function SellerPreview({ content }) {
  const { hero, pillars, callouts, testimonials, theme } = content
  return (
    <Card className="border-primary/20 bg-card/90 shadow-lg">
      <CardHeader>
        <CardTitle>Live preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div
          className="space-y-3 rounded-2xl p-5 text-card-foreground"
          style={{
            background: theme.heroGradient || 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.15))',
            color: theme.accentColor || '#6366f1',
          }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-card-foreground/80">{hero.eyebrow}</p>
          <h3 className="text-lg font-semibold text-card-foreground">{hero.title}</h3>
          <p className="text-card-foreground/90">{hero.subtitle}</p>
        </div>

        {pillars.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">Pillars</p>
            <ul className="space-y-2">
              {pillars.map((pillar, index) => (
                <li key={index} className="rounded-md border bg-background/60 px-3 py-2">
                  <p className="text-sm font-medium">{pillar.title || 'Untitled pillar'}</p>
                  <p className="text-xs text-muted-foreground">{pillar.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {callouts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Callouts</p>
            {callouts.slice(0, 2).map((callout, index) => (
              <div key={index} className="rounded-lg border bg-background/70 px-4 py-3">
                <p className="text-sm font-semibold">{callout.title || 'Untitled block'}</p>
                <p className="text-xs text-muted-foreground">{callout.body}</p>
              </div>
            ))}
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Testimonials</p>
            <blockquote className="rounded-lg border bg-background/70 px-4 py-3 text-xs text-muted-foreground">
              “{testimonials[0].quote}”
              <footer className="mt-2 text-[11px] text-muted-foreground/80">
                {testimonials[0].name} · {testimonials[0].role}
              </footer>
            </blockquote>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
