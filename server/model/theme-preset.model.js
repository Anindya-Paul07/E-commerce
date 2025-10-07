import mongoose from 'mongoose';

const paletteSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    mode: { type: String, enum: ['day', 'night'], required: true },
    accent: { type: String, trim: true, required: true },
    surface: { type: String, trim: true, default: '' },
    text: { type: String, trim: true, default: '' },
    muted: { type: String, trim: true, default: '' },
    gradient: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const themePresetSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true, unique: true, required: true },
    label: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    palette: { type: paletteSchema, required: true },
    typography: {
      headingFont: { type: String, trim: true, default: 'var(--font-heading)' },
      bodyFont: { type: String, trim: true, default: 'var(--font-body)' },
      accentFont: { type: String, trim: true, default: '' },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const themeSettingSchema = new mongoose.Schema(
  {
    activePreset: { type: String, trim: true, default: 'daylight' },
  },
  { collection: 'theme-settings' }
);

export const ThemePreset = mongoose.model('ThemePreset', themePresetSchema);
export const ThemeSetting = mongoose.model('ThemeSetting', themeSettingSchema);
