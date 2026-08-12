// ---------------------------------------------------------------------------
// Model Comparison Logic
// ---------------------------------------------------------------------------
// Pure TypeScript — no React, no side effects.
// All comparison utilities live here; UI components import from this module.
// ---------------------------------------------------------------------------

import type { Model, Benchmarks } from './models'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single numeric field with its best/worst/current values across the set. */
export type NumericHighlight = {
  value: number | null
  isBest: boolean
  isWorst: boolean
}

/** Per-model highlights for numeric fields. */
export type ModelHighlights = {
  contextWindow: NumericHighlight
  inputPrice: NumericHighlight
  outputPrice: NumericHighlight
  mmlu: NumericHighlight
  humaneval: NumericHighlight
  mt_bench: NumericHighlight
}

/** Differences computed across all compared models. */
export type DifferenceHighlights = Record<string, ModelHighlights>

/** A flat row used by the comparison table. */
export type ComparisonRow = {
  model: Model
  highlights: ModelHighlights
}

/** The full comparison payload returned by compareModels(). */
export type ComparisonData = {
  models: Model[]
  rows: ComparisonRow[]
  highlights: DifferenceHighlights
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type NumericExtractor = (m: Model) => number | null

function buildNumericHighlight(
  models: Model[],
  extractor: NumericExtractor,
  lowerIsBetter: boolean
): Map<string, NumericHighlight> {
  const values = models.map((m) => ({ id: m.id, value: extractor(m) }))
  const nonNull = values.filter((v): v is { id: string; value: number } => v.value !== null)

  let bestValue: number | null = null
  let worstValue: number | null = null

  if (nonNull.length > 0) {
    const nums = nonNull.map((v) => v.value)
    bestValue = lowerIsBetter ? Math.min(...nums) : Math.max(...nums)
    worstValue = lowerIsBetter ? Math.max(...nums) : Math.min(...nums)
  }

  const result = new Map<string, NumericHighlight>()
  for (const { id, value } of values) {
    result.set(id, {
      value,
      isBest: value !== null && value === bestValue,
      isWorst: value !== null && value === worstValue && nonNull.length > 1,
    })
  }
  return result
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate per-field best/worst highlights across a set of models.
 * Returns a map of model ID → ModelHighlights.
 */
export function calculateDifferences(models: Model[]): DifferenceHighlights {
  if (models.length === 0) return {}

  const contextMap = buildNumericHighlight(models, (m) => m.context_window, false)
  const inputMap = buildNumericHighlight(models, (m) => m.pricing.input, true)
  const outputMap = buildNumericHighlight(models, (m) => m.pricing.output, true)
  const mmluMap = buildNumericHighlight(models, (m) => m.benchmarks.mmlu, false)
  const humaMap = buildNumericHighlight(models, (m) => m.benchmarks.humaneval, false)
  const mtMap = buildNumericHighlight(models, (m) => m.benchmarks.mt_bench, false)

  const result: DifferenceHighlights = {}
  for (const model of models) {
    result[model.id] = {
      contextWindow: contextMap.get(model.id)!,
      inputPrice: inputMap.get(model.id)!,
      outputPrice: outputMap.get(model.id)!,
      mmlu: mmluMap.get(model.id)!,
      humaneval: humaMap.get(model.id)!,
      mt_bench: mtMap.get(model.id)!,
    }
  }
  return result
}

/**
 * Normalise a list of models into ComparisonRow[] for table rendering.
 * Each row carries the model and its pre-computed highlights.
 */
export function normalizeForComparison(models: Model[]): ComparisonRow[] {
  const highlights = calculateDifferences(models)
  return models.map((model) => ({
    model,
    highlights: highlights[model.id],
  }))
}

/**
 * Orchestrate a full comparison for the given model list.
 * Returns ComparisonData with models, rows, and highlights.
 */
export function compareModels(models: Model[]): ComparisonData {
  const rows = normalizeForComparison(models)
  const highlights = calculateDifferences(models)
  return { models, rows, highlights }
}

// ---------------------------------------------------------------------------
// Shared strengths/weaknesses overlap helpers
// ---------------------------------------------------------------------------

/**
 * Return the set of strengths that appear in ALL provided models
 * (case-insensitive substring match).
 */
export function findSharedStrengths(models: Model[]): string[] {
  if (models.length === 0) return []
  const first = models[0].strengths
  return first.filter((s) =>
    models.every((m) =>
      m.strengths.some((ms) => ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase()))
    )
  )
}

/**
 * Return the set of weaknesses that appear in ALL provided models
 * (case-insensitive substring match).
 */
export function findSharedWeaknesses(models: Model[]): string[] {
  if (models.length === 0) return []
  const first = models[0].weaknesses
  return first.filter((w) =>
    models.every((m) =>
      m.weaknesses.some((mw) => mw.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(mw.toLowerCase()))
    )
  )
}

// ---------------------------------------------------------------------------
// Benchmark key metadata (shared with UI)
// ---------------------------------------------------------------------------

export type BenchmarkKey = keyof Benchmarks

export const BENCHMARK_LABELS: Record<BenchmarkKey, string> = {
  mmlu: 'MMLU',
  humaneval: 'HumanEval',
  mt_bench: 'MT-Bench',
}

export const BENCHMARK_MAX: Record<BenchmarkKey, number> = {
  mmlu: 100,
  humaneval: 100,
  mt_bench: 10,
}
