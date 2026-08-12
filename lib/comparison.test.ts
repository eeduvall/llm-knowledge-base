import type { Model } from './models';
import {
  calculateDifferences,
  normalizeForComparison,
  compareModels,
  findSharedStrengths,
  findSharedWeaknesses,
} from './comparison';

// ---------------------------------------------------------------------------
// Test factory
// ---------------------------------------------------------------------------

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    family: 'gpt-4',
    release_date: '2024-05-13',
    context_window: 128000,
    modalities: ['text', 'image'],
    capabilities: ['reasoning', 'vision', 'tool-use'],
    pricing: { input: 5.0, output: 15.0 },
    benchmarks: { mmlu: 88.7, humaneval: 90.2, mt_bench: 9.0 },
    strengths: ['Best-in-class multimodal reasoning', 'Fast inference'],
    weaknesses: ['Higher cost vs. smaller models'],
    license: 'proprietary',
    links: { docs: 'https://platform.openai.com/docs', paper: null },
    ...overrides,
  };
}

const modelA = makeModel({
  id: 'model-a',
  name: 'Model A',
  context_window: 128000,
  pricing: { input: 5.0, output: 15.0 },
  benchmarks: { mmlu: 88.7, humaneval: 90.2, mt_bench: 9.0 },
  strengths: ['Great reasoning', 'Fast inference'],
  weaknesses: ['Expensive'],
});

const modelB = makeModel({
  id: 'model-b',
  name: 'Model B',
  context_window: 200000,
  pricing: { input: 3.0, output: 15.0 },
  benchmarks: { mmlu: 85.0, humaneval: 80.0, mt_bench: 8.5 },
  strengths: ['Long context', 'Fast inference'],
  weaknesses: ['Expensive', 'Slow on complex tasks'],
});

const modelC = makeModel({
  id: 'model-c',
  name: 'Model C',
  context_window: 32000,
  pricing: { input: null, output: null },
  benchmarks: { mmlu: null, humaneval: 70.0, mt_bench: null },
  strengths: ['Open weights'],
  weaknesses: ['Limited context'],
});

// ---------------------------------------------------------------------------
// calculateDifferences
// ---------------------------------------------------------------------------

describe('calculateDifferences', () => {
  it('returns empty object for empty input', () => {
    expect(calculateDifferences([])).toEqual({});
  });

  it('marks the single model as best (not worst) for all non-null fields', () => {
    const result = calculateDifferences([modelA]);
    const h = result['model-a'];
    expect(h.contextWindow.isBest).toBe(true);
    expect(h.contextWindow.isWorst).toBe(false); // only 1 model — no worst
    expect(h.inputPrice.isBest).toBe(true);
    expect(h.inputPrice.isWorst).toBe(false);
  });

  it('correctly identifies best context window (higher is better)', () => {
    const result = calculateDifferences([modelA, modelB, modelC]);
    expect(result['model-b'].contextWindow.isBest).toBe(true);
    expect(result['model-c'].contextWindow.isWorst).toBe(true);
    expect(result['model-a'].contextWindow.isBest).toBe(false);
  });

  it('correctly identifies best input price (lower is better)', () => {
    const result = calculateDifferences([modelA, modelB]);
    expect(result['model-b'].inputPrice.isBest).toBe(true);
    expect(result['model-a'].inputPrice.isWorst).toBe(true);
  });

  it('handles null pricing gracefully — null is neither best nor worst', () => {
    const result = calculateDifferences([modelA, modelC]);
    expect(result['model-c'].inputPrice.value).toBeNull();
    expect(result['model-c'].inputPrice.isBest).toBe(false);
    expect(result['model-c'].inputPrice.isWorst).toBe(false);
  });

  it('handles null benchmarks gracefully', () => {
    const result = calculateDifferences([modelA, modelC]);
    expect(result['model-c'].mmlu.value).toBeNull();
    expect(result['model-c'].mmlu.isBest).toBe(false);
    expect(result['model-c'].mmlu.isWorst).toBe(false);
  });

  it('correctly identifies best MMLU (higher is better)', () => {
    const result = calculateDifferences([modelA, modelB]);
    expect(result['model-a'].mmlu.isBest).toBe(true);
    expect(result['model-b'].mmlu.isWorst).toBe(true);
  });

  it('does not mark worst when only one model has a non-null value', () => {
    const result = calculateDifferences([modelA, modelC]);
    // Only modelA has mmlu; modelC has null — so modelA is best but not worst
    expect(result['model-a'].mmlu.isBest).toBe(true);
    expect(result['model-a'].mmlu.isWorst).toBe(false);
  });

  it('returns highlights for every model in the input', () => {
    const result = calculateDifferences([modelA, modelB, modelC]);
    expect(Object.keys(result)).toEqual(['model-a', 'model-b', 'model-c']);
  });
});

// ---------------------------------------------------------------------------
// normalizeForComparison
// ---------------------------------------------------------------------------

describe('normalizeForComparison', () => {
  it('returns empty array for empty input', () => {
    expect(normalizeForComparison([])).toEqual([]);
  });

  it('returns one row per model', () => {
    const rows = normalizeForComparison([modelA, modelB]);
    expect(rows).toHaveLength(2);
    expect(rows[0].model.id).toBe('model-a');
    expect(rows[1].model.id).toBe('model-b');
  });

  it('each row has a highlights object with all required keys', () => {
    const rows = normalizeForComparison([modelA, modelB]);
    const keys = ['contextWindow', 'inputPrice', 'outputPrice', 'mmlu', 'humaneval', 'mt_bench'];
    for (const row of rows) {
      for (const key of keys) {
        expect(row.highlights).toHaveProperty(key);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// compareModels
// ---------------------------------------------------------------------------

describe('compareModels', () => {
  it('returns empty models/rows/highlights for empty input', () => {
    const result = compareModels([]);
    expect(result.models).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.highlights).toEqual({});
  });

  it('returns models, rows, and highlights for a non-empty input', () => {
    const result = compareModels([modelA, modelB]);
    expect(result.models).toHaveLength(2);
    expect(result.rows).toHaveLength(2);
    expect(Object.keys(result.highlights)).toHaveLength(2);
  });

  it('rows and highlights are consistent with each other', () => {
    const result = compareModels([modelA, modelB, modelC]);
    for (const row of result.rows) {
      expect(result.highlights[row.model.id]).toBeDefined();
      expect(row.highlights).toEqual(result.highlights[row.model.id]);
    }
  });
});

// ---------------------------------------------------------------------------
// findSharedStrengths / findSharedWeaknesses
// ---------------------------------------------------------------------------

describe('findSharedStrengths', () => {
  it('returns empty array for empty input', () => {
    expect(findSharedStrengths([])).toEqual([]);
  });

  it('returns all strengths of a single model', () => {
    const result = findSharedStrengths([modelA]);
    expect(result).toEqual(modelA.strengths);
  });

  it('returns strengths shared across all models (substring match)', () => {
    const result = findSharedStrengths([modelA, modelB]);
    // Both have "Fast inference"
    expect(result.some((s) => s.toLowerCase().includes('fast inference'))).toBe(true);
  });

  it('returns empty when no strengths overlap', () => {
    const result = findSharedStrengths([modelA, modelC]);
    // modelA: ['Great reasoning', 'Fast inference'], modelC: ['Open weights']
    expect(result).toEqual([]);
  });
});

describe('findSharedWeaknesses', () => {
  it('returns empty array for empty input', () => {
    expect(findSharedWeaknesses([])).toEqual([]);
  });

  it('returns all weaknesses of a single model', () => {
    const result = findSharedWeaknesses([modelA]);
    expect(result).toEqual(modelA.weaknesses);
  });

  it('returns weaknesses shared across all models (substring match)', () => {
    const result = findSharedWeaknesses([modelA, modelB]);
    // Both have "Expensive"
    expect(result.some((w) => w.toLowerCase().includes('expensive'))).toBe(true);
  });

  it('returns empty when no weaknesses overlap', () => {
    const result = findSharedWeaknesses([modelA, modelC]);
    // modelA: ['Expensive'], modelC: ['Limited context']
    expect(result).toEqual([]);
  });
});
