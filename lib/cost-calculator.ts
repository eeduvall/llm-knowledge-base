// ---------------------------------------------------------------------------
// Cost Calculator — Pure TypeScript, no React, no side effects.
// Provides cost-per-task, monthly spend projections, ROI analysis, and
// overspend detection for the Comparison Dashboard and Cost-Aware Picker.
// ---------------------------------------------------------------------------

import type { Model } from './models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Task types for cost estimation. */
export type TaskType =
  | 'document_analysis'
  | 'chat_turn'
  | 'code_review'
  | 'summarization'
  | 'classification'
  | 'custom';

/** Estimated token counts for a single task execution. */
export type TaskParams = {
  taskType: TaskType;
  /** Number of input tokens per task (defaults to preset if not provided). */
  inputTokens?: number;
  /** Number of output tokens per task (defaults to preset if not provided). */
  outputTokens?: number;
};

/** Result of a single-task cost calculation. */
export type TaskCostResult = {
  modelId: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  /** Cost in USD for one task execution. null if model has no pricing. */
  costPerTask: number | null;
  /** Cost in USD to process 1 million such tasks. null if no pricing. */
  costPerMillionTasks: number | null;
};

/** Monthly spend projection for a model. */
export type MonthlySpendResult = {
  modelId: string;
  modelName: string;
  tasksPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  /** Total monthly cost in USD. null if model has no pricing. */
  monthlySpend: number | null;
  /** Annual cost in USD. null if model has no pricing. */
  annualSpend: number | null;
};

/** ROI comparison between a baseline model and an alternative. */
export type ROIResult = {
  baselineModelId: string;
  baselineModelName: string;
  alternativeModelId: string;
  alternativeModelName: string;
  tasksPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  /** Monthly cost of baseline model. null if no pricing. */
  baselineMonthlySpend: number | null;
  /** Monthly cost of alternative model. null if no pricing. */
  alternativeMonthlySpend: number | null;
  /** Monthly savings (positive = alternative is cheaper). null if either has no pricing. */
  monthlySavings: number | null;
  /** Annual savings. null if either has no pricing. */
  annualSavings: number | null;
  /** Percentage savings (0–100). null if either has no pricing. */
  savingsPercent: number | null;
  /** Capabilities present in baseline but missing from alternative. */
  capabilityGaps: string[];
};

/** Overspend detection result. */
export type OverspendResult = {
  currentModelId: string;
  currentModelName: string;
  alternatives: OverspendAlternative[];
};

export type OverspendAlternative = {
  model: Model;
  monthlySavings: number | null;
  annualSavings: number | null;
  savingsPercent: number | null;
  capabilityGaps: string[];
};

// ---------------------------------------------------------------------------
// Default token estimates per task type (input, output)
// ---------------------------------------------------------------------------

export const DEFAULT_TASK_TOKENS: Record<TaskType, { input: number; output: number }> = {
  document_analysis: { input: 2000, output: 500 },
  chat_turn: { input: 300, output: 200 },
  code_review: { input: 1500, output: 800 },
  summarization: { input: 3000, output: 400 },
  classification: { input: 500, output: 50 },
  custom: { input: 1000, output: 500 },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute cost in USD for a given number of tokens at a per-1M-token price.
 * Returns null if price is null.
 */
function tokenCost(tokens: number, pricePerMillion: number | null): number | null {
  if (pricePerMillion === null) return null;
  return (tokens / 1_000_000) * pricePerMillion;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the cost of running a single task on a model.
 */
export function calculateCostPerTask(model: Model, params: TaskParams): TaskCostResult {
  const defaults = DEFAULT_TASK_TOKENS[params.taskType];
  const inputTokens = params.inputTokens ?? defaults.input;
  const outputTokens = params.outputTokens ?? defaults.output;

  const inputCost = tokenCost(inputTokens, model.pricing.input);
  const outputCost = tokenCost(outputTokens, model.pricing.output);

  let costPerTask: number | null = null;
  if (inputCost !== null && outputCost !== null) {
    costPerTask = inputCost + outputCost;
  }

  const costPerMillionTasks = costPerTask !== null ? costPerTask * 1_000_000 : null;

  return {
    modelId: model.id,
    modelName: model.name,
    inputTokens,
    outputTokens,
    costPerTask,
    costPerMillionTasks,
  };
}

/**
 * Project monthly and annual spend for a model given a task volume.
 */
export function projectMonthlySpend(
  model: Model,
  tasksPerMonth: number,
  avgInputTokens: number,
  avgOutputTokens: number,
): MonthlySpendResult {
  const inputCost = tokenCost(avgInputTokens * tasksPerMonth, model.pricing.input);
  const outputCost = tokenCost(avgOutputTokens * tasksPerMonth, model.pricing.output);

  let monthlySpend: number | null = null;
  if (inputCost !== null && outputCost !== null) {
    monthlySpend = inputCost + outputCost;
  }

  const annualSpend = monthlySpend !== null ? monthlySpend * 12 : null;

  return {
    modelId: model.id,
    modelName: model.name,
    tasksPerMonth,
    avgInputTokens,
    avgOutputTokens,
    monthlySpend,
    annualSpend,
  };
}

/**
 * Calculate the cost to process 1 million documents (using document_analysis defaults
 * unless overridden).
 */
export function costPerMillion(
  model: Model,
  inputTokensPerDoc?: number,
  outputTokensPerDoc?: number,
): number | null {
  const result = calculateCostPerTask(model, {
    taskType: 'document_analysis',
    inputTokens: inputTokensPerDoc,
    outputTokens: outputTokensPerDoc,
  });
  return result.costPerMillionTasks;
}

/**
 * Calculate the capability gap between two models.
 * Returns capabilities present in `from` but absent in `to`.
 */
export function capabilityGap(from: Model, to: Model): string[] {
  return from.capabilities.filter((cap) => !to.capabilities.includes(cap));
}

/**
 * Calculate ROI of switching from a baseline model to an alternative.
 */
export function calculateROI(
  baseline: Model,
  alternative: Model,
  tasksPerMonth: number,
  avgInputTokens: number,
  avgOutputTokens: number,
): ROIResult {
  const baselineSpend = projectMonthlySpend(
    baseline,
    tasksPerMonth,
    avgInputTokens,
    avgOutputTokens,
  );
  const alternativeSpend = projectMonthlySpend(
    alternative,
    tasksPerMonth,
    avgInputTokens,
    avgOutputTokens,
  );

  let monthlySavings: number | null = null;
  let annualSavings: number | null = null;
  let savingsPercent: number | null = null;

  if (baselineSpend.monthlySpend !== null && alternativeSpend.monthlySpend !== null) {
    monthlySavings = baselineSpend.monthlySpend - alternativeSpend.monthlySpend;
    annualSavings = monthlySavings * 12;
    savingsPercent =
      baselineSpend.monthlySpend > 0
        ? (monthlySavings / baselineSpend.monthlySpend) * 100
        : null;
  }

  return {
    baselineModelId: baseline.id,
    baselineModelName: baseline.name,
    alternativeModelId: alternative.id,
    alternativeModelName: alternative.name,
    tasksPerMonth,
    avgInputTokens,
    avgOutputTokens,
    baselineMonthlySpend: baselineSpend.monthlySpend,
    alternativeMonthlySpend: alternativeSpend.monthlySpend,
    monthlySavings,
    annualSavings,
    savingsPercent,
    capabilityGaps: capabilityGap(baseline, alternative),
  };
}

/**
 * Calculate savings when switching from one model to another.
 * Convenience wrapper around calculateROI that returns just the savings figures.
 */
export function calculateSavings(
  currentModel: Model,
  alternativeModel: Model,
  tasksPerMonth: number,
  avgInputTokens: number,
  avgOutputTokens: number,
): { monthlySavings: number | null; annualSavings: number | null; savingsPercent: number | null } {
  const roi = calculateROI(
    currentModel,
    alternativeModel,
    tasksPerMonth,
    avgInputTokens,
    avgOutputTokens,
  );
  return {
    monthlySavings: roi.monthlySavings,
    annualSavings: roi.annualSavings,
    savingsPercent: roi.savingsPercent,
  };
}

/**
 * Detect overspend: given a current model and a list of candidates, return
 * cheaper alternatives that still meet the user's minimum capability requirements.
 *
 * @param currentModel - The model currently in use
 * @param candidates - All models to consider as alternatives
 * @param tasksPerMonth - Monthly task volume
 * @param avgInputTokens - Average input tokens per task
 * @param avgOutputTokens - Average output tokens per task
 * @param requiredCapabilities - Capabilities that must be present in any alternative
 */
export function detectOverspend(
  currentModel: Model,
  candidates: Model[],
  tasksPerMonth: number,
  avgInputTokens: number,
  avgOutputTokens: number,
  requiredCapabilities: string[] = [],
): OverspendResult {
  const currentSpend = projectMonthlySpend(
    currentModel,
    tasksPerMonth,
    avgInputTokens,
    avgOutputTokens,
  );

  const alternatives: OverspendAlternative[] = candidates
    .filter((m) => m.id !== currentModel.id)
    // Must have all required capabilities
    .filter((m) => requiredCapabilities.every((cap) => m.capabilities.includes(cap)))
    // Only include models that are cheaper (or free/open-weights)
    .filter((m) => {
      if (currentSpend.monthlySpend === null) return false;
      const altSpend = projectMonthlySpend(m, tasksPerMonth, avgInputTokens, avgOutputTokens);
      // Open-weights models (null pricing) are always cheaper than paid models
      if (altSpend.monthlySpend === null && m.pricing.input === null) return true;
      if (altSpend.monthlySpend === null) return false;
      return altSpend.monthlySpend < currentSpend.monthlySpend;
    })
    .map((m) => {
      const altSpend = projectMonthlySpend(m, tasksPerMonth, avgInputTokens, avgOutputTokens);
      let monthlySavings: number | null = null;
      let annualSavings: number | null = null;
      let savingsPercent: number | null = null;

      if (currentSpend.monthlySpend !== null && altSpend.monthlySpend !== null) {
        monthlySavings = currentSpend.monthlySpend - altSpend.monthlySpend;
        annualSavings = monthlySavings * 12;
        savingsPercent =
          currentSpend.monthlySpend > 0
            ? (monthlySavings / currentSpend.monthlySpend) * 100
            : null;
      } else if (currentSpend.monthlySpend !== null && m.pricing.input === null) {
        // Open-weights: savings = full current spend (infra costs aside)
        monthlySavings = currentSpend.monthlySpend;
        annualSavings = monthlySavings * 12;
        savingsPercent = 100;
      }

      return {
        model: m,
        monthlySavings,
        annualSavings,
        savingsPercent,
        capabilityGaps: capabilityGap(currentModel, m),
      };
    })
    // Sort by savings descending
    .sort((a, b) => {
      const sa = a.monthlySavings ?? 0;
      const sb = b.monthlySavings ?? 0;
      return sb - sa;
    });

  return {
    currentModelId: currentModel.id,
    currentModelName: currentModel.name,
    alternatives,
  };
}
