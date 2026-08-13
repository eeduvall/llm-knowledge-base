'use client';

import type { Model } from '@/lib/models';
import { findSharedStrengths, findSharedWeaknesses } from '@/lib/comparison';

type Props = {
  models: Model[];
};

/** Map column count → responsive Tailwind grid class.
 *  Mobile-first: always starts at 1 column, then expands at sm/lg breakpoints.
 *  Max columns is 3 (enforced by the comparison page's 5-model limit and the
 *  3-column cap below). All values are static strings so Tailwind can include
 *  them in the purge-safe class list.
 */
const GRID_CLASS: Record<number, string> = {
  1: 'grid grid-cols-1 gap-4',
  2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
};

export function StrengthsWeaknessesDiff({ models }: Props) {
  if (models.length === 0) return null;

  const sharedStrengths = findSharedStrengths(models);
  const sharedWeaknesses = findSharedWeaknesses(models);
  const colCount = Math.min(models.length, 3) as 1 | 2 | 3;
  const gridClass = GRID_CLASS[colCount] ?? GRID_CLASS[3];

  return (
    <section aria-label="Strengths and weaknesses comparison">
      {/* Shared callouts */}
      {(sharedStrengths.length > 0 || sharedWeaknesses.length > 0) && (
        <div className="mb-6 flex flex-wrap gap-4">
          {sharedStrengths.length > 0 && (
            <div
              className="min-w-48 flex-1 rounded-xl p-4"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-secondary)',
              }}
            >
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-secondary)' }}
              >
                Shared Strengths
              </p>
              <ul className="flex flex-col gap-1">
                {sharedStrengths.map((s) => (
                  <li
                    key={s}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span style={{ color: 'var(--color-secondary)' }} aria-hidden="true">
                      ✓
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sharedWeaknesses.length > 0 && (
            <div
              className="min-w-48 flex-1 rounded-xl p-4"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-accent)',
              }}
            >
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-accent)' }}
              >
                Shared Weaknesses
              </p>
              <ul className="flex flex-col gap-1">
                {sharedWeaknesses.map((w) => (
                  <li
                    key={w}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <span style={{ color: 'var(--color-accent)' }} aria-hidden="true">
                      ✗
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Per-model cards — responsive grid (1 col mobile → 2 col sm → 3 col lg) */}
      <div className={gridClass}>
        {models.map((model) => (
          <div
            key={model.id}
            className="rounded-xl p-5"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <h3 className="mb-4 text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              {model.name}
            </h3>

            {/* Strengths */}
            <div className="mb-4">
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-secondary)' }}
              >
                Strengths
              </p>
              {model.strengths.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {model.strengths.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <span
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--color-secondary)' }}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
                  None listed
                </p>
              )}
            </div>

            {/* Weaknesses */}
            <div>
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--color-accent)' }}
              >
                Weaknesses
              </p>
              {model.weaknesses.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {model.weaknesses.map((w) => (
                    <li
                      key={w}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <span
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: 'var(--color-accent)' }}
                        aria-hidden="true"
                      >
                        ✗
                      </span>
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
                  None listed
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
