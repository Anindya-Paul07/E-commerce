const FALLBACK_COLORS = Object.freeze({
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#f6f8fb',
  popover: '#ffffff',
  primary: '#0ea5e9',
  secondary: '#e2e8f0',
  muted: '#e2e8f0',
  accent: '#f472b6',
  destructive: '#ef4444',
  border: '#d6e0f0',
  ring: '#0ea5e9',
  gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.1))',
})

const FALLBACK_TYPOGRAPHY = Object.freeze({
  headingFont: "'Inter', system-ui, sans-serif",
  bodyFont: "'Inter', 'Source Sans 3', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  accentFont: "'Source Sans 3', system-ui, sans-serif",
})

const DEFAULT_THEME_PRESET = Object.freeze({
  key: 'daylight',
  label: 'Daylight',
  palette: {
    mode: 'day',
    accent: '#6366f1',
    surface: FALLBACK_COLORS.background,
    text: FALLBACK_COLORS.foreground,
    muted: FALLBACK_COLORS.muted,
    gradient: FALLBACK_COLORS.gradient,
  },
  typography: {
    ...FALLBACK_TYPOGRAPHY,
  },
})

const appliedOverrideKeys = new Set()

function parseHex(hex) {
  if (typeof hex !== 'string') return null
  let value = hex.trim()
  if (!value) return null
  if (value.startsWith('#')) value = value.slice(1)
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('')
  }
  if (value.length !== 6) return null
  const int = Number.parseInt(value, 16)
  if (Number.isNaN(int)) return null
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0

  if (delta !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / delta + 2) / 6
        break
      default:
        h = ((rn - gn) / delta + 4) / 6
        break
    }
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function toHslString(hex, fallbackHex) {
  const parsed = parseHex(hex) || parseHex(fallbackHex)
  if (!parsed) return null
  const { h, s, l } = rgbToHsl(parsed)
  return `${h} ${s}% ${l}%`
}

function rgbToHex({ r, g, b }) {
  const clamp = (value) => Math.max(0, Math.min(255, Math.round(value)))
  const parts = [clamp(r), clamp(g), clamp(b)].map((value) => value.toString(16).padStart(2, '0'))
  return `#${parts.join('')}`
}

function mixHex(hexA, hexB, amount = 0.5) {
  const parsedA = parseHex(hexA)
  const parsedB = parseHex(hexB)
  if (!parsedA || !parsedB) return hexA || hexB || FALLBACK_COLORS.foreground
  const ratio = Math.max(0, Math.min(1, amount))
  const mix = (a, b) => a + (b - a) * ratio
  return rgbToHex({
    r: mix(parsedA.r, parsedB.r),
    g: mix(parsedA.g, parsedB.g),
    b: mix(parsedA.b, parsedB.b),
  })
}

function relativeLuminance(hex) {
  const parsed = parseHex(hex)
  if (!parsed) return 0
  const normalize = (value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  }
  const r = normalize(parsed.r)
  const g = normalize(parsed.g)
  const b = normalize(parsed.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getContrastColor(hex) {
  const luminance = relativeLuminance(hex)
  const whiteContrast = (1.05) / (luminance + 0.05)
  const blackContrast = (luminance + 0.05) / 0.05
  return whiteContrast > blackContrast ? '#ffffff' : '#000000'
}

function applyOverrides(root, overrides) {
  if (!root) return
  appliedOverrideKeys.forEach((key) => {
    root.style.removeProperty(key)
  })
  appliedOverrideKeys.clear()

  if (!overrides || typeof overrides !== 'object') return
  Object.entries(overrides).forEach(([key, value]) => {
    if (typeof key !== 'string') return
    if (typeof value !== 'string' && typeof value !== 'number') return
    root.style.setProperty(key, String(value))
    appliedOverrideKeys.add(key)
  })
}

export function applyThemeTokens(preset = DEFAULT_THEME_PRESET, overrides) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const palette = preset?.palette || {}
  const typography = preset?.typography || {}

  const surface = palette.surface || FALLBACK_COLORS.background
  const text = palette.text || FALLBACK_COLORS.foreground
  const accent = palette.accent || FALLBACK_COLORS.primary
  const muted = palette.muted || FALLBACK_COLORS.muted
  const border = mixHex(text, surface, palette.mode === 'night' ? 0.75 : 0.2)
  const secondaryForeground = mixHex(text, surface, 0.35)
  const mutedForeground = mixHex(text, surface, palette.mode === 'night' ? 0.45 : 0.6)
  const ringColor = accent

  const setHslVar = (token, color, fallback) => {
    const value = toHslString(color, fallback)
    if (!value) return
    root.style.setProperty(token, value)
  }

  setHslVar('--background', surface, FALLBACK_COLORS.background)
  setHslVar('--foreground', text, FALLBACK_COLORS.foreground)
  setHslVar('--card', mixHex(surface, text, palette.mode === 'night' ? 0.08 : 0.03), FALLBACK_COLORS.card)
  setHslVar('--card-foreground', text, FALLBACK_COLORS.foreground)
  setHslVar('--popover', surface, FALLBACK_COLORS.popover)
  setHslVar('--popover-foreground', text, FALLBACK_COLORS.foreground)
  setHslVar('--primary', accent, FALLBACK_COLORS.primary)
  setHslVar('--primary-foreground', getContrastColor(accent), getContrastColor(accent))
  setHslVar('--secondary', muted, FALLBACK_COLORS.secondary)
  setHslVar('--secondary-foreground', secondaryForeground, secondaryForeground)
  setHslVar('--muted', muted, FALLBACK_COLORS.muted)
  setHslVar('--muted-foreground', mutedForeground, mutedForeground)
  setHslVar('--accent', accent, FALLBACK_COLORS.accent)
  setHslVar('--accent-foreground', getContrastColor(accent), getContrastColor(accent))
  setHslVar('--destructive', FALLBACK_COLORS.destructive, FALLBACK_COLORS.destructive)
  setHslVar('--destructive-foreground', getContrastColor(FALLBACK_COLORS.destructive), getContrastColor(FALLBACK_COLORS.destructive))
  setHslVar('--border', border, FALLBACK_COLORS.border)
  setHslVar('--input', border, FALLBACK_COLORS.border)
  setHslVar('--ring', ringColor, FALLBACK_COLORS.ring)

  const heroBackground = overrides?.['--hero-background'] || palette.gradient || FALLBACK_COLORS.gradient
  root.style.setProperty('--hero-background', heroBackground)
  root.style.setProperty('--hero-accent', accent)

  const headingFont = typography.headingFont || FALLBACK_TYPOGRAPHY.headingFont
  const bodyFont = typography.bodyFont || FALLBACK_TYPOGRAPHY.bodyFont
  const accentFont = typography.accentFont || typography.headingFont || FALLBACK_TYPOGRAPHY.accentFont

  root.style.setProperty('--font-heading', headingFont)
  root.style.setProperty('--font-body', bodyFont)
  root.style.setProperty('--font-accent', accentFont)

  const isNightMode = (palette.mode || '').toLowerCase() === 'night'
  root.classList.toggle('dark', isNightMode)
  root.dataset.themeMode = isNightMode ? 'night' : 'day'
  root.dataset.themeKey = preset?.key || DEFAULT_THEME_PRESET.key

  applyOverrides(root, overrides)
}

export { DEFAULT_THEME_PRESET }
