import type { Model } from '@/lib/models'

type Props = {
  model: Model
  onClose: () => void
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return `$${price.toFixed(2)}`
}

function formatBenchmark(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}`
}

export function NodePanel({ model, onClose }: Props) {
  return (
    <aside
      className="absolute top-0 right-0 h-full w-80 flex flex-col overflow-y-auto z-20 border-l"
      style={{
        backgroundColor: 'rgba(5, 5, 16, 0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-mono font-medium tracking-widest uppercase"
            style={{ color: '#6C63FF' }}
          >
            {model.provider}
          </span>
          <h2 className="text-lg font-bold text-white leading-tight">
            {model.name}
          </h2>
          <span className="text-xs text-white/40 font-mono">{model.id}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors duration-200 mt-1 flex-shrink-0"
          aria-label="Close panel"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 2l12 12M14 2L2 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-2 gap-px border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        {[
          { label: 'Context', value: formatContextWindow(model.context_window) + ' tokens' },
          { label: 'Released', value: model.release_date },
          { label: 'Input / 1M', value: formatPrice(model.pricing.input) },
          { label: 'Output / 1M', value: formatPrice(model.pricing.output) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 p-4"
            style={{ backgroundColor: 'rgba(5,5,16,0.6)' }}
          >
            <span className="text-xs text-white/40 font-mono uppercase tracking-wider">
              {label}
            </span>
            <span className="text-sm font-semibold text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Benchmarks */}
      <div
        className="p-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <h3 className="text-xs font-mono font-medium tracking-widest uppercase text-white/40 mb-3">
          Benchmarks
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { label: 'MMLU', value: formatBenchmark(model.benchmarks.mmlu) },
            { label: 'HumanEval', value: formatBenchmark(model.benchmarks.humaneval) },
            { label: 'MT-Bench', value: formatBenchmark(model.benchmarks.mt_bench) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-white/50">{label}</span>
              <span className="text-xs font-mono font-medium text-white/80">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modalities & Capabilities */}
      <div
        className="p-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <h3 className="text-xs font-mono font-medium tracking-widest uppercase text-white/40 mb-3">
          Modalities
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {model.modalities.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium"
              style={{
                backgroundColor: 'rgba(0,212,255,0.1)',
                color: '#00D4FF',
                border: '1px solid rgba(0,212,255,0.2)',
              }}
            >
              {m}
            </span>
          ))}
        </div>
        <h3 className="text-xs font-mono font-medium tracking-widest uppercase text-white/40 mb-3">
          Capabilities
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {model.capabilities.map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded text-xs font-mono font-medium"
              style={{
                backgroundColor: 'rgba(108,99,255,0.1)',
                color: '#9B8FFF',
                border: '1px solid rgba(108,99,255,0.2)',
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-mono font-medium tracking-widest uppercase text-white/40 mb-2">
            Strengths
          </h3>
          <ul className="flex flex-col gap-1.5">
            {model.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs text-white/70">
                <span style={{ color: '#00D4FF' }} aria-hidden="true">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-mono font-medium tracking-widest uppercase text-white/40 mb-2">
            Weaknesses
          </h3>
          <ul className="flex flex-col gap-1.5">
            {model.weaknesses.map((w) => (
              <li key={w} className="flex items-start gap-2 text-xs text-white/70">
                <span style={{ color: '#FF6B9D' }} aria-hidden="true">−</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* License */}
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="text-xs text-white/40 font-mono uppercase tracking-wider">License</span>
          <span className="text-xs font-mono font-medium text-white/70">{model.license}</span>
        </div>

        {/* Links */}
        {(model.links.docs || model.links.paper) && (
          <div className="flex gap-3">
            {model.links.docs && (
              <a
                href={model.links.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium transition-colors duration-200"
                style={{ color: '#6C63FF' }}
              >
                Docs ↗
              </a>
            )}
            {model.links.paper && (
              <a
                href={model.links.paper}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium transition-colors duration-200"
                style={{ color: '#6C63FF' }}
              >
                Paper ↗
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
