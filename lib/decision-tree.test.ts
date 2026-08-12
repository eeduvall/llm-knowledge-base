import {
  QUESTIONS,
  getNextQuestion,
  isFunnelComplete,
  scoreModel,
  getRecommendations,
} from './decision-tree';
import type { UserAnswers } from './decision-tree';
import type { Model } from './models';

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
  };
}

function allAnswers(overrides: Record<string, string> = {}): UserAnswers {
  const base: UserAnswers = {
    use_case: 'chatbot',
    latency: 'medium',
    budget: 'mid',
    context: 'short',
    modality: 'text_only',
    license: 'any',
    deployment: 'cloud_api',
    compliance: 'none',
    customization: 'prompt_only',
    reasoning_style: 'flexible',
  };
  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// QUESTIONS structure
// ---------------------------------------------------------------------------

describe('QUESTIONS', () => {
  it('has at least 10 questions', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('every question has a non-empty id, text, and at least 2 answers', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(q.answers.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every answer has a non-empty id and label', () => {
    for (const q of QUESTIONS) {
      for (const a of q.answers) {
        expect(a.id).toBeTruthy();
        expect(a.label).toBeTruthy();
      }
    }
  });

  it('question ids are unique', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes all 10 expected question ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    const expected = [
      'use_case',
      'latency',
      'budget',
      'context',
      'modality',
      'license',
      'deployment',
      'compliance',
      'customization',
      'reasoning_style',
    ];
    for (const id of expected) {
      expect(ids).toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// getNextQuestion
// ---------------------------------------------------------------------------

describe('getNextQuestion', () => {
  it('returns the first question when no answers given', () => {
    const q = getNextQuestion({});
    expect(q).not.toBeNull();
    expect(q!.id).toBe(QUESTIONS[0].id);
  });

  it('returns the second question after the first is answered', () => {
    const answers: UserAnswers = { [QUESTIONS[0].id]: QUESTIONS[0].answers[0].id };
    const q = getNextQuestion(answers);
    expect(q).not.toBeNull();
    expect(q!.id).toBe(QUESTIONS[1].id);
  });

  it('returns null when all questions are answered', () => {
    const answers = allAnswers();
    expect(getNextQuestion(answers)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isFunnelComplete
// ---------------------------------------------------------------------------

describe('isFunnelComplete', () => {
  it('returns false when no answers given', () => {
    expect(isFunnelComplete({})).toBe(false);
  });

  it('returns false when only some questions answered', () => {
    expect(isFunnelComplete({ use_case: 'chatbot' })).toBe(false);
  });

  it('returns true when all 10 questions answered', () => {
    expect(isFunnelComplete(allAnswers())).toBe(true);
  });

  it('returns false when only the original 6 questions are answered', () => {
    const sixOnly: UserAnswers = {
      use_case: 'chatbot',
      latency: 'medium',
      budget: 'mid',
      context: 'short',
      modality: 'text_only',
      license: 'any',
    };
    expect(isFunnelComplete(sixOnly)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — use_case dimension
// ---------------------------------------------------------------------------

describe('scoreModel — use_case: code', () => {
  it('gives high score to a model with code capability', () => {
    const model = makeModel({ capabilities: ['code', 'reasoning'] });
    const result = scoreModel(model, allAnswers({ use_case: 'code' }));
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toMatch(/code/i);
  });

  it('gives lower score to a model without code capability', () => {
    const withCode = makeModel({ capabilities: ['code'] });
    const withoutCode = makeModel({ capabilities: ['reasoning'] });
    const answersCode = allAnswers({ use_case: 'code' });
    expect(scoreModel(withCode, answersCode).score).toBeGreaterThan(
      scoreModel(withoutCode, answersCode).score,
    );
  });
});

describe('scoreModel — use_case: rag', () => {
  it('rewards long-context capability', () => {
    const longCtx = makeModel({
      capabilities: ['long-context', 'structured-output'],
      context_window: 200000,
    });
    const shortCtx = makeModel({ capabilities: ['reasoning'], context_window: 8000 });
    const answers = allAnswers({ use_case: 'rag', context: 'long' });
    expect(scoreModel(longCtx, answers).score).toBeGreaterThan(scoreModel(shortCtx, answers).score);
  });
});

describe('scoreModel — use_case: agent', () => {
  it('rewards tool-use capability', () => {
    const withTools = makeModel({ capabilities: ['tool-use', 'structured-output'] });
    const withoutTools = makeModel({ capabilities: ['reasoning'] });
    const answers = allAnswers({ use_case: 'agent' });
    expect(scoreModel(withTools, answers).score).toBeGreaterThan(
      scoreModel(withoutTools, answers).score,
    );
  });
});

describe('scoreModel — use_case: creative', () => {
  it('rewards image modality', () => {
    const multimodal = makeModel({ modalities: ['text', 'image'] });
    const textOnly = makeModel({ modalities: ['text'] });
    const answers = allAnswers({ use_case: 'creative' });
    expect(scoreModel(multimodal, answers).score).toBeGreaterThan(
      scoreModel(textOnly, answers).score,
    );
  });
});

// ---------------------------------------------------------------------------
// scoreModel — budget dimension
// ---------------------------------------------------------------------------

describe('scoreModel — budget: low', () => {
  it('rewards cheap models', () => {
    const cheap = makeModel({ pricing: { input: 0.15, output: 0.6 } });
    const expensive = makeModel({ pricing: { input: 15.0, output: 60.0 } });
    const answers = allAnswers({ budget: 'low' });
    expect(scoreModel(cheap, answers).score).toBeGreaterThan(scoreModel(expensive, answers).score);
  });
});

describe('scoreModel — budget: self_host', () => {
  it('strongly rewards open-weights models with null pricing', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, license: 'llama' });
    const proprietary = makeModel({ pricing: { input: 3.0, output: 9.0 }, license: 'proprietary' });
    const answers = allAnswers({ budget: 'self_host' });
    expect(scoreModel(openWeights, answers).score).toBeGreaterThan(
      scoreModel(proprietary, answers).score,
    );
  });

  it('includes self-hostable reason in output', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, license: 'llama' });
    const result = scoreModel(openWeights, allAnswers({ budget: 'self_host' }));
    expect(result.reason).toMatch(/self-host/i);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — context dimension
// ---------------------------------------------------------------------------

describe('scoreModel — context: long', () => {
  it('rewards models with very large context windows', () => {
    const huge = makeModel({ context_window: 2000000 });
    const small = makeModel({ context_window: 8000 });
    const answers = allAnswers({ context: 'long' });
    expect(scoreModel(huge, answers).score).toBeGreaterThan(scoreModel(small, answers).score);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — modality dimension
// ---------------------------------------------------------------------------

describe('scoreModel — modality: vision', () => {
  it('rewards models with image modality', () => {
    const vision = makeModel({ modalities: ['text', 'image'] });
    const textOnly = makeModel({ modalities: ['text'] });
    const answers = allAnswers({ modality: 'vision' });
    expect(scoreModel(vision, answers).score).toBeGreaterThan(scoreModel(textOnly, answers).score);
  });

  it('penalises models without image modality when vision is required', () => {
    const textOnly = makeModel({ modalities: ['text'] });
    const answers = allAnswers({ modality: 'vision' });
    const result = scoreModel(textOnly, answers);
    const visionModel = makeModel({ modalities: ['text', 'image'] });
    expect(result.score).toBeLessThan(scoreModel(visionModel, answers).score);
  });
});

describe('scoreModel — modality: audio', () => {
  it('rewards models with audio modality', () => {
    const audio = makeModel({ modalities: ['text', 'audio'] });
    const textOnly = makeModel({ modalities: ['text'] });
    const answers = allAnswers({ modality: 'audio' });
    expect(scoreModel(audio, answers).score).toBeGreaterThan(scoreModel(textOnly, answers).score);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — license dimension
// ---------------------------------------------------------------------------

describe('scoreModel — license: open', () => {
  it('strongly rewards open-license models', () => {
    const open = makeModel({ license: 'apache-2.0', pricing: { input: null, output: null } });
    const proprietary = makeModel({ license: 'proprietary', pricing: { input: 3.0, output: 9.0 } });
    const answers = allAnswers({ license: 'open', budget: 'self_host' });
    expect(scoreModel(open, answers).score).toBeGreaterThan(scoreModel(proprietary, answers).score);
  });

  it('penalises proprietary models when open license required', () => {
    const proprietary = makeModel({ license: 'proprietary' });
    const open = makeModel({ license: 'llama', pricing: { input: null, output: null } });
    const answers = allAnswers({ license: 'open' });
    expect(scoreModel(open, answers).score).toBeGreaterThan(scoreModel(proprietary, answers).score);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — deployment dimension (NEW)
// ---------------------------------------------------------------------------

describe('scoreModel — deployment: edge', () => {
  it('rewards compact / quantizable models', () => {
    const compact = makeModel({
      capabilities: ['quantizable'],
      context_window: 16000,
      pricing: { input: null, output: null },
    });
    const large = makeModel({ context_window: 200000, pricing: { input: 5.0, output: 15.0 } });
    const answers = allAnswers({ deployment: 'edge' });
    expect(scoreModel(compact, answers).score).toBeGreaterThan(scoreModel(large, answers).score);
  });

  it('rewards open-weights models for on-device inference', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, context_window: 16000 });
    const apiOnly = makeModel({ pricing: { input: 1.0, output: 3.0 }, context_window: 16000 });
    const answers = allAnswers({ deployment: 'edge' });
    expect(scoreModel(openWeights, answers).score).toBeGreaterThan(
      scoreModel(apiOnly, answers).score,
    );
  });
});

describe('scoreModel — deployment: cloud_api', () => {
  it('rewards models with API pricing', () => {
    const apiModel = makeModel({ pricing: { input: 3.0, output: 9.0 } });
    const openModel = makeModel({ pricing: { input: null, output: null } });
    const answers = allAnswers({ deployment: 'cloud_api' });
    expect(scoreModel(apiModel, answers).score).toBeGreaterThan(
      scoreModel(openModel, answers).score,
    );
  });
});

describe('scoreModel — deployment: on_prem', () => {
  it('rewards open-weights non-proprietary models', () => {
    const openPrem = makeModel({ pricing: { input: null, output: null }, license: 'llama' });
    const proprietary = makeModel({ pricing: { input: 3.0, output: 9.0 }, license: 'proprietary' });
    const answers = allAnswers({ deployment: 'on_prem' });
    expect(scoreModel(openPrem, answers).score).toBeGreaterThan(
      scoreModel(proprietary, answers).score,
    );
  });
});

describe('scoreModel — deployment: cloud_self', () => {
  it('rewards open-weights models for self-hosted cloud', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, license: 'apache-2.0' });
    const apiOnly = makeModel({ pricing: { input: 3.0, output: 9.0 }, license: 'proprietary' });
    const answers = allAnswers({ deployment: 'cloud_self' });
    expect(scoreModel(openWeights, answers).score).toBeGreaterThan(
      scoreModel(apiOnly, answers).score,
    );
  });
});

// ---------------------------------------------------------------------------
// scoreModel — compliance dimension (NEW)
// ---------------------------------------------------------------------------

describe('scoreModel — compliance: data_residency', () => {
  it('rewards EU-based providers', () => {
    const eu = makeModel({ provider: 'mistral', pricing: { input: 1.0, output: 3.0 } });
    const us = makeModel({ provider: 'openai', pricing: { input: 1.0, output: 3.0 } });
    const answers = allAnswers({ compliance: 'data_residency' });
    expect(scoreModel(eu, answers).score).toBeGreaterThan(scoreModel(us, answers).score);
  });

  it('rewards self-hosted models for data sovereignty', () => {
    const selfHosted = makeModel({ pricing: { input: null, output: null }, provider: 'meta' });
    const apiOnly = makeModel({ pricing: { input: 3.0, output: 9.0 }, provider: 'openai' });
    const answers = allAnswers({ compliance: 'data_residency' });
    expect(scoreModel(selfHosted, answers).score).toBeGreaterThan(
      scoreModel(apiOnly, answers).score,
    );
  });
});

describe('scoreModel — compliance: hipaa', () => {
  it('rewards enterprise providers with compliance certifications', () => {
    const enterprise = makeModel({ provider: 'openai', pricing: { input: 3.0, output: 9.0 } });
    const unknown = makeModel({ provider: 'unknown-startup', pricing: { input: 3.0, output: 9.0 } });
    const answers = allAnswers({ compliance: 'hipaa' });
    expect(scoreModel(enterprise, answers).score).toBeGreaterThan(
      scoreModel(unknown, answers).score,
    );
  });
});

describe('scoreModel — compliance: pci', () => {
  it('rewards enterprise providers for PCI-DSS', () => {
    const enterprise = makeModel({ provider: 'anthropic', pricing: { input: 3.0, output: 9.0 } });
    const unknown = makeModel({ provider: 'unknown', pricing: { input: 3.0, output: 9.0 } });
    const answers = allAnswers({ compliance: 'pci' });
    expect(scoreModel(enterprise, answers).score).toBeGreaterThan(
      scoreModel(unknown, answers).score,
    );
  });
});

describe('scoreModel — compliance: sox', () => {
  it('rewards enterprise providers for SOX', () => {
    const enterprise = makeModel({ provider: 'google', pricing: { input: 3.0, output: 9.0 } });
    const unknown = makeModel({ provider: 'unknown', pricing: { input: 3.0, output: 9.0 } });
    const answers = allAnswers({ compliance: 'sox' });
    expect(scoreModel(enterprise, answers).score).toBeGreaterThan(
      scoreModel(unknown, answers).score,
    );
  });
});

// ---------------------------------------------------------------------------
// scoreModel — customization dimension (NEW)
// ---------------------------------------------------------------------------

describe('scoreModel — customization: fine_tune', () => {
  it('rewards models with fine-tuning capability', () => {
    const tunable = makeModel({ capabilities: ['fine-tuning', 'reasoning'] });
    const frozen = makeModel({ capabilities: ['reasoning'] });
    const answers = allAnswers({ customization: 'fine_tune' });
    expect(scoreModel(tunable, answers).score).toBeGreaterThan(scoreModel(frozen, answers).score);
  });

  it('rewards open-weights models for custom fine-tuning', () => {
    const openWeights = makeModel({ pricing: { input: null, output: null }, license: 'llama' });
    const apiOnly = makeModel({ pricing: { input: 3.0, output: 9.0 }, license: 'proprietary' });
    const answers = allAnswers({ customization: 'fine_tune' });
    expect(scoreModel(openWeights, answers).score).toBeGreaterThan(
      scoreModel(apiOnly, answers).score,
    );
  });
});

describe('scoreModel — customization: both', () => {
  it('rewards models with both fine-tuning and in-context-learning', () => {
    const full = makeModel({ capabilities: ['fine-tuning', 'in-context-learning', 'reasoning'] });
    const basic = makeModel({ capabilities: ['reasoning'] });
    const answers = allAnswers({ customization: 'both' });
    expect(scoreModel(full, answers).score).toBeGreaterThan(scoreModel(basic, answers).score);
  });
});

describe('scoreModel — customization: prompt_only', () => {
  it('rewards models with strong in-context learning', () => {
    const icl = makeModel({ capabilities: ['in-context-learning', 'reasoning'] });
    const noIcl = makeModel({ capabilities: ['reasoning'] });
    const answers = allAnswers({ customization: 'prompt_only' });
    expect(scoreModel(icl, answers).score).toBeGreaterThan(scoreModel(noIcl, answers).score);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — reasoning_style dimension (NEW)
// ---------------------------------------------------------------------------

describe('scoreModel — reasoning_style: multi_step', () => {
  it('rewards models with strong reasoning capability', () => {
    const reasoner = makeModel({
      capabilities: ['reasoning'],
      benchmarks: { mmlu: 88.0, humaneval: 85.0, mt_bench: null },
    });
    const basic = makeModel({
      capabilities: [],
      benchmarks: { mmlu: 70.0, humaneval: 60.0, mt_bench: null },
    });
    const answers = allAnswers({ reasoning_style: 'multi_step' });
    expect(scoreModel(reasoner, answers).score).toBeGreaterThan(scoreModel(basic, answers).score);
  });

  it('rewards high MMLU scores for multi-step reasoning', () => {
    const highMmlu = makeModel({
      capabilities: ['reasoning'],
      benchmarks: { mmlu: 90.0, humaneval: 80.0, mt_bench: null },
    });
    const lowMmlu = makeModel({
      capabilities: ['reasoning'],
      benchmarks: { mmlu: 60.0, humaneval: 50.0, mt_bench: null },
    });
    const answers = allAnswers({ reasoning_style: 'multi_step' });
    expect(scoreModel(highMmlu, answers).score).toBeGreaterThan(scoreModel(lowMmlu, answers).score);
  });
});

describe('scoreModel — reasoning_style: single_turn', () => {
  it('rewards cheaper models for single-turn efficiency', () => {
    const cheap = makeModel({ pricing: { input: 0.5, output: 1.5 } });
    const expensive = makeModel({ pricing: { input: 15.0, output: 60.0 } });
    const answers = allAnswers({ reasoning_style: 'single_turn' });
    expect(scoreModel(cheap, answers).score).toBeGreaterThan(scoreModel(expensive, answers).score);
  });
});

// ---------------------------------------------------------------------------
// scoreModel — result shape
// ---------------------------------------------------------------------------

describe('scoreModel — result shape', () => {
  it('always returns a reason string', () => {
    const model = makeModel();
    const result = scoreModel(model, allAnswers());
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('returns the same model reference', () => {
    const model = makeModel();
    const result = scoreModel(model, allAnswers());
    expect(result.model).toBe(model);
  });

  it('returns fallback reason when no signals fire', () => {
    const model = makeModel({
      capabilities: [],
      modalities: ['text'],
      pricing: { input: 3.0, output: 9.0 },
      benchmarks: { mmlu: 50.0, humaneval: 40.0, mt_bench: null },
      license: 'proprietary',
    });
    const answers = allAnswers({
      use_case: 'creative',
      budget: 'mid',
      modality: 'text_only',
      license: 'any',
      deployment: 'cloud_api',
      compliance: 'none',
      customization: 'prompt_only',
      reasoning_style: 'flexible',
    });
    const result = scoreModel(model, answers);
    // reason is either from signals or the fallback
    expect(result.reason.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getRecommendations
// ---------------------------------------------------------------------------

describe('getRecommendations', () => {
  const models: Model[] = [
    makeModel({ id: 'cheap', pricing: { input: 0.15, output: 0.6 }, capabilities: ['reasoning'] }),
    makeModel({
      id: 'mid',
      pricing: { input: 3.0, output: 9.0 },
      capabilities: ['reasoning', 'code'],
    }),
    makeModel({
      id: 'expensive',
      pricing: { input: 15.0, output: 60.0 },
      capabilities: ['reasoning', 'code', 'tool-use'],
    }),
    makeModel({
      id: 'open',
      pricing: { input: null, output: null },
      license: 'llama',
      capabilities: ['reasoning', 'code'],
    }),
  ];

  it('returns results sorted by score descending', () => {
    const results = getRecommendations(models, allAnswers({ use_case: 'code', budget: 'mid' }));
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('returns at least 3 results even if scores are low', () => {
    const results = getRecommendations(models, allAnswers());
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it('returns empty array for empty model list', () => {
    const results = getRecommendations([], allAnswers());
    expect(results).toEqual([]);
  });

  it('prefers open-weights models when self_host budget selected', () => {
    const results = getRecommendations(
      models,
      allAnswers({ budget: 'self_host', license: 'open' }),
    );
    expect(results[0].model.id).toBe('open');
  });

  it('prefers cheap models when low budget selected', () => {
    const results = getRecommendations(models, allAnswers({ budget: 'low', latency: 'fast' }));
    expect(results[0].model.id).toBe('cheap');
  });

  it('each result has a model, score, and reason', () => {
    const results = getRecommendations(models, allAnswers());
    for (const r of results) {
      expect(r.model).toBeDefined();
      expect(typeof r.score).toBe('number');
      expect(typeof r.reason).toBe('string');
    }
  });
});
