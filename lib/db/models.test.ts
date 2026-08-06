// Unit tests for lib/db/models.ts
// The SQLite client is mocked so no real database file is needed.

import type { Model } from '../models'
import type { DbModelRow } from './schema'

// ---------------------------------------------------------------------------
// Mock the SQLite client before importing the module under test.
// ---------------------------------------------------------------------------

const mockGet = jest.fn()
const mockAll = jest.fn()
const mockPrepare = jest.fn()

jest.mock('./client', () => ({
  getDb: jest.fn(() => ({
    prepare: mockPrepare,
  })),
}))

// Import AFTER mocking
import { getAllModels, getModelById, getModelsByProvider, getModelsByCapability } from './models'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const rawRow: DbModelRow = {
  id: 'gpt-4o',
  name: 'GPT-4o',
  provider: 'openai',
  family: 'gpt-4',
  release_date: '2024-05-13',
  context_window: 128000,
  license: 'proprietary',
  last_verified: null,
  modalities: '["text","image"]',
  capabilities: '["reasoning","vision"]',
  strengths: '["Best-in-class multimodal reasoning"]',
  weaknesses: '["Higher cost vs. smaller models"]',
  pricing_input: 5.0,
  pricing_output: 15.0,
  benchmark_mmlu: 88.7,
  benchmark_humaneval: 90.2,
  benchmark_mt_bench: null,
  docs_url: 'https://platform.openai.com/docs',
  paper_url: null,
}

const expectedModel: Model = {
  id: 'gpt-4o',
  name: 'GPT-4o',
  provider: 'openai',
  family: 'gpt-4',
  release_date: '2024-05-13',
  context_window: 128000,
  license: 'proprietary',
  last_verified: undefined,
  modalities: ['text', 'image'],
  capabilities: ['reasoning', 'vision'],
  pricing: { input: 5.0, output: 15.0 },
  benchmarks: { mmlu: 88.7, humaneval: 90.2, mt_bench: null },
  strengths: ['Best-in-class multimodal reasoning'],
  weaknesses: ['Higher cost vs. smaller models'],
  links: { docs: 'https://platform.openai.com/docs', paper: null },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wire mockPrepare so that .all() returns the given rows. */
function setupAll(rows: DbModelRow[]) {
  mockAll.mockReturnValue(rows)
  mockPrepare.mockReturnValue({ all: mockAll })
}

/** Wire mockPrepare so that .get() returns the given row (or undefined). */
function setupGet(row: DbModelRow | undefined) {
  mockGet.mockReturnValue(row)
  mockPrepare.mockReturnValue({ get: mockGet })
}

/** Wire mockPrepare so that .all() throws. */
function setupAllThrows(message: string) {
  mockAll.mockImplementation(() => { throw new Error(message) })
  mockPrepare.mockReturnValue({ all: mockAll })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getAllModels', () => {
  it('returns mapped Model array on success', () => {
    setupAll([rawRow])
    const result = getAllModels()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(expectedModel)
  })

  it('returns empty array when DB returns no rows', () => {
    setupAll([])
    const result = getAllModels()
    expect(result).toEqual([])
  })

  it('throws when the DB throws', () => {
    setupAllThrows('disk I/O error')
    expect(() => getAllModels()).toThrow('disk I/O error')
  })
})

describe('getModelById', () => {
  it('returns a Model when found', () => {
    setupGet(rawRow)
    const result = getModelById('gpt-4o')
    expect(result).toEqual(expectedModel)
  })

  it('returns null when not found', () => {
    setupGet(undefined)
    const result = getModelById('nonexistent')
    expect(result).toBeNull()
  })

  it('throws when the DB throws', () => {
    mockGet.mockImplementation(() => { throw new Error('not found') })
    mockPrepare.mockReturnValue({ get: mockGet })
    expect(() => getModelById('gpt-4o')).toThrow('not found')
  })
})

describe('getModelsByProvider', () => {
  it('returns filtered models for a provider', () => {
    setupAll([rawRow])
    const result = getModelsByProvider('openai')
    expect(result).toHaveLength(1)
    expect(result[0].provider).toBe('openai')
  })

  it('returns empty array when no models match', () => {
    setupAll([])
    const result = getModelsByProvider('unknown')
    expect(result).toEqual([])
  })

  it('throws when the DB throws', () => {
    setupAllThrows('query failed')
    expect(() => getModelsByProvider('openai')).toThrow('query failed')
  })
})

describe('getModelsByCapability', () => {
  it('returns models with the given capability', () => {
    setupAll([rawRow])
    const result = getModelsByCapability('vision')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('gpt-4o')
  })

  it('returns empty array when no models have the capability', () => {
    setupAll([])
    const result = getModelsByCapability('nonexistent')
    expect(result).toEqual([])
  })

  it('throws when the DB throws', () => {
    setupAllThrows('cap error')
    expect(() => getModelsByCapability('vision')).toThrow('cap error')
  })
})
