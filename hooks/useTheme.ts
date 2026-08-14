'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'llm-kb-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

/**
 * Reads the saved theme from localStorage (key: "llm-kb-theme"), falls back
 * to prefers-color-scheme, and toggles the `html.light` class.
 *
 * The initial class is applied by an inline <script> in app/layout.tsx before
 * first paint to prevent a flash of the wrong theme.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>('dark')
  // Tracks whether the initial read from localStorage has completed.
  // The persistence effect must not write to localStorage on the very first
  // render (before the read effect runs), or it would overwrite a stored
  // 'light' preference with the default 'dark'.
  const mountedRef = useRef(false)

  // On mount: read stored preference and apply it
  useEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    const html = document.documentElement
    if (initial === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }
    mountedRef.current = true
  }, [])

  // After mount: apply class and persist whenever theme changes
  useEffect(() => {
    if (!mountedRef.current) return
    const html = document.documentElement
    if (theme === 'light') {
      html.classList.add('light')
    } else {
      html.classList.remove('light')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
