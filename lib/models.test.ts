import { getProviderColor, PROVIDER_COLORS } from './models'

describe('getProviderColor', () => {
  it('returns the correct color for known providers', () => {
    expect(getProviderColor('openai')).toBe(PROVIDER_COLORS['openai'])
    expect(getProviderColor('anthropic')).toBe(PROVIDER_COLORS['anthropic'])
    expect(getProviderColor('google')).toBe(PROVIDER_COLORS['google'])
    expect(getProviderColor('meta')).toBe(PROVIDER_COLORS['meta'])
    expect(getProviderColor('mistral')).toBe(PROVIDER_COLORS['mistral'])
  })

  it('returns the default primary color for unknown providers', () => {
    expect(getProviderColor('unknown-provider')).toBe('#6C63FF')
  })
})

describe('PROVIDER_COLORS', () => {
  it('contains entries for all major providers', () => {
    expect(PROVIDER_COLORS).toHaveProperty('openai')
    expect(PROVIDER_COLORS).toHaveProperty('anthropic')
    expect(PROVIDER_COLORS).toHaveProperty('google')
    expect(PROVIDER_COLORS).toHaveProperty('meta')
    expect(PROVIDER_COLORS).toHaveProperty('mistral')
  })

  it('all color values are valid hex strings', () => {
    for (const color of Object.values(PROVIDER_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('all provider colors are unique (no two providers share a color)', () => {
    const colors = Object.values(PROVIDER_COLORS)
    const unique = new Set(colors)
    expect(unique.size).toBe(colors.length)
  })
})
