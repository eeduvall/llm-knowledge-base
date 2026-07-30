// Unit tests for lib/db/models.ts
// The Supabase client is mocked so no real DB connection is needed.

import type { Model } from '../models'

// ---------------------------------------------------------------------------
// Mock the Supabase client before importing the module under test.
// jest.mock factories run before variable declarations, so we use
// jest.fn() inside the factory and retrieve the mocks via require().
// ---------------------------------------------------------------------------

jest.mock('./client', () => {
  const mockMaybeSingle = jest.fn()
  const mockIn = jest.fn()
  const mockOrder2 = jest.fn()
  const mockOrder = jest.fn()
  const mockEq = jest.fn()
  const mockSelect = jest.fn()
  const mockFrom = jest.fn()

  const chain = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    in: mockIn,
    maybeSingle: mockMaybeSingle,
  }

  mockSelect.mockReturnValue(chain)
  mockEq.mockReturnValue(chain)
  // order returns a second-level chain that also has order (for double .order() calls)
  mockOrder.mockReturnValue({ order: mockOrder2 })

  return {
    supabase: { from: mockFrom },
    __mocks: { mockFrom, mockSelect, mockEq, mockOrder, mockOrder2, mockIn, mockMaybeSingle, chain },
  }
})

// Import AFTER mocking
import { getAllModels, getModelById, getModelsByProvider, getModelsByCapability } from './models'
const { __mocks } = jest.requireMock('./client') as {
  __mocks: {
    mockFrom: jest.Mock
    mockSelect: jest.Mock
    mockEq: jest.Mock
    mockOrder: jest.Mock
    mockOrder2: jest.Mock
    mockIn: jest.Mock
    mockMaybeSingle: jest.Mock
    chain: Record<string, jest.Mock>
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const rawRow = {
  id: 'gpt-4o',
  name: 'GPT-4o',
  provider: 'openai',
  family: 'gpt-4',
  release_date: '2024-05-13',
  context_window: 128000,
  license: 'proprietary',
  last_verified: null,
  model_modalities: [{ modality: 'text' }, { modality: 'image' }],
  model_capabilities: [{ capability: 'reasoning' }, { capability: 'vision' }],
  model_pricing: [{ input_price: 5.0, output_price: 15.0 }],
  model_benchmarks: [{ mmlu: 88.7, humaneval: 90.2, mt_bench: null }],
  model_strengths: [
    { strength: 'Best-in-class multimodal reasoning', sort_order: 0 },
  ],
  model_weaknesses: [{ weakness: 'Higher cost vs. smaller models', sort_order: 0 }],
  model_links: [{ docs_url: 'https://platform.openai.com/docs', paper_url: null }],
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

/** Set up mocks for queries that call .order().order() (getAllModels, getModelsByProvider) */
function setupDoubleOrderSuccess(data: unknown) {
  const terminal = Promise.resolve({ data, error: null })
  __mocks.mockOrder2.mockReturnValue(terminal)
  __mocks.mockFrom.mockReturnValue(__mocks.chain)
}

function setupDoubleOrderError(message: string) {
  const terminal = Promise.resolve({ data: null, error: { message } })
  __mocks.mockOrder2.mockReturnValue(terminal)
  __mocks.mockFrom.mockReturnValue(__mocks.chain)
}

/** Set up mocks for queries that call .order() once (getModelsByProvider) */
function setupSingleOrderSuccess(data: unknown) {
  const terminal = Promise.resolve({ data, error: null })
  __mocks.mockOrder.mockReturnValue(terminal)
  __mocks.mockFrom.mockReturnValue(__mocks.chain)
}

function setupSingleOrderError(message: string) {
  const terminal = Promise.resolve({ data: null, error: { message } })
  __mocks.mockOrder.mockReturnValue(terminal)
  __mocks.mockFrom.mockReturnValue(__mocks.chain)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  // Re-wire chain after clearAllMocks
  __mocks.mockSelect.mockReturnValue(__mocks.chain)
  __mocks.mockEq.mockReturnValue(__mocks.chain)
  __mocks.mockOrder.mockReturnValue({ order: __mocks.mockOrder2 })
})

describe('getAllModels', () => {
  it('returns mapped Model array on success', async () => {
    setupDoubleOrderSuccess([rawRow])
    const result = await getAllModels()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(expectedModel)
  })

  it('returns empty array when DB returns no rows', async () => {
    setupDoubleOrderSuccess([])
    const result = await getAllModels()
    expect(result).toEqual([])
  })

  it('throws on Supabase error', async () => {
    setupDoubleOrderError('connection refused')
    await expect(getAllModels()).rejects.toThrow('getAllModels: connection refused')
  })
})

describe('getModelById', () => {
  it('returns a Model when found', async () => {
    const terminal = Promise.resolve({ data: rawRow, error: null })
    __mocks.mockMaybeSingle.mockReturnValue(terminal)
    __mocks.mockFrom.mockReturnValue(__mocks.chain)

    const result = await getModelById('gpt-4o')
    expect(result).toEqual(expectedModel)
  })

  it('returns null when not found', async () => {
    const terminal = Promise.resolve({ data: null, error: null })
    __mocks.mockMaybeSingle.mockReturnValue(terminal)
    __mocks.mockFrom.mockReturnValue(__mocks.chain)

    const result = await getModelById('nonexistent')
    expect(result).toBeNull()
  })

  it('throws on Supabase error', async () => {
    const terminal = Promise.resolve({ data: null, error: { message: 'not found' } })
    __mocks.mockMaybeSingle.mockReturnValue(terminal)
    __mocks.mockFrom.mockReturnValue(__mocks.chain)

    await expect(getModelById('gpt-4o')).rejects.toThrow('getModelById(gpt-4o): not found')
  })
})

describe('getModelsByProvider', () => {
  it('returns filtered models for a provider', async () => {
    setupSingleOrderSuccess([rawRow])
    const result = await getModelsByProvider('openai')
    expect(result).toHaveLength(1)
    expect(result[0].provider).toBe('openai')
  })

  it('returns empty array when no models match', async () => {
    setupSingleOrderSuccess([])
    const result = await getModelsByProvider('unknown')
    expect(result).toEqual([])
  })

  it('throws on Supabase error', async () => {
    setupSingleOrderError('query failed')
    await expect(getModelsByProvider('openai')).rejects.toThrow(
      'getModelsByProvider(openai): query failed'
    )
  })
})

describe('getModelsByCapability', () => {
  it('returns models with the given capability', async () => {
    const capTerminal = Promise.resolve({ data: [{ model_id: 'gpt-4o' }], error: null })
    const modelsTerminal = Promise.resolve({ data: [rawRow], error: null })

    const capChain = {
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(capTerminal) }),
    }
    const modelsChain = {
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue(modelsTerminal),
          }),
        }),
      }),
    }

    __mocks.mockFrom
      .mockReturnValueOnce(capChain)
      .mockReturnValueOnce(modelsChain)

    const result = await getModelsByCapability('vision')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('gpt-4o')
  })

  it('returns empty array when no models have the capability', async () => {
    const capTerminal = Promise.resolve({ data: [], error: null })
    const capChain = {
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(capTerminal) }),
    }
    __mocks.mockFrom.mockReturnValueOnce(capChain)

    const result = await getModelsByCapability('nonexistent')
    expect(result).toEqual([])
  })

  it('throws on capability lookup error', async () => {
    const capTerminal = Promise.resolve({ data: null, error: { message: 'cap error' } })
    const capChain = {
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue(capTerminal) }),
    }
    __mocks.mockFrom.mockReturnValueOnce(capChain)

    await expect(getModelsByCapability('vision')).rejects.toThrow(
      'getModelsByCapability(vision): cap error'
    )
  })
})
