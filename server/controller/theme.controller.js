import { ThemePreset, ThemeSetting } from '../model/theme-preset.model.js';

const DEFAULT_PRESETS = [
  {
    key: 'daylight',
    label: 'Daylight',
    description: 'Bright whites with indigo accents for daytime experiences.',
    palette: {
      name: 'Daylight',
      mode: 'day',
      accent: '#6366f1',
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#e2e8f0',
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(14,165,233,0.1))',
    },
    typography: {
      headingFont: '"Clash Display", var(--font-heading)',
      bodyFont: '"Inter", var(--font-body)',
    },
    isDefault: true,
  },
  {
    key: 'solstice',
    label: 'Solstice',
    description: 'Warm daylight palette with amber gradients and soft neutrals.',
    palette: {
      name: 'Solstice',
      mode: 'day',
      accent: '#f97316',
      surface: '#fdfcf8',
      text: '#2d1b0f',
      muted: '#f1e4d3',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.28), rgba(251,191,36,0.18))',
    },
    typography: {
      headingFont: '"Marcellus", serif',
      bodyFont: '"Inter", sans-serif',
    },
  },
  {
    key: 'twilight',
    label: 'Twilight',
    description: 'Nocturnal hues with electric accents for elevated evening browsing.',
    palette: {
      name: 'Twilight',
      mode: 'night',
      accent: '#f97316',
      surface: '#111827',
      text: '#E2E8F0',
      muted: '#1f2937',
      gradient: 'linear-gradient(135deg, rgba(37,99,235,0.32), rgba(76,29,149,0.2))',
    },
    typography: {
      headingFont: '"Clash Display", var(--font-heading)',
      bodyFont: '"Inter", var(--font-body)',
    },
  },
  {
    key: 'midnight',
    label: 'Midnight',
    description: 'Deep graphite backgrounds with cyan highlights for dark mode perfection.',
    palette: {
      name: 'Midnight',
      mode: 'night',
      accent: '#22d3ee',
      surface: '#0b1120',
      text: '#e0f2fe',
      muted: '#1e293b',
      gradient: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(99,102,241,0.22))',
    },
    typography: {
      headingFont: '"Sora", sans-serif',
      bodyFont: '"Inter", var(--font-body)',
      accentFont: '"Space Grotesk", sans-serif',
    },
  },
];

async function ensureDefaultPresets() {
  const count = await ThemePreset.countDocuments();
  if (count > 0) return;
  await ThemePreset.insertMany(DEFAULT_PRESETS);
  await ThemeSetting.updateOne(
    {},
    { $setOnInsert: { activePreset: DEFAULT_PRESETS.find((preset) => preset.isDefault)?.key || 'daylight' } },
    { upsert: true }
  );
}

export async function listThemePresets(req, res, next) {
  try {
    await ensureDefaultPresets();
    const [presets, setting] = await Promise.all([
      ThemePreset.find().sort({ 'palette.mode': 1, key: 1 }).lean(),
      ThemeSetting.findOne().lean(),
    ]);
    res.json({
      presets,
      activePreset: setting?.activePreset || presets.find((preset) => preset.isDefault)?.key || 'daylight',
    });
  } catch (error) {
    next(error);
  }
}

export async function adminListThemePresets(req, res, next) {
  return listThemePresets(req, res, next);
}

export async function adminSetActiveTheme(req, res, next) {
  try {
    await ensureDefaultPresets();
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'key is required' });

    const preset = await ThemePreset.findOne({ key });
    if (!preset) return res.status(404).json({ error: 'Theme preset not found' });

    await ThemeSetting.updateOne({}, { activePreset: key }, { upsert: true });
    res.json({ activePreset: key });
  } catch (error) {
    next(error);
  }
}

export async function adminCreateOrUpdatePreset(req, res, next) {
  try {
    const payload = req.body || {};
    const key = toKey(payload.key || payload.label);
    if (!key) return res.status(400).json({ error: 'Theme key or label is required' });

    const update = {
      key,
      label: payload.label?.trim() || key,
      description: payload.description?.trim() || '',
      palette: {
        name: payload.palette?.name?.trim() || payload.label?.trim() || key,
        mode: ['day', 'night'].includes(payload.palette?.mode) ? payload.palette.mode : 'day',
        accent: payload.palette?.accent?.trim() || '#6366f1',
        surface: payload.palette?.surface?.trim() || '',
        text: payload.palette?.text?.trim() || '',
        muted: payload.palette?.muted?.trim() || '',
        gradient: payload.palette?.gradient?.trim() || '',
      },
      typography: {
        headingFont: payload.typography?.headingFont?.trim() || 'var(--font-heading)',
        bodyFont: payload.typography?.bodyFont?.trim() || 'var(--font-body)',
        accentFont: payload.typography?.accentFont?.trim() || '',
      },
      isDefault: Boolean(payload.isDefault),
    };

    const preset = await ThemePreset.findOneAndUpdate({ key }, update, { upsert: true, new: true });
    if (update.isDefault) {
      await ThemePreset.updateMany({ key: { $ne: key } }, { $set: { isDefault: false } });
      await ThemeSetting.updateOne({}, { activePreset: key }, { upsert: true });
    }
    res.status(201).json({ preset });
  } catch (error) {
    next(error);
  }
}

function toKey(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
