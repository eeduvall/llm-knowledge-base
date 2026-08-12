'use client';

import Link from 'next/link';
import type { ScoredModel } from '@/lib/decision-tree';

type Props = {
  results: ScoredModel[];
  onReset: () => void;
};

export function ResultDeck({ results, onReset }: Props) {
  return (
    <section
      className="w-full max-w-2xl mx-auto flex flex-col gap-6"
      aria-label="Recommended models"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Your top picks
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="text-sm px-4 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus-visible:ring-2"
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
            className="rounded-xl p-5 border flex flex-col gap-3"
            style={{
              backgroundColor: index === 0 ? 'rgba(108,99,255,0.10)' : 'rgba(255,255,255,0.03)',
              borderColor: index === 0 ? 'rgba(108,99,255,0.35)' : 'rgba(255,255,255,0.07)',
            }}
          >
            {/* Rank badge + model name */}
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: index === 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                  color: index === 0 ? '#fff' : 'var(--color-text-muted)',
                }}
                aria-label={`Rank ${index + 1}`}
              >
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {result.model.name}
              </h3>
              <span
                className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
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
              className="self-start text-xs font-medium underline-offset-2 hover:underline transition-colors duration-150"
              style={{ color: 'var(--color-primary)' }}
            >
              View in Knowledge Graph →
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
