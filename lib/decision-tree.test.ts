import {
  QUESTIONS,
  getNextQuestion,
  isFunnelComplete,
  scoreModel,
  getRecommendations,
} from './decision-tree'
import type { UserAnswers } from './decision-tree'
import type { Model } from './models'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'test-model',
    name: 'Test Model',
    provider: 'test',
    family: 'test-family',
    release_date: '2024-01-01',
    context_window: 128000,
    modalities: ['text'],
    capabilities: ['reasoning', 'tool-use', 'structured-output', 'code'],
    pricing: { input: 3.0, output: 9.0 },
    benchmarks: { mmlu: 85.0, humaneval: 80.0, mt_bench: null },
    strengths: ['Good at reasoning'],
    weaknesses: ['Expensive'],
    license: 'proprietary',
    links: { docs: null, paper: null },
    ...overrides,
  }
}

function allAnswers(overrides: Record<string, string> = {}): UserAnswers {
  const base: UserAnswers = {
    use_case: 'chatbot',
    latency: 'medium',
    budget: 'mid',
    context: 'short',
    modality: 'text_only',
    license: 'any',
  }
  return { ...base, ...overrides }
}

// ---------------------------------------------------------------------------
// QUESTIONS structure
// ---------------------------------------------------------------------------

describe('QUESTIONS', () => {
  it('has at least 5 questions', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(5)
  })

  it('every question has a non-empty id, text, and at least 2 answers', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy()
      expect(q.text).toBeTruthy()
      expect(q.answers.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('every answer has a non-empty id and label', () => {
    for (const q of QUESTIONS) {
      for (const a of q.answers) {
        expect(a.id).toBeTruthy()
        expect(a.label).toBeTruthy()
      }
    }
  })

  it('question ids are unique', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// getNextQuestion
// ---------------------------------------------------------------------------

describe('getNextQuestion', () => {
  it('returns the first question when no answers given', () => {
    const q = getNextQuestion({})
    expect(q).not.toBeNull()
    expect(q!.id).toBe(QUESTIONS[0].id)
  })

  it('returns the second question after the first is answered', () => {
    const answers: UserAnswers = { [QUESTIONS[0].id]: QUESTIONS[0].answers[0].id }
    const q = getNextQuestion(answers)
    expect(q).not.toBeNull()
    expect(q!.id).toBe(QUESTIONS[1].id)
  })

  it('returns null when all questions are answered', () => {
    const answers = allAnswers()
    expect(getNextQuestion(answers)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// isFunnelComplete
// ---------------------------------------------------------------------------

describe('isFunnelComplete', () => {
  it('returns false when no answers given', () => {
    expect(isFunnelComplete({})).toBe(false)
  })

  it('returns false when only some questions answered', () => {
    expect(isFunnelComplete({ use_case: 'chatbot' })).toBe(false)
  })

  it('returns true when all questions answered', () => {
    expect(isFunnelComplete(allAnswers())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// scoreModel — use_case dimension
// ---------------------------------------------------------------------------

describe('scoreModel — use_case: code', () => {
  it('gives high score to a model with code capability', () => {
    const model = makeModel({ capabilities: ['code', 'reasoning'] })
    const result = scoreModel(model, allAnswers({ use_case: 'code' }))
    expect(result.score).toBeGreaterThan(0)
    expect(result.reason).toMatch(/code/i)
  })

  it('gives lower score to a model without code capability', () => {
    const withCode = makeModel({ capabilities: ['code'] })
    const withoutCode = makeModel({ capabilities: ['reasoning'] })
    const answersCode = allAnswers({ use_case: 'code' })
    expect(scoreModel(withCode, answersCode).score).toBeGreaterThan(
      scoreModel(withoutCode, answersCode).score
    )
  })
})

describe('scoreModel — use_case: rag', () => {
  it('rewards long-context capability', () => {
    const longCtx = makeModel({ capabilities: ['long-context', 'structured-output'], context_window: 200000 })
    const shortCtx = makeModel({ capabilities: ['reasoning'], context_window: 8000 })
    const answers = allAnswers({ use_case: 'rag', context: 'long' })
    expect(scoreModel(longCtx, answers).score).toBeGreaterThan(scoreModel(shortCtx, answers).score)
  })
})

describe('scoreModel — use_case: agent', () => {
  it('rewards tool-use capability', () => {
    const withTools = makeModel({ capabilities: ['tool-use', 'structured-output'] })
    const withoutTools = makeModel({ capabilities: ['reasoning'] })
    const answers = allAnswers({ use_case: 'agent' })
    expect(scoreModel(withTools, answers).score).toBeGreaterThan(
      scoreModel(withoutTools, answers).score
    )
  })
})

describe('scoreModel — use_case: creative', () => {
  it('rewards image modality', () => {
    const multimodal = makeModel({ modalities: ['text', 'image'] })
    const textOnly = makeModel({ modalities: ['text'] })
    const answers = allAnswers({ use_case: 'creative' })
    expect(scoreModel(multimodal, answers).score).toBeGreaterThan(
      scoreModel(textOnly, answers).score
    )
  })
})

// ---------------------------------------------------------------------------
// scoreModel — budget dimension
// ---------------------------------------------------------------------------

describe('scoreModel — budget: low', () => {
  it('rewards cheap models', () => {
    const cheap = makeModel({ pricing: { input: 0.15, output: 0.60 } })
    const expensive = makeModel({ pricing: { input: 15.0, output: 60.0 } })
    const answers = allAnswers({ budget: 'low' })
    expect(scoreModel(cheap, answers).score).toBeGreaterThan(scoreModel(expensive, answers).score)
  })
})

describe('scoreModel — budget: self_host', () => {
  it('strongly rewards open-weights models with null pricing', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, license: 'llama' })
    const proprietary = makeModel({ pricing: { input: 3.0, output: 9.0 }, license: 'proprietary' })
    const answers = allAnswers({ budget: 'self_host' })
    expect(scoreModel(openWeights, answers).score).toBeGreaterThan(
      scoreModel(proprietary, answers).score
    )
  })

  it('includes self-hostable reason in output', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, license: 'llama' })
    const result = scoreModel(openWeights, allAnswers({ budget: 'self_host' }))
    expect(result.reason).toMatch(/self-host/i)
  })
})

// ---------------------------------------------------------------------------
// scoreModel — context dimension
// ---------------------------------------------------------------------------

describe('scoreModel — context: long', () => {
  it('rewards models with very large context windows', () => {
    const huge = makeModel({ context_window: 2000000 })
    const small = makeModel({ context_window: 8000 })
    const answers = allAnswers({ context: 'long' })
    expect(scoreModel(huge, answers).score).toBeGreaterThan(scoreModel(small, answers).score)
  })
})

// ---------------------------------------------------------------------------
// scoreModel — modality dimension
// ---------------------------------------------------------------------------

describe('scoreModel — modality: vision', () => {
  it('rewards models with image modality', () => {
    const vision = makeModel({ modalities: ['text', 'image'] })
    const textOnly = makeModel({ modalities: ['text'] })
    const answers = allAnswers({ modality: 'vision' })
    expect(scoreModel(vision, answers).score).toBeGreaterThan(scoreModel(textOnly, answers).score)
  })

  it('penalises models without image modality when vision is required', () => {
    const textOnly = makeModel({ modalities: ['text'] })
    const answers = allAnswers({ modality: 'vision' })
    const result = scoreModel(textOnly, answers)
    // Score should be lower than a vision model
    const visionModel = makeModel({ modalities: ['text', 'image'] })
    expect(result.score).toBeLessThan(scoreModel(visionModel, answers).score)
  })
})

describe('scoreModel — modality: audio', () => {
  it('rewards models with audio modality', () => {
    const audio = makeModel({ modalities: ['text', 'audio'] })
    const textOnly = makeModel({ modalities: ['text'] })
    const answers = allAnswers({ modality: 'audio' })
    expect(scoreModel(audio, answers).score).toBeGreaterThan(scoreModel(textOnly, answers).score)
  })
})

// ---------------------------------------------------------------------------
// scoreModel — license dimension
// ---------------------------------------------------------------------------

describe('scoreModel — license: open', () => {
  it('strongly rewards open-license models', () => {
    const open = makeModel({ license: 'apache-2.0', pricing: { input: null, output: null } })
    const proprietary = makeModel({ license: 'proprietary', pricing: { input: 3.0, output: 9.0 } })
    const answers = allAnswers({ license: 'open', budget: 'self_host' })
    expect(scoreModel(open, answers).score).toBeGreaterThan(scoreModel(proprietary, answers).score)
  })

  it('penalises proprietary models when open license required', () => {
    const proprietary = makeModel({ license: 'proprietary' })
    const open = makeModel({ license: 'llama', pricing: { input: null, output: null } })
    const answers = allAnswers({ license: 'open' })
    expect(scoreModel(open, answers).score).toBeGreaterThan(scoreModel(proprietary, answers).score)
  })
})

// ---------------------------------------------------------------------------
// scoreModel — result shape
// ---------------------------------------------------------------------------

describe('scoreModel — result shape', () => {
  it('always returns a reason string', () => {
    const model = makeModel()
    const result = scoreModel(model, allAnswers())
    expect(typeof result.reason).toBe('string')
    expect(result.reason.length).toBeGreaterThan(0)
  })

  it('returns the same model reference', () => {
    const model = makeModel()
    const result = scoreModel(model, allAnswers())
    expect(result.model).toBe(model)
  })
})

// ---------------------------------------------------------------------------
// getRecommendations
// ---------------------------------------------------------------------------

describe('getRecommendations', () => {
  const models: Model[] = [
    makeModel({ id: 'cheap', pricing: { input: 0.15, output: 0.60 }, capabilities: ['reasoning'] }),
    makeModel({ id: 'mid', pricing: { input: 3.0, output: 9.0 }, capabilities: ['reasoning', 'code'] }),
    makeModel({ id: 'expensive', pricing: { input: 15.0, output: 60.0 }, capabilities: ['reasoning', 'code', 'tool-use'] }),
    makeModel({ id: 'open', pricing: { input: null, output: null }, license: 'llama', capabilities: ['reasoning', 'code'] }),
  ]

  it('returns results sorted by score descending', () => {
    const results = getRecommendations(models, allAnswers({ use_case: 'code', budget: 'mid' }))
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('returns at least 3 results even if scores are low', () => {
    const results = getRecommendations(models, allAnswers())
    expect(results.length).toBeGreaterThanOrEqual(3)
  })

  it('returns empty array for empty model list', () => {
    const results = getRecommendations([], allAnswers())
    expect(results).toEqual([])
  })

  it('prefers open-weights models when self_host budget selected', () => {
    const results = getRecommendations(models, allAnswers({ budget: 'self_host', license: 'open' }))
    expect(results[0].model.id).toBe('open')
  })

  it('prefers cheap models when low budget selected', () => {
    const results = getRecommendations(models, allAnswers({ budget: 'low', latency: 'fast' }))
    expect(results[0].model.id).toBe('cheap')
  })

  it('each result has a model, score, and reason', () => {
    const results = getRecommendations(models, allAnswers())
    for (const r of results) {
      expect(r.model).toBeDefined()
      expect(typeof r.score).toBe('number')
      expect(typeof r.reason).toBe('string')
    }
  })
})
