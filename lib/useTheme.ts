'use client'

import { useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'llm-kb-theme'

/** Read the current theme from the <html> element's class list. */
function readCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

/**
 * useTheme — reads/writes the light/dark theme.
 *
 * - Persists the user's choice in localStorage under `llm-kb-theme`.
 * - Falls back to `prefers-color-scheme` when no saved preference exists.
 * - Applies the theme by toggling the `light` class on `<html>`.
 * - Works alongside the anti-flash inline script in `app/layout.tsx` which
 *   applies the saved class before first paint.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(readCurrentTheme)

  // Apply theme to <html> and persist to localStorage
  const applyTheme = useCallback((next: Theme) => {
    if (next === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage may be unavailable in some environments
    }
    setTheme(next)
  }, [])

  // On mount, resolve the correct theme from storage / system preference
  useEffect(() => {
    let saved: Theme | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === 'light' || raw === 'dark') saved = raw
    } catch {
      // ignore
    }

    if (saved) {
      applyTheme(saved)
    } else {
      // Fall back to system preference
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark ? 'dark' : 'light')
    }
  }, [applyTheme])

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  return { theme, toggleTheme }
}
