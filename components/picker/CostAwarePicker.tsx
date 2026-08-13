'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { Model } from '@/lib/models';
import { rankModelsByConstraints, scoreModelByCost } from '@/lib/cost-aware-picker';
import type {
  CostConstraints,
  CostScoredModel,
  ConstraintViolation,
} from '@/lib/cost-aware-picker';
import { SavingsCard } from '@/components/picker/SavingsCard';

type Props = {
  models: Model[];
};

const ALL_CAPABILITIES = [
  'reasoning',
  'vision',
  'tool-use',
  'structured-output',
  'code',
  'long-context',
  'fine-tuning',
];

const ALL_MODALITIES = ['text', 'image', 'audio', 'video'];

const CONTEXT_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '8K+', value: 8_000 },
  { label: '32K+', value: 32_000 },
  { label: '128K+', value: 128_000 },
  { label: '200K+', value: 200_000 },
];

function formatCost(cost: number | null): string {
  if (cost === null) return 'Open weights';
  if (cost >= 1_000) return `$${(cost / 1_000).toFixed(1)}K/mo`;
  return `$${cost.toFixed(2)}/mo`;
}

type ConstraintViolationCardProps = {
  violations: ConstraintViolation[];
};

function ConstraintViolationCard({ violations }: ConstraintViolationCardProps) {
  if (violations.length === 0) return null;
  return (
    <div
      className="mb-6 rounded-xl p-5"
      style={{
        background: 'rgba(255,107,157,0.06)',
        border: '1px solid rgba(255,107,157,0.25)',
      }}
    >
      <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
        ⚠ No models meet all your constraints
      </p>
      <ul className="flex flex-col gap-3">
        {violations.map((v) => (
          <li key={v.constraint}>
            <p className="text-sm" style={{ color: 'var(--color-text)' }}>
              {v.description}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              💡 {v.suggestion}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ResultCardProps = {
  result: CostScoredModel;
  rank: number;
  isCheapest: boolean;
  isBestValue: boolean;
};

function ResultCard({ result, rank, isCheapest, isBestValue }: ResultCardProps) {
  const {
    model,
    projectedMonthlyCost,
    score,
    reason,
    missingCapabilities,
    missingModalities,
    meetsAllConstraints,
  } = result;
  const badge = isBestValue ? 'Best Value' : isCheapest ? 'Cheapest' : null;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-5"
      style={{
        background: meetsAllConstraints ? 'rgba(108,99,255,0.06)' : 'var(--color-surface)',
        border: `1px solid ${meetsAllConstraints ? 'rgba(108,99,255,0.3)' : 'var(--color-border)'}`,
        opacity: meetsAllConstraints ? 1 : 0.65,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-xs"
            style={{ background: 'var(--color-panel-bg-alt)', color: 'var(--color-text-muted)' }}
          >
            {rank}
          </span>
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              {model.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              {model.provider} · {model.license}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {badge && (
            <span
              className="rounded px-2 py-0.5 text-xs font-medium"
              style={{
                background: isBestValue ? 'rgba(108,99,255,0.2)' : 'rgba(0,212,255,0.15)',
                color: isBestValue ? 'var(--color-primary)' : 'var(--color-secondary)',
              }}
            >
              {badge}
            </span>
          )}
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: 'var(--color-secondary)' }}
          >
            {formatCost(projectedMonthlyCost)}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
            Score: {score}
          </span>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {reason}
      </p>

      {(missingCapabilities.length > 0 || missingModalities.length > 0) && (
        <div>
          <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
            Missing:
          </p>
          <div className="flex flex-wrap gap-1">
            {[...missingCapabilities, ...missingModalities].map((item) => (
              <span
                key={item}
                className="rounded px-2 py-0.5 text-xs"
                style={{ background: 'rgba(255,107,157,0.12)', color: 'var(--color-accent)' }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-1 flex gap-2">
        <Link
          href={`/models/${model.id}`}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: 'var(--color-panel-bg-alt)', color: 'var(--color-primary)' }}
        >
          View profile
        </Link>
        <Link
          href={`/comparison?models=${model.id}`}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          Compare
        </Link>
      </div>
    </div>
  );
}

export function CostAwarePicker({ models }: Props) {
  const [maxMonthlyBudget, setMaxMonthlyBudget] = useState<string>('');
  const [minContextWindow, setMinContextWindow] = useState<number | null>(null);
  const [requiredCapabilities, setRequiredCapabilities] = useState<string[]>([]);
  const [requiredModalities, setRequiredModalities] = useState<string[]>([]);
  const [requireOpenWeights, setRequireOpenWeights] = useState(false);
  const [monthlyInputTokens, setMonthlyInputTokens] = useState<number>(1_000_000);
  const [monthlyOutputTokens, setMonthlyOutputTokens] = useState<number>(500_000);
  const [hasSearched, setHasSearched] = useState(false);

  const toggleCapability = useCallback((cap: string) => {
    setRequiredCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  }, []);

  const toggleModality = useCallback((mod: string) => {
    setRequiredModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod],
    );
  }, []);

  const constraints: CostConstraints = {
    maxMonthlyBudget: maxMonthlyBudget !== '' ? Number(maxMonthlyBudget) : null,
    minContextWindow,
    requiredCapabilities,
    requiredModalities,
    requireOpenWeights,
    monthlyInputTokens,
    monthlyOutputTokens,
  };

  const result = hasSearched ? rankModelsByConstraints(models, constraints) : null;

  const handleSearch = useCallback(() => {
    setHasSearched(true);
  }, []);

  const handleReset = useCallback(() => {
    setMaxMonthlyBudget('');
    setMinContextWindow(null);
    setRequiredCapabilities([]);
    setRequiredModalities([]);
    setRequireOpenWeights(false);
    setMonthlyInputTokens(1_000_000);
    setMonthlyOutputTokens(500_000);
    setHasSearched(false);
  }, []);

  // Baseline for savings comparison: most expensive compliant model
  const baselineForSavings =
    result && result.ranked.filter((r) => r.meetsAllConstraints).length > 1
      ? (result.ranked
          .filter((r) => r.meetsAllConstraints && r.projectedMonthlyCost !== null)
          .sort((a, b) => (b.projectedMonthlyCost ?? 0) - (a.projectedMonthlyCost ?? 0))[0] ?? null)
      : null;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      {/* Constraints form */}
      <div
        className="rounded-xl p-5 sm:p-6"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h2
          className="mb-5 text-sm font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Your Constraints
        </h2>

        <div className="flex flex-col gap-5">
          {/* Budget */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="max-budget"
              className="text-xs font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Max monthly budget (USD) — leave blank for no limit
            </label>
            <input
              id="max-budget"
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={maxMonthlyBudget}
              onChange={(e) => setMaxMonthlyBudget(e.target.value)}
              className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus-visible:ring-2"
              style={{
                background: 'var(--color-panel-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Token volumes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-tokens"
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Monthly input tokens
              </label>
              <input
                id="input-tokens"
                type="number"
                min={1}
                value={monthlyInputTokens}
                onChange={(e) => setMonthlyInputTokens(Math.max(1, Number(e.target.value)))}
                className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus-visible:ring-2"
                style={{
                  background: 'var(--color-panel-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="output-tokens"
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Monthly output tokens
              </label>
              <input
                id="output-tokens"
                type="number"
                min={1}
                value={monthlyOutputTokens}
                onChange={(e) => setMonthlyOutputTokens(Math.max(1, Number(e.target.value)))}
                className="rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus-visible:ring-2"
                style={{
                  background: 'var(--color-panel-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          {/* Context window */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Minimum context window
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMinContextWindow(opt.value)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background:
                      minContextWindow === opt.value
                        ? 'var(--color-primary)'
                        : 'var(--color-panel-bg)',
                    color:
                      minContextWindow === opt.value
                        ? 'var(--color-text)'
                        : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Required capabilities */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Required capabilities
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_CAPABILITIES.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => toggleCapability(cap)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: requiredCapabilities.includes(cap)
                      ? 'var(--color-primary)'
                      : 'var(--color-panel-bg)',
                    color: requiredCapabilities.includes(cap)
                      ? 'var(--color-text)'
                      : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {/* Required modalities */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Required modalities
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_MODALITIES.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => toggleModality(mod)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: requiredModalities.includes(mod)
                      ? 'var(--color-primary)'
                      : 'var(--color-panel-bg)',
                    color: requiredModalities.includes(mod)
                      ? 'var(--color-text)'
                      : 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          {/* Open weights toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={requireOpenWeights}
              onChange={(e) => setRequireOpenWeights(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Open weights only (Apache-2.0, MIT, Llama)
            </span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSearch}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text)' }}
            >
              Find cheapest model
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4">
          <ConstraintViolationCard violations={result.violations} />

          {result.ranked.length > 0 && (
            <>
              <h2
                className="text-sm font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {result.ranked.filter((r) => r.meetsAllConstraints).length} model
                {result.ranked.filter((r) => r.meetsAllConstraints).length !== 1 ? 's' : ''} meet
                {result.ranked.filter((r) => r.meetsAllConstraints).length === 1 ? 's' : ''} your
                constraints
              </h2>

              {result.ranked.map((r, idx) => (
                <ResultCard
                  key={r.model.id}
                  result={r}
                  rank={idx + 1}
                  isCheapest={result.cheapestCompliant?.model.id === r.model.id}
                  isBestValue={
                    result.bestValueCompliant?.model.id === r.model.id &&
                    result.cheapestCompliant?.model.id !== r.model.id
                  }
                />
              ))}

              {/* Savings comparison */}
              {baselineForSavings &&
                result.cheapestCompliant &&
                baselineForSavings.model.id !== result.cheapestCompliant.model.id && (
                  <div className="mt-2">
                    <h2
                      className="mb-3 text-sm font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Potential savings
                    </h2>
                    <SavingsCard
                      baseline={baselineForSavings}
                      alternative={result.cheapestCompliant}
                    />
                  </div>
                )}

              {/* Link to full comparison */}
              {result.ranked.filter((r) => r.meetsAllConstraints).length >= 2 && (
                <div className="pt-2 text-center">
                  <a
                    href={`/comparison?models=${result.ranked
                      .filter((r) => r.meetsAllConstraints)
                      .slice(0, 5)
                      .map((r) => r.model.id)
                      .join(',')}`}
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Compare compliant models side-by-side →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
