import Link from 'next/link';
import type { Model } from '@/lib/models';
import { getProviderColor } from '@/lib/models';

type Props = {
  model: Model;
};

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}

export function ModelCard({ model }: Props) {
  const providerColor = getProviderColor(model.provider);

  return (
    <Link
      href={`/models/${model.id}`}
      className="block rounded-xl p-5 border transition-all duration-200 hover:border-white/20 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      aria-label={`View details for ${model.name}`}
    >
      {/* Provider + name */}
      <div className="flex flex-col gap-1 mb-3">
        <span
          className="text-xs font-mono font-medium tracking-widest uppercase"
          style={{ color: providerColor }}
        >
          {model.provider}
        </span>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {model.name}
        </h2>
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-faint)' }}>
          {model.id}
        </span>
      </div>

      {/* Key stats */}
      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs mb-3">
        <div className="flex gap-1">
          <dt style={{ color: 'var(--color-text-faint)' }}>Context</dt>
          <dd style={{ color: 'var(--color-text-muted)' }}>
            {formatContextWindow(model.context_window)} tokens
          </dd>
        </div>
        {model.pricing.input !== null ? (
          <div className="flex gap-1">
            <dt style={{ color: 'var(--color-text-faint)' }}>Input</dt>
            <dd style={{ color: 'var(--color-text-muted)' }}>${model.pricing.input}/M</dd>
          </div>
        ) : (
          <div className="flex gap-1">
            <dt style={{ color: 'var(--color-text-faint)' }}>Pricing</dt>
            <dd style={{ color: 'var(--color-secondary)' }}>Open weights</dd>
          </div>
        )}
        <div className="flex gap-1">
          <dt style={{ color: 'var(--color-text-faint)' }}>License</dt>
          <dd style={{ color: 'var(--color-text-muted)' }}>{model.license}</dd>
        </div>
      </dl>

      {/* Capability tags */}
      {model.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {model.capabilities.slice(0, 4).map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary-dim)',
              }}
            >
              {cap}
            </span>
          ))}
          {model.capabilities.length > 4 && (
            <span
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'var(--color-text-faint)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              +{model.capabilities.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
