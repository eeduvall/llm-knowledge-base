import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

beforeEach(() => {
  localStorageMock.clear()
  // Reset html class
  document.documentElement.classList.remove('light')
})

describe('useTheme', () => {
  it('defaults to dark when no saved preference and system prefers dark', () => {
    // matchMedia is already stubbed in jest.setup.ts to return false for prefers-color-scheme: dark
    // so the hook will resolve to light from system preference
    // Override to prefer dark for this test
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useTheme())
    // After mount effect runs, theme should be dark
    act(() => {})
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('defaults to light when no saved preference and system prefers light', () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false, // prefers-color-scheme: dark → false → light
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('reads saved dark preference from localStorage', () => {
    localStorageMock.setItem('llm-kb-theme', 'dark')

    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('reads saved light preference from localStorage', () => {
    localStorageMock.setItem('llm-kb-theme', 'light')

    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('toggleTheme switches from dark to light', () => {
    localStorageMock.setItem('llm-kb-theme', 'dark')

    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(localStorageMock.getItem('llm-kb-theme')).toBe('light')
  })

  it('toggleTheme switches from light to dark', () => {
    localStorageMock.setItem('llm-kb-theme', 'light')

    const { result } = renderHook(() => useTheme())
    act(() => {})
    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('light')).toBe(false)
    expect(localStorageMock.getItem('llm-kb-theme')).toBe('dark')
  })

  it('persists theme choice to localStorage on toggle', () => {
    localStorageMock.setItem('llm-kb-theme', 'dark')

    const { result } = renderHook(() => useTheme())
    act(() => {})
    act(() => { result.current.toggleTheme() })
    expect(localStorageMock.getItem('llm-kb-theme')).toBe('light')
  })
})
