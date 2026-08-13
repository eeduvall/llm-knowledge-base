/**
 * lib/cost-aware-picker.ts
 *
 * Pure logic for the Cost-Aware Picker Flow — no React, no side effects.
 * Scores and ranks models by cost first, then capability, then benchmark quality.
 *
 * All functions are pure and fully testable in Jest without mocking.
 */
import type { Model } from './models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CostConstraints = {
  /** Maximum monthly spend in USD (null = no limit) */
  maxMonthlyBudget: number | null;
  /** Minimum context window in tokens (null = no requirement) */
  minContextWindow: number | null;
  /** Required capabilities — model must have ALL of these */
  requiredCapabilities: string[];
  /** Required modalities — model must support ALL of these */
  requiredModalities: string[];
  /** Whether open weights are required */
  requireOpenWeights: boolean;
  /** Estimated monthly token volume (input tokens) for cost projection */
  monthlyInputTokens: number;
  /** Estimated monthly token volume (output tokens) for cost projection */
  monthlyOutputTokens: number;
};

export type CostScoredModel = {
  model: Model;
  /** Projected monthly cost in USD (null for open-weights models) */
  projectedMonthlyCost: number | null;
  /** Composite score — higher is better */
  score: number;
  /** Human-readable explanation */
  reason: string;
  /** Capabilities the user asked for that this model lacks */
  missingCapabilities: string[];
  /** Modalities the user asked for that this model lacks */
  missingModalities: string[];
  /** Whether this model meets ALL hard constraints */
  meetsAllConstraints: boolean;
};

export type ConstraintViolation = {
  constraint: string;
  description: string;
  /** Suggested relaxation to unlock more models */
  suggestion: string;
};

export type CostPickerResult = {
  ranked: CostScoredModel[];
  violations: ConstraintViolation[];
  cheapestCompliant: CostScoredModel | null;
  bestValueCompliant: CostScoredModel | null;
};

// ---------------------------------------------------------------------------
// Cost projection helpers
// ---------------------------------------------------------------------------

/**
 * Project the monthly cost for a model given token volumes.
 * Returns null for open-weights models (no per-token pricing).
 */
export function projectMonthlyCost(
  model: Model,
  monthlyInputTokens: number,
  monthlyOutputTokens: number,
): number | null {
  if (model.pricing.input === null && model.pricing.output === null) return null;

  const inputCost = ((model.pricing.input ?? 0) * monthlyInputTokens) / 1_000_000;
  const outputCost = ((model.pricing.output ?? 0) * monthlyOutputTokens) / 1_000_000;
  return inputCost + outputCost;
}

// ---------------------------------------------------------------------------
// Constraint checking
// ---------------------------------------------------------------------------

/**
 * Check whether a model meets all hard constraints.
 * Returns an array of violation descriptions (empty = all constraints met).
 */
export function checkConstraints(model: Model, constraints: CostConstraints): string[] {
  const violations: string[] = [];

  // Budget constraint
  if (constraints.maxMonthlyBudget !== null) {
    const cost = projectMonthlyCost(
      model,
      constraints.monthlyInputTokens,
      constraints.monthlyOutputTokens,
    );
    if (cost !== null && cost > constraints.maxMonthlyBudget) {
      violations.push(
        `Projected cost $${cost.toFixed(2)}/mo exceeds budget $${constraints.maxMonthlyBudget}/mo`,
      );
    }
  }

  // Context window constraint
  if (
    constraints.minContextWindow !== null &&
    model.context_window < constraints.minContextWindow
  ) {
    violations.push(
      `Context window ${model.context_window.toLocaleString()} < required ${constraints.minContextWindow.toLocaleString()}`,
    );
  }

  // Open weights constraint
  if (constraints.requireOpenWeights) {
    const openLicenses = new Set(['apache-2.0', 'mit', 'llama']);
    if (!openLicenses.has(model.license)) {
      violations.push(`License "${model.license}" is not open weights`);
    }
  }

  return violations;
}

/**
 * Return capabilities the user requires that this model lacks.
 */
export function getMissingCapabilities(model: Model, required: string[]): string[] {
  return required.filter((cap) => !model.capabilities.includes(cap));
}

/**
 * Return modalities the user requires that this model lacks.
 */
export function getMissingModalities(model: Model, required: string[]): string[] {
  return required.filter((mod) => !model.modalities.includes(mod as never));
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score a single model against cost constraints.
 * Cost is the primary axis; capability coverage and benchmark quality are secondary.
 */
export function scoreModelByCost(model: Model, constraints: CostConstraints): CostScoredModel {
  const projectedMonthlyCost = projectMonthlyCost(
    model,
    constraints.monthlyInputTokens,
    constraints.monthlyOutputTokens,
  );

  const hardViolations = checkConstraints(model, constraints);
  const missingCapabilities = getMissingCapabilities(model, constraints.requiredCapabilities);
  const missingModalities = getMissingModalities(model, constraints.requiredModalities);
  const meetsAllConstraints =
    hardViolations.length === 0 &&
    missingCapabilities.length === 0 &&
    missingModalities.length === 0;

  let score = 0;
  const reasons: string[] = [];

  // --- Primary axis: cost efficiency ---
  if (projectedMonthlyCost === null) {
    // Open-weights: free to run (ignoring infra cost)
    score += 60;
    reasons.push('open weights — no per-token cost');
  } else {
    // Score inversely proportional to cost; cap at 60 points
    const maxBudget = constraints.maxMonthlyBudget ?? 500;
    const costRatio = projectedMonthlyCost / maxBudget;
    if (costRatio <= 0.1) {
      score += 60;
      reasons.push(`very low cost ($${projectedMonthlyCost.toFixed(2)}/mo)`);
    } else if (costRatio <= 0.3) {
      score += 45;
      reasons.push(`low cost ($${projectedMonthlyCost.toFixed(2)}/mo)`);
    } else if (costRatio <= 0.6) {
      score += 30;
      reasons.push(`moderate cost ($${projectedMonthlyCost.toFixed(2)}/mo)`);
    } else if (costRatio <= 1.0) {
      score += 15;
      reasons.push(`within budget ($${projectedMonthlyCost.toFixed(2)}/mo)`);
    } else {
      score -= 20;
      // Over budget — penalise
    }
  }

  // --- Secondary axis: capability coverage ---
  const totalRequired =
    constraints.requiredCapabilities.length + constraints.requiredModalities.length;
  const totalMissing = missingCapabilities.length + missingModalities.length;
  if (totalRequired > 0) {
    const coverageRatio = (totalRequired - totalMissing) / totalRequired;
    score += Math.round(coverageRatio * 30);
    if (coverageRatio === 1) reasons.push('all required capabilities met');
    else if (coverageRatio >= 0.5) reasons.push('most required capabilities met');
  } else {
    score += 30; // No capability requirements — full points
  }

  // --- Tertiary axis: benchmark quality ---
  const mmlu = model.benchmarks.mmlu;
  if (mmlu !== null) {
    if (mmlu >= 85) {
      score += 10;
      reasons.push(`strong MMLU score (${mmlu})`);
    } else if (mmlu >= 70) {
      score += 5;
    }
  }

  // Penalise hard constraint violations
  if (hardViolations.length > 0) score -= hardViolations.length * 15;

  const reason = reasons.slice(0, 3).join('; ') || 'General-purpose model within your constraints.';

  return {
    model,
    projectedMonthlyCost,
    score,
    reason,
    missingCapabilities,
    missingModalities,
    meetsAllConstraints,
  };
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/**
 * Rank all models by cost-first scoring and identify constraint violations.
 */
export function rankModelsByConstraints(
  models: Model[],
  constraints: CostConstraints,
): CostPickerResult {
  if (models.length === 0) {
    return { ranked: [], violations: [], cheapestCompliant: null, bestValueCompliant: null };
  }

  const scored = models
    .map((m) => scoreModelByCost(m, constraints))
    .sort((a, b) => b.score - a.score);

  const compliant = scored.filter((s) => s.meetsAllConstraints);

  // Detect which constraints are blocking all models
  const violations: ConstraintViolation[] = [];

  if (compliant.length === 0) {
    // Budget too tight?
    if (constraints.maxMonthlyBudget !== null) {
      const cheapestPriced = scored
        .filter((s) => s.projectedMonthlyCost !== null)
        .sort((a, b) => (a.projectedMonthlyCost ?? 0) - (b.projectedMonthlyCost ?? 0))[0];

      if (cheapestPriced) {
        violations.push({
          constraint: 'maxMonthlyBudget',
          description: `No model fits within $${constraints.maxMonthlyBudget}/mo budget`,
          suggestion: `Increase budget to $${Math.ceil((cheapestPriced.projectedMonthlyCost ?? 0) * 1.1)}/mo to unlock ${cheapestPriced.model.name}`,
        });
      }
    }

    // Context window too large?
    if (constraints.minContextWindow !== null) {
      const maxAvailable = Math.max(...models.map((m) => m.context_window));
      if (maxAvailable < constraints.minContextWindow) {
        violations.push({
          constraint: 'minContextWindow',
          description: `No model has a ${constraints.minContextWindow.toLocaleString()}-token context window`,
          suggestion: `Reduce requirement to ${maxAvailable.toLocaleString()} tokens (largest available)`,
        });
      }
    }

    // Missing capabilities?
    if (constraints.requiredCapabilities.length > 0) {
      const allCaps = new Set(models.flatMap((m) => m.capabilities));
      const unavailable = constraints.requiredCapabilities.filter((c) => !allCaps.has(c));
      if (unavailable.length > 0) {
        violations.push({
          constraint: 'requiredCapabilities',
          description: `No model supports: ${unavailable.join(', ')}`,
          suggestion: `Remove "${unavailable[0]}" from required capabilities`,
        });
      }
    }
  }

  // Cheapest compliant model (lowest projected cost, or first open-weights)
  const cheapestCompliant =
    compliant.length > 0
      ? compliant.reduce((best, cur) => {
          if (best.projectedMonthlyCost === null) return best;
          if (cur.projectedMonthlyCost === null) return cur;
          return cur.projectedMonthlyCost < best.projectedMonthlyCost ? cur : best;
        })
      : null;

  // Best value = highest score among compliant models
  const bestValueCompliant = compliant.length > 0 ? compliant[0] : null;

  return { ranked: scored, violations, cheapestCompliant, bestValueCompliant };
}
