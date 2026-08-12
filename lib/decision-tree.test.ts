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
