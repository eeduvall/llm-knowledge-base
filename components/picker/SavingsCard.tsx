'use client';

import type { CostScoredModel } from '@/lib/cost-aware-picker';

type Props = {
  baseline: CostScoredModel;
  alternative: CostScoredModel;
};

function formatCost(cost: number | null): string {
  if (cost === null) return 'Open weights';
  return `$${cost.toFixed(2)}/mo`;
}

export function SavingsCard({ baseline, alternative }: Props) {
  const baselineCost = baseline.projectedMonthlyCost;
  const altCost = alternative.projectedMonthlyCost;

  // Calculate savings
  let monthlySavings: number | null = null;
  let annualSavings: number | null = null;
  let savingsPct: number | null = null;

  if (baselineCost !== null && altCost !== null && altCost < baselineCost) {
    monthlySavings = baselineCost - altCost;
    annualSavings = monthlySavings * 12;
    savingsPct = (monthlySavings / baselineCost) * 100;
  } else if (baselineCost !== null && altCost === null) {
    // Alternative is open-weights — full savings
    monthlySavings = baselineCost;
    annualSavings = baselineCost * 12;
    savingsPct = 100;
  }

  const hasSavings = monthlySavings !== null && monthlySavings > 0;

  return (
    <div
      className="rounded-xl p-5 border flex flex-col gap-4"
      style={{
        backgroundColor: hasSavings ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
        borderColor: hasSavings ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono mb-1" style={{ color: 'var(--color-text-faint)' }}>
            Switch from
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {baseline.model.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatCost(baselineCost)}
          </p>
        </div>

        <div className="text-xl" aria-hidden="true">
          →
        </div>

        <div className="text-right">
          <p className="text-xs font-mono mb-1" style={{ color: 'var(--color-text-faint)' }}>
            Switch to
          </p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-secondary)' }}>
            {alternative.model.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatCost(altCost)}
          </p>
        </div>
      </div>

      {/* Savings figures */}
      {hasSavings && monthlySavings !== null && annualSavings !== null && (
        <div
          className="rounded-lg p-3 flex flex-wrap gap-4 justify-around"
          style={{ backgroundColor: 'rgba(0,212,255,0.08)' }}
        >
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>
              ${monthlySavings.toFixed(2)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              saved / month
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>
              ${annualSavings.toFixed(0)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
              saved / year
            </p>
          </div>
          {savingsPct !== null && (
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--color-secondary)' }}>
                {savingsPct.toFixed(0)}%
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                cost reduction
              </p>
            </div>
          )}
        </div>
      )}

      {/* No savings case */}
      {!hasSavings && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {altCost !== null && baselineCost !== null && altCost >= baselineCost
            ? `${alternative.model.name} costs $${(altCost - (baselineCost ?? 0)).toFixed(2)}/mo more than ${baseline.model.name}.`
            : 'Both models have open-weights pricing.'}
        </p>
      )}

      {/* Capability gaps */}
      {alternative.missingCapabilities.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-accent)' }}>
            ⚠ Capability trade-offs
          </p>
          <ul className="flex flex-wrap gap-1">
            {alternative.missingCapabilities.map((cap) => (
              <li
                key={cap}
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: 'rgba(255,107,157,0.12)',
                  color: 'var(--color-accent)',
                }}
              >
                {cap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
