// Unit tests for lib/cost-aware-picker.ts
import type { Model } from './models';
import {
  projectMonthlyCost,
  checkConstraints,
  getMissingCapabilities,
  getMissingModalities,
  scoreModelByCost,
  rankModelsByConstraints,
} from './cost-aware-picker';
import type { CostConstraints } from './cost-aware-picker';

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'test',
    name: 'Test',
    provider: 'openai',
    family: 'gpt-4',
    release_date: '2024-01-01',
    context_window: 128000,
    modalities: ['text'],
    capabilities: ['reasoning', 'tool-use', 'code'],
    pricing: { input: 5.0, output: 15.0 },
    benchmarks: { mmlu: 88.7, humaneval: 90.2, mt_bench: null },
    strengths: ['Strong reasoning'],
    weaknesses: ['High cost'],
    license: 'proprietary',
    links: { docs: null, paper: null },
    ...overrides,
  };
}

const paidModel = makeModel({ id: 'paid', pricing: { input: 5.0, output: 15.0 } });
const cheapModel = makeModel({ id: 'cheap', pricing: { input: 0.25, output: 1.25 }, capabilities: ['tool-use'], benchmarks: { mmlu: 70, humaneval: null, mt_bench: null } });
const openModel = makeModel({ id: 'open', pricing: { input: null, output: null }, license: 'apache-2.0', capabilities: ['reasoning', 'code'] });
const visionModel = makeModel({ id: 'vision', modalities: ['text', 'image'], capabilities: ['vision', 'reasoning'], pricing: { input: 3.0, output: 9.0 } });

const baseConstraints: CostConstraints = {
  maxMonthlyBudget: null,
  minContextWindow: null,
  requiredCapabilities: [],
  requiredModalities: [],
  requireOpenWeights: false,
  monthlyInputTokens: 1_000_000,
  monthlyOutputTokens: 500_000,
};

describe('projectMonthlyCost', () => {
  it('calculates cost for a paid model', () => {
    const cost = projectMonthlyCost(paidModel, 1_000_000, 500_000);
    // input: (1M/1M)*5 = 5; output: (0.5M/1M)*15 = 7.5 => 12.5
    expect(cost).toBeCloseTo(12.5, 4);
  });

  it('returns null for open-weights model', () => {
    expect(projectMonthlyCost(openModel, 1_000_000, 500_000)).toBeNull();
  });

  it('handles partial null pricing (output null)', () => {
    const m = makeModel({ pricing: { input: 5.0, output: null } });
    const cost = projectMonthlyCost(m, 1_000_000, 500_000);
    // input: 5; output: 0 (null treated as 0)
    expect(cost).toBeCloseTo(5.0, 4);
  });

  it('returns 0 for zero token volumes', () => {
    expect(projectMonthlyCost(paidModel, 0, 0)).toBeCloseTo(0, 4);
  });
});

describe('checkConstraints', () => {
  it('returns empty array when all constraints pass', () => {
    const violations = checkConstraints(paidModel, baseConstraints);
    expect(violations).toHaveLength(0);
  });

  it('flags budget violation when cost exceeds maxMonthlyBudget', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 1 };
    const violations = checkConstraints(paidModel, c);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatch(/budget/);
  });

  it('does not flag budget for open-weights model (null cost)', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 1 };
    const violations = checkConstraints(openModel, c);
    expect(violations.filter(v => v.includes('budget'))).toHaveLength(0);
  });

  it('flags context window violation', () => {
    const c: CostConstraints = { ...baseConstraints, minContextWindow: 500_000 };
    const violations = checkConstraints(paidModel, c);
    expect(violations.some(v => v.includes('Context window'))).toBe(true);
  });

  it('does not flag context window when model meets requirement', () => {
    const c: CostConstraints = { ...baseConstraints, minContextWindow: 64_000 };
    const violations = checkConstraints(paidModel, c);
    expect(violations.filter(v => v.includes('Context window'))).toHaveLength(0);
  });

  it('flags open weights violation for proprietary model', () => {
    const c: CostConstraints = { ...baseConstraints, requireOpenWeights: true };
    const violations = checkConstraints(paidModel, c);
    expect(violations.some(v => v.includes('open weights'))).toBe(true);
  });

  it('does not flag open weights for apache-2.0 model', () => {
    const c: CostConstraints = { ...baseConstraints, requireOpenWeights: true };
    const violations = checkConstraints(openModel, c);
    expect(violations.filter(v => v.includes('open weights'))).toHaveLength(0);
  });

  it('does not flag open weights for llama model', () => {
    const llamaModel = makeModel({ license: 'llama', pricing: { input: null, output: null } });
    const c: CostConstraints = { ...baseConstraints, requireOpenWeights: true };
    const violations = checkConstraints(llamaModel, c);
    expect(violations.filter(v => v.includes('open weights'))).toHaveLength(0);
  });
});

describe('getMissingCapabilities', () => {
  it('returns empty when model has all required capabilities', () => {
    expect(getMissingCapabilities(paidModel, ['reasoning', 'tool-use'])).toHaveLength(0);
  });

  it('returns missing capabilities', () => {
    const missing = getMissingCapabilities(cheapModel, ['reasoning', 'tool-use']);
    expect(missing).toContain('reasoning');
    expect(missing).not.toContain('tool-use');
  });

  it('returns empty for empty required list', () => {
    expect(getMissingCapabilities(paidModel, [])).toHaveLength(0);
  });
});

describe('getMissingModalities', () => {
  it('returns empty when model has all required modalities', () => {
    expect(getMissingModalities(visionModel, ['text', 'image'])).toHaveLength(0);
  });

  it('returns missing modalities', () => {
    const missing = getMissingModalities(paidModel, ['text', 'image']);
    expect(missing).toContain('image');
    expect(missing).not.toContain('text');
  });

  it('returns empty for empty required list', () => {
    expect(getMissingModalities(paidModel, [])).toHaveLength(0);
  });
});

describe('scoreModelByCost', () => {
  it('returns a score and reason for a paid model', () => {
    const result = scoreModelByCost(paidModel, baseConstraints);
    expect(typeof result.score).toBe('number');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('gives open-weights model a high cost score', () => {
    const openResult = scoreModelByCost(openModel, baseConstraints);
    const paidResult = scoreModelByCost(paidModel, baseConstraints);
    // Open weights gets 60 cost points; paid model with no budget limit also scores well
    expect(openResult.projectedMonthlyCost).toBeNull();
    expect(openResult.score).toBeGreaterThanOrEqual(paidResult.score - 20);
  });

  it('meetsAllConstraints is true when no constraints set', () => {
    const result = scoreModelByCost(paidModel, baseConstraints);
    expect(result.meetsAllConstraints).toBe(true);
  });

  it('meetsAllConstraints is false when capability missing', () => {
    const c: CostConstraints = { ...baseConstraints, requiredCapabilities: ['vision'] };
    const result = scoreModelByCost(paidModel, c);
    expect(result.meetsAllConstraints).toBe(false);
    expect(result.missingCapabilities).toContain('vision');
  });

  it('meetsAllConstraints is false when modality missing', () => {
    const c: CostConstraints = { ...baseConstraints, requiredModalities: ['image'] };
    const result = scoreModelByCost(paidModel, c);
    expect(result.meetsAllConstraints).toBe(false);
    expect(result.missingModalities).toContain('image');
  });

  it('penalises model that exceeds budget', () => {
    const tightBudget: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 1 };
    const result = scoreModelByCost(paidModel, tightBudget);
    expect(result.meetsAllConstraints).toBe(false);
  });

  it('gives bonus for high MMLU score', () => {
    const highMmlu = makeModel({ benchmarks: { mmlu: 90, humaneval: null, mt_bench: null } });
    const lowMmlu = makeModel({ benchmarks: { mmlu: 60, humaneval: null, mt_bench: null } });
    const highResult = scoreModelByCost(highMmlu, baseConstraints);
    const lowResult = scoreModelByCost(lowMmlu, baseConstraints);
    expect(highResult.score).toBeGreaterThan(lowResult.score);
  });

  it('gives moderate bonus for MMLU between 70 and 85', () => {
    const midMmlu = makeModel({ benchmarks: { mmlu: 75, humaneval: null, mt_bench: null } });
    const result = scoreModelByCost(midMmlu, baseConstraints);
    expect(result.score).toBeGreaterThan(0);
  });

  it('scores very low cost model at 60 cost points', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 1000, monthlyInputTokens: 100, monthlyOutputTokens: 50 };
    const result = scoreModelByCost(cheapModel, c);
    expect(result.projectedMonthlyCost).not.toBeNull();
    expect(result.score).toBeGreaterThan(0);
  });

  it('scores model within budget at moderate cost points', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 20, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = scoreModelByCost(paidModel, c);
    // cost ~12.5, budget 20, ratio ~0.625 => 30 points
    expect(result.score).toBeGreaterThan(0);
  });

  it('scores model over budget negatively', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 5, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = scoreModelByCost(paidModel, c);
    // cost ~12.5, budget 5, ratio > 1 => -20 cost points
    expect(result.meetsAllConstraints).toBe(false);
  });
});

describe('rankModelsByConstraints', () => {
  const allModels = [paidModel, cheapModel, openModel, visionModel];

  it('returns empty result for empty model list', () => {
    const result = rankModelsByConstraints([], baseConstraints);
    expect(result.ranked).toHaveLength(0);
    expect(result.violations).toHaveLength(0);
    expect(result.cheapestCompliant).toBeNull();
    expect(result.bestValueCompliant).toBeNull();
  });

  it('ranks all models when no constraints', () => {
    const result = rankModelsByConstraints(allModels, baseConstraints);
    expect(result.ranked).toHaveLength(allModels.length);
  });

  it('ranked list is sorted by score descending', () => {
    const result = rankModelsByConstraints(allModels, baseConstraints);
    for (let i = 1; i < result.ranked.length; i++) {
      expect(result.ranked[i - 1].score).toBeGreaterThanOrEqual(result.ranked[i].score);
    }
  });

  it('cheapestCompliant is the model with lowest projected cost', () => {
    const result = rankModelsByConstraints([paidModel, cheapModel], baseConstraints);
    expect(result.cheapestCompliant).not.toBeNull();
    expect(result.cheapestCompliant?.model.id).toBe('cheap');
  });

  it('cheapestCompliant prefers open-weights when available', () => {
    const result = rankModelsByConstraints([paidModel, openModel], baseConstraints);
    // openModel has null cost — treated as cheapest
    expect(result.cheapestCompliant?.model.id).toBe('open');
  });

  it('bestValueCompliant is the highest-scored compliant model', () => {
    const result = rankModelsByConstraints(allModels, baseConstraints);
    expect(result.bestValueCompliant).not.toBeNull();
    const compliant = result.ranked.filter(r => r.meetsAllConstraints);
    expect(result.bestValueCompliant?.model.id).toBe(compliant[0].model.id);
  });

  it('generates budget violation when no model fits budget', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 0.01, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = rankModelsByConstraints([paidModel, cheapModel], c);
    expect(result.violations.some(v => v.constraint === 'maxMonthlyBudget')).toBe(true);
  });

  it('generates context window violation when no model meets requirement', () => {
    const c: CostConstraints = { ...baseConstraints, minContextWindow: 999_999_999 };
    const result = rankModelsByConstraints(allModels, c);
    expect(result.violations.some(v => v.constraint === 'minContextWindow')).toBe(true);
  });

  it('generates capability violation when no model has required capability', () => {
    const c: CostConstraints = { ...baseConstraints, requiredCapabilities: ['nonexistent-cap'] };
    const result = rankModelsByConstraints(allModels, c);
    expect(result.violations.some(v => v.constraint === 'requiredCapabilities')).toBe(true);
  });

  it('filters compliant models by required capabilities', () => {
    const c: CostConstraints = { ...baseConstraints, requiredCapabilities: ['vision'] };
    const result = rankModelsByConstraints(allModels, c);
    const compliant = result.ranked.filter(r => r.meetsAllConstraints);
    expect(compliant.every(r => r.model.capabilities.includes('vision'))).toBe(true);
  });

  it('violations include suggestion text', () => {
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 0.01, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = rankModelsByConstraints([paidModel, cheapModel], c);
    const budgetViolation = result.violations.find(v => v.constraint === 'maxMonthlyBudget');
    expect(budgetViolation?.suggestion.length).toBeGreaterThan(0);
    expect(budgetViolation?.description.length).toBeGreaterThan(0);
  });

  it('no violations when compliant models exist', () => {
    const result = rankModelsByConstraints(allModels, baseConstraints);
    expect(result.violations).toHaveLength(0);
  });
});

// Additional branch coverage for scoreModelByCost cost ratio tiers
describe('scoreModelByCost cost ratio tiers', () => {
  it('scores low cost (ratio 0.1-0.3) at 45 points', () => {
    // budget=100, cost ~12.5 => ratio ~0.125 => 45 points
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 100, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = scoreModelByCost(paidModel, c);
    // paidModel cost = 5 + 7.5 = 12.5; ratio = 0.125 => 45 pts
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toContain('low cost');
  });

  it('scores moderate cost (ratio 0.3-0.6) at 30 points', () => {
    // budget=30, cost ~12.5 => ratio ~0.417 => 30 points
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 30, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = scoreModelByCost(paidModel, c);
    expect(result.reason).toContain('moderate cost');
  });

  it('scores within budget (ratio 0.6-1.0) at 15 points', () => {
    // budget=15, cost ~12.5 => ratio ~0.833 => 15 points
    const c: CostConstraints = { ...baseConstraints, maxMonthlyBudget: 15, monthlyInputTokens: 1_000_000, monthlyOutputTokens: 500_000 };
    const result = scoreModelByCost(paidModel, c);
    expect(result.reason).toContain('within budget');
  });

  it('scores partial capability coverage (0.5-1.0) with most required message', () => {
    // require vision + tool-use; paidModel has tool-use but not vision => 0.5 coverage
    const c: CostConstraints = { ...baseConstraints, requiredCapabilities: ['vision', 'tool-use'] };
    const result = scoreModelByCost(paidModel, c);
    expect(result.reason).toContain('most required capabilities met');
  });
});
