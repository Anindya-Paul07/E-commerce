import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { applyThemeTokens, DEFAULT_THEME_PRESET } from '@/lib/themeTokens'

const ThemeContext = createContext(null)
ThemeContext.displayName = 'ThemeContext'

export function ThemeProvider({ children }) {
  const [state, setState] = useState({
    presets: [DEFAULT_THEME_PRESET],
    activeKey: DEFAULT_THEME_PRESET.key,
    mode: DEFAULT_THEME_PRESET.palette.mode || 'day',
    loading: true,
    error: null,
  })

  const isMounted = useRef(true)
  const presetsRef = useRef(state.presets)

  useEffect(() => {
    presetsRef.current = state.presets
  }, [state.presets])

  useEffect(() => () => {
    isMounted.current = false
  }, [])

  const applyPresetTokens = useCallback((preset, overrides) => {
    applyThemeTokens(preset || DEFAULT_THEME_PRESET, overrides)
  }, [])

  const resolvePreset = useCallback((key, presets) => {
    const list = Array.isArray(presets) && presets.length ? presets : presetsRef.current
    let resolved = list.find((preset) => preset.key === key)
    if (!resolved) resolved = list.find((preset) => preset.isDefault)
    if (!resolved) resolved = list[0]
    if (!resolved) resolved = DEFAULT_THEME_PRESET
    return { resolved, list: list.length ? list : [DEFAULT_THEME_PRESET] }
  }, [])

  const setActivePreset = useCallback((key, options = {}) => {
    const { resolved, list } = resolvePreset(key, options.presets)
    applyPresetTokens(resolved, options.overrides)
    if (isMounted.current) {
      setState({
        presets: list,
        activeKey: resolved.key || DEFAULT_THEME_PRESET.key,
        mode: (resolved.palette?.mode || 'day').toLowerCase() === 'night' ? 'night' : 'day',
        loading: false,
        error: null,
      })
      presetsRef.current = list
    }
    return resolved
  }, [applyPresetTokens, resolvePreset])

  const refresh = useCallback(async () => {
    if (isMounted.current) {
      setState((prev) => ({ ...prev, loading: true, error: null }))
    }

    try {
      const payload = await api.get('/themes')
      const presets = Array.isArray(payload?.presets) ? payload.presets : []
      const activeKey = payload?.activePreset || presets.find((preset) => preset.isDefault)?.key || presets[0]?.key || DEFAULT_THEME_PRESET.key
      return setActivePreset(activeKey, { presets })
    } catch (error) {
      console.error('Failed to load theme presets', error)
      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error?.message || 'Failed to load theme presets',
        }))
      }
      setActivePreset(DEFAULT_THEME_PRESET.key, { presets: [DEFAULT_THEME_PRESET] })
      return DEFAULT_THEME_PRESET
    }
  }, [setActivePreset])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const value = useMemo(() => ({
    presets: state.presets,
    activePreset: state.activeKey,
    mode: state.mode,
    loading: state.loading,
    error: state.error,
    setActivePreset,
    refresh,
    applyOverrides: (overrides) => {
      const current = state.presets.find((preset) => preset.key === state.activeKey) || DEFAULT_THEME_PRESET
      applyPresetTokens(current, overrides)
    },
  }), [state, setActivePreset, refresh, applyPresetTokens])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
