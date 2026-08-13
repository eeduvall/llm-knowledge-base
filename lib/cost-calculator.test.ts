// ---------------------------------------------------------------------------
// Unit tests for lib/cost-calculator.ts
// ---------------------------------------------------------------------------

import type { Model } from './models';
import {
  calculateCostPerTask,
  projectMonthlySpend,
  costPerMillion,
  capabilityGap,
  calculateROI,
  calculateSavings,
  detectOverspend,
  DEFAULT_TASK_TOKENS,
} from './cost-calculator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'test-model',
    name: 'Test Model',
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

const paidModel = makeModel({
  id: 'paid',
  name: 'Paid Model',
  pricing: { input: 5.0, output: 15.0 },
});
const cheapModel = makeModel({
  id: 'cheap',
  name: 'Cheap Model',
  pricing: { input: 0.25, output: 1.25 },
  capabilities: ['tool-use'],
});
const openModel = makeModel({
  id: 'open',
  name: 'Open Model',
  pricing: { input: null, output: null },
  capabilities: ['reasoning', 'code'],
  license: 'llama',
});

// ---------------------------------------------------------------------------
// calculateCostPerTask
// ---------------------------------------------------------------------------

describe('calculateCostPerTask', () => {
  it('uses default token counts for a known task type', () => {
    const result = calculateCostPerTask(paidModel, { taskType: 'chat_turn' });
    const { input, output } = DEFAULT_TASK_TOKENS.chat_turn;
    expect(result.inputTokens).toBe(input);
    expect(result.outputTokens).toBe(output);
  });

  it('overrides token counts when provided', () => {
    const result = calculateCostPerTask(paidModel, {
      taskType: 'custom',
      inputTokens: 1000,
      outputTokens: 200,
    });
    expect(result.inputTokens).toBe(1000);
    expect(result.outputTokens).toBe(200);
  });

  it('calculates correct cost for a paid model', () => {
    // 1000 input tokens at $5/M = $0.005; 200 output at $15/M = $0.003 → $0.008
    const result = calculateCostPerTask(paidModel, {
      taskType: 'custom',
      inputTokens: 1000,
      outputTokens: 200,
    });
    expect(result.costPerTask).toBeCloseTo(0.008, 6);
  });

  it('returns null cost for open-weights model', () => {
    const result = calculateCostPerTask(openModel, { taskType: 'chat_turn' });
    expect(result.costPerTask).toBeNull();
    expect(result.costPerMillionTasks).toBeNull();
  });

  it('costPerMillionTasks is costPerTask * 1_000_000', () => {
    const result = calculateCostPerTask(paidModel, {
      taskType: 'custom',
      inputTokens: 1000,
      outputTokens: 200,
    });
    if (result.costPerTask !== null && result.costPerMillionTasks !== null) {
      expect(result.costPerMillionTasks).toBeCloseTo(result.costPerTask * 1_000_000, 2);
    }
  });

  it('includes modelId and modelName in result', () => {
    const result = calculateCostPerTask(paidModel, { taskType: 'chat_turn' });
    expect(result.modelId).toBe('paid');
    expect(result.modelName).toBe('Paid Model');
  });
});

// ---------------------------------------------------------------------------
// projectMonthlySpend
// ---------------------------------------------------------------------------

describe('projectMonthlySpend', () => {
  it('calculates monthly spend for a paid model', () => {
    // 10000 tasks/month, 300 input, 200 output
    // input: (300 * 10000 / 1M) * 5 = 15; output: (200 * 10000 / 1M) * 15 = 30 → $45
    const result = projectMonthlySpend(paidModel, 10000, 300, 200);
    expect(result.monthlySpend).toBeCloseTo(45, 4);
    expect(result.annualSpend).toBeCloseTo(540, 4);
  });

  it('returns null for open-weights model', () => {
    const result = projectMonthlySpend(openModel, 10000, 300, 200);
    expect(result.monthlySpend).toBeNull();
    expect(result.annualSpend).toBeNull();
  });

  it('annualSpend is monthlySpend * 12', () => {
    const result = projectMonthlySpend(cheapModel, 5000, 500, 100);
    if (result.monthlySpend !== null && result.annualSpend !== null) {
      expect(result.annualSpend).toBeCloseTo(result.monthlySpend * 12, 4);
    }
  });

  it('includes task volume in result', () => {
    const result = projectMonthlySpend(paidModel, 99999, 100, 50);
    expect(result.tasksPerMonth).toBe(99999);
    expect(result.avgInputTokens).toBe(100);
    expect(result.avgOutputTokens).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// costPerMillion
// ---------------------------------------------------------------------------

describe('costPerMillion', () => {
  it('returns cost to process 1M documents for a paid model', () => {
    const result = costPerMillion(paidModel);
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
  });

  it('returns null for open-weights model', () => {
    expect(costPerMillion(openModel)).toBeNull();
  });

  it('accepts custom token overrides', () => {
    const defaultResult = costPerMillion(paidModel);
    const customResult = costPerMillion(paidModel, 100, 50);
    // Custom with fewer tokens should be cheaper
    expect(customResult).not.toBeNull();
    expect(defaultResult).not.toBeNull();
    if (customResult !== null && defaultResult !== null) {
      expect(customResult).toBeLessThan(defaultResult);
    }
  });
});

// ---------------------------------------------------------------------------
// capabilityGap
// ---------------------------------------------------------------------------

describe('capabilityGap', () => {
  it('returns capabilities in baseline missing from alternative', () => {
    const gaps = capabilityGap(paidModel, cheapModel);
    // paidModel has reasoning, tool-use, code; cheapModel has only tool-use
    expect(gaps).toContain('reasoning');
    expect(gaps).toContain('code');
    expect(gaps).not.toContain('tool-use');
  });

  it('returns empty array when alternative has all baseline capabilities', () => {
    const gaps = capabilityGap(cheapModel, paidModel);
    expect(gaps).toHaveLength(0);
  });

  it('returns empty array when models have identical capabilities', () => {
    const gaps = capabilityGap(paidModel, paidModel);
    expect(gaps).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// calculateROI
// ---------------------------------------------------------------------------

describe('calculateROI', () => {
  it('calculates positive savings when alternative is cheaper', () => {
    const roi = calculateROI(paidModel, cheapModel, 10000, 300, 200);
    expect(roi.monthlySavings).not.toBeNull();
    if (roi.monthlySavings !== null) {
      expect(roi.monthlySavings).toBeGreaterThan(0);
    }
  });

  it('calculates negative savings when alternative is more expensive', () => {
    const roi = calculateROI(cheapModel, paidModel, 10000, 300, 200);
    expect(roi.monthlySavings).not.toBeNull();
    if (roi.monthlySavings !== null) {
      expect(roi.monthlySavings).toBeLessThan(0);
    }
  });

  it('returns null savings when either model has no pricing', () => {
    const roi = calculateROI(paidModel, openModel, 10000, 300, 200);
    // open model has null pricing → savings are non-null (full current spend)
    // Actually per implementation: if baseline has pricing and alt is open-weights,
    // monthlySavings is null from calculateROI (both must be non-null)
    expect(roi.baselineMonthlySpend).not.toBeNull();
    expect(roi.alternativeMonthlySpend).toBeNull();
    expect(roi.monthlySavings).toBeNull();
  });

  it('includes capability gaps in result', () => {
    const roi = calculateROI(paidModel, cheapModel, 10000, 300, 200);
    expect(roi.capabilityGaps).toContain('reasoning');
  });

  it('savingsPercent is between 0 and 100 for cheaper alternative', () => {
    const roi = calculateROI(paidModel, cheapModel, 10000, 300, 200);
    if (roi.savingsPercent !== null) {
      expect(roi.savingsPercent).toBeGreaterThan(0);
      expect(roi.savingsPercent).toBeLessThanOrEqual(100);
    }
  });

  it('annualSavings is monthlySavings * 12', () => {
    const roi = calculateROI(paidModel, cheapModel, 10000, 300, 200);
    if (roi.monthlySavings !== null && roi.annualSavings !== null) {
      expect(roi.annualSavings).toBeCloseTo(roi.monthlySavings * 12, 4);
    }
  });
});

// ---------------------------------------------------------------------------
// calculateSavings
// ---------------------------------------------------------------------------

describe('calculateSavings', () => {
  it('returns same values as calculateROI savings fields', () => {
    const roi = calculateROI(paidModel, cheapModel, 10000, 300, 200);
    const savings = calculateSavings(paidModel, cheapModel, 10000, 300, 200);
    expect(savings.monthlySavings).toBeCloseTo(roi.monthlySavings ?? 0, 4);
    expect(savings.annualSavings).toBeCloseTo(roi.annualSavings ?? 0, 4);
    expect(savings.savingsPercent).toBeCloseTo(roi.savingsPercent ?? 0, 4);
  });
});

// ---------------------------------------------------------------------------
// detectOverspend
// ---------------------------------------------------------------------------

describe('detectOverspend', () => {
  const allModels = [paidModel, cheapModel, openModel];

  it('excludes the current model from alternatives', () => {
    const result = detectOverspend(paidModel, allModels, 10000, 300, 200);
    const ids = result.alternatives.map((a) => a.model.id);
    expect(ids).not.toContain('paid');
  });

  it('only includes models that are cheaper', () => {
    const result = detectOverspend(paidModel, allModels, 10000, 300, 200);
    // cheapModel and openModel should appear; no more expensive models
    const ids = result.alternatives.map((a) => a.model.id);
    expect(ids).toContain('cheap');
  });

  it('filters by required capabilities', () => {
    // Require 'reasoning' — cheapModel lacks it, openModel has it
    const result = detectOverspend(paidModel, allModels, 10000, 300, 200, ['reasoning']);
    const ids = result.alternatives.map((a) => a.model.id);
    expect(ids).not.toContain('cheap');
    // openModel has reasoning but is open-weights (savings = full current spend)
    expect(ids).toContain('open');
  });

  it('sorts alternatives by savings descending', () => {
    const result = detectOverspend(paidModel, allModels, 10000, 300, 200);
    const savings = result.alternatives.map((a) => a.monthlySavings ?? 0);
    for (let i = 1; i < savings.length; i++) {
      expect(savings[i - 1]).toBeGreaterThanOrEqual(savings[i]);
    }
  });

  it('returns empty alternatives when current model has no pricing', () => {
    const result = detectOverspend(openModel, allModels, 10000, 300, 200);
    expect(result.alternatives).toHaveLength(0);
  });

  it('includes capability gaps for each alternative', () => {
    const result = detectOverspend(paidModel, allModels, 10000, 300, 200);
    const cheapAlt = result.alternatives.find((a) => a.model.id === 'cheap');
    expect(cheapAlt?.capabilityGaps).toContain('reasoning');
  });

  it('sets savingsPercent to 100 for open-weights alternatives', () => {
    const result = detectOverspend(paidModel, allModels, 10000, 300, 200);
    const openAlt = result.alternatives.find((a) => a.model.id === 'open');
    expect(openAlt?.savingsPercent).toBe(100);
  });
});
