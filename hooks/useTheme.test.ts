import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

// window.matchMedia is stubbed in jest.setup.ts

describe('useTheme', () => {
  beforeEach(() => {
    // Reset html class and localStorage before each test
    document.documentElement.classList.remove('light')
    localStorage.clear()
  })

  it('defaults to dark theme when no preference is stored', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('reads stored light preference from localStorage', () => {
    localStorage.setItem('llm-kb-theme', 'light')
    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('reads stored dark preference from localStorage', () => {
    localStorage.setItem('llm-kb-theme', 'dark')
    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('does not overwrite stored light preference on first render', () => {
    localStorage.setItem('llm-kb-theme', 'light')
    renderHook(() => useTheme())
    act(() => {})
    // The stored value must still be 'light', not overwritten to 'dark'
    expect(localStorage.getItem('llm-kb-theme')).toBe('light')
  })

  it('toggleTheme switches from dark to light', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {})
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(localStorage.getItem('llm-kb-theme')).toBe('light')
  })

  it('toggleTheme switches from light to dark', () => {
    localStorage.setItem('llm-kb-theme', 'light')
    const { result } = renderHook(() => useTheme())
    act(() => {})
    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorage.getItem('llm-kb-theme')).toBe('dark')
  })

  it('persists theme to localStorage on toggle', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {})
    act(() => {
      result.current.toggleTheme()
    })
    expect(localStorage.getItem('llm-kb-theme')).toBe('light')
    act(() => {
      result.current.toggleTheme()
    })
    expect(localStorage.getItem('llm-kb-theme')).toBe('dark')
  })
})
