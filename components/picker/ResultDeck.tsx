'use client';

import Link from 'next/link';
import type { ScoredModel } from '@/lib/decision-tree';
import { projectMonthlySpend } from '@/lib/cost-calculator';

type Props = {
  results: ScoredModel[];
  onReset: () => void;
};

export function ResultDeck({ results, onReset }: Props) {
  const topIds = results
    .slice(0, 5)
    .map((r) => r.model.id)
    .join(',');

  return (
    <section
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      aria-label="Recommended models"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Your top picks
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border px-4 py-2 text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'var(--color-text-muted)',
          }}
        >
          Start over
        </button>
      </div>

      <ol className="flex flex-col gap-4" aria-label="Model recommendations">
        {results.map((result, index) => (
          <li
            key={result.model.id}
            className="flex flex-col gap-3 rounded-xl border p-5"
            style={{
              backgroundColor: index === 0 ? 'rgba(108,99,255,0.10)' : 'rgba(255,255,255,0.03)',
              borderColor: index === 0 ? 'rgba(108,99,255,0.35)' : 'rgba(255,255,255,0.07)',
            }}
          >
            {/* Rank badge + model name */}
            <div className="flex items-center gap-3">
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold"
                style={{
                  backgroundColor: index === 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                  color: index === 0 ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
                aria-label={`Rank ${index + 1}`}
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {result.model.name}
              </h3>
              <span
                className="ml-auto rounded px-2 py-0.5 font-mono text-xs"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {result.model.provider}
              </span>
            </div>

            {/* Why this model */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {result.reason}
            </p>

            {/* Key stats */}
            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <div className="flex gap-1">
                <dt style={{ color: 'var(--color-text-faint)' }}>Context</dt>
                <dd style={{ color: 'var(--color-text-muted)' }}>
                  {(result.model.context_window / 1000).toFixed(0)}K tokens
                </dd>
              </div>
              {result.model.pricing.input !== null && (
                <div className="flex gap-1">
                  <dt style={{ color: 'var(--color-text-faint)' }}>Input</dt>
                  <dd style={{ color: 'var(--color-text-muted)' }}>
                    ${result.model.pricing.input}/M tokens
                  </dd>
                </div>
              )}
              {result.model.pricing.input === null && (
                <div className="flex gap-1">
                  <dt style={{ color: 'var(--color-text-faint)' }}>Pricing</dt>
                  <dd style={{ color: 'var(--color-secondary)' }}>Open weights</dd>
                </div>
              )}
              <div className="flex gap-1">
                <dt style={{ color: 'var(--color-text-faint)' }}>License</dt>
                <dd style={{ color: 'var(--color-text-muted)' }}>{result.model.license}</dd>
              </div>
            </dl>

            {/* Deep-dive link */}
            <Link
              href={`/graph?highlight=${result.model.id}`}
              className="self-start text-xs font-medium underline-offset-2 transition-colors duration-150 hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              View in Knowledge Graph →
            </Link>
          </li>
        ))}
      </ol>

      {/* Savings insight */}
      {results.length >= 2 &&
        (() => {
          const TASKS_PER_MONTH = 10_000;
          const INPUT_TOKENS = 300;
          const OUTPUT_TOKENS = 200;
          const pricedResults = results.filter(
            (r) => r.model.pricing.input !== null || r.model.pricing.output !== null,
          );
          if (pricedResults.length < 2) return null;
          const spends = pricedResults.map((r) => ({
            model: r.model,
            monthly:
              projectMonthlySpend(r.model, TASKS_PER_MONTH, INPUT_TOKENS, OUTPUT_TOKENS)
                .monthlySpend ?? 0,
          }));
          const mostExpensive = spends.reduce((a, b) => (a.monthly > b.monthly ? a : b));
          const cheapest = spends.reduce((a, b) => (a.monthly < b.monthly ? a : b));
          if (mostExpensive.model.id === cheapest.model.id) return null;
          const saving = mostExpensive.monthly - cheapest.monthly;
          if (saving <= 0) return null;
          return (
            <div
              className="rounded-xl border p-4"
              style={{
                background: 'rgba(0,212,255,0.05)',
                borderColor: 'rgba(0,212,255,0.2)',
              }}
            >
              <p className="mb-1 text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                💡 Savings Insight
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Switching from{' '}
                <span style={{ color: 'var(--color-text)' }}>{mostExpensive.model.name}</span> to{' '}
                <span style={{ color: 'var(--color-text)' }}>{cheapest.model.name}</span> saves{' '}
                <span className="font-semibold" style={{ color: 'var(--color-secondary)' }}>
                  ~${saving.toFixed(2)}/month
                </span>{' '}
                at {TASKS_PER_MONTH.toLocaleString()} tasks ({INPUT_TOKENS} input / {OUTPUT_TOKENS}{' '}
                output tokens each).
              </p>
            </div>
          );
        })()}
      {/* Compare top picks CTA */}
      {results.length >= 2 && (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Link
            href={`/comparison?models=${topIds}`}
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors"
            style={{ background: 'var(--color-primary)', color: 'var(--color-text)' }}
          >
            Compare top picks side-by-side →
          </Link>
          <Link
            href="/picker/cost-aware"
            className="flex-1 rounded-lg py-2.5 text-center text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            Find cheapest option →
          </Link>
        </div>
      )}
    </section>
  );
}
