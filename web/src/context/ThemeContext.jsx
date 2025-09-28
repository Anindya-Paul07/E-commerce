import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTheme, THEME_KEYS } from '@/lib/themes';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'ecommerce_theme';

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem(STORAGE_KEY) || 'modern');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeKey);
  }, [themeKey]);

  useEffect(() => {
    const theme = getTheme(themeKey);
    const root = document.documentElement;
    Object.entries(theme.tokens).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
  }, [themeKey]);

  const value = useMemo(() => ({
    themeKey,
    theme: getTheme(themeKey),
    setThemeKey,
    themes: THEME_KEYS,
  }), [themeKey]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
