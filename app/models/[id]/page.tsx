import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { loadModels } from '@/lib/models-server'
import { getProviderColor } from '@/lib/models'
import type { Metadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateStaticParams() {
  const models = loadModels()
  return models.map((m) => ({ id: m.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const models = loadModels()
  const model = models.find((m) => m.id === params.id)
  if (!model) return { title: 'Model not found — LLM Knowledge Base' }
  return {
    title: `${model.name} — LLM Knowledge Base`,
    description: `Full profile for ${model.name}: context window, pricing, benchmarks, capabilities, strengths, and weaknesses.`,
  }
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

export default function ModelDetailPage({ params }: Props) {
  const models = loadModels()
  const model = models.find((m) => m.id === params.id)

  if (!model) notFound()

  const providerColor = getProviderColor(model.provider)

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />

      <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs font-mono list-none">
            <li>
              <Link
                href="/models"
                className="transition-colors duration-200 hover:text-white"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Models
              </Link>
            </li>
            <li style={{ color: 'var(--color-text-faint)' }} aria-hidden="true">/</li>
            <li style={{ color: 'var(--color-text-muted)' }}>{model.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <span
            className="text-xs font-mono font-medium tracking-widest uppercase"
            style={{ color: providerColor }}
          >
            {model.provider}
          </span>
          <h1
            className="text-4xl font-bold mt-1 mb-2"
            style={{ color: 'var(--color-text)', fontFamily: 'Syne, sans-serif' }}
          >
            {model.name}
          </h1>
          <p className="text-sm font-mono" style={{ color: 'var(--color-text-faint)' }}>
            {model.id}
          </p>
        </header>

        {/* Stats grid */}
        <section aria-label="Key statistics" className="mb-8">
          <dl
            className="grid grid-cols-2 gap-px rounded-xl overflow-hidden border"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-divider)',
            }}
          >
            {[
              { label: 'Context window', value: `${formatContextWindow(model.context_window)} tokens` },
              { label: 'Released', value: model.release_date },
              { label: 'Input / 1M tokens', value: formatPrice(model.pricing.input) },
              { label: 'Output / 1M tokens', value: formatPrice(model.pricing.output) },
              { label: 'License', value: model.license },
              { label: 'Family', value: model.family },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 p-5"
                style={{ backgroundColor: 'var(--color-panel-bg)' }}
              >
                <dt
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  {label}
                </dt>
                <dd
                  className="text-sm font-semibold"
                  style={{ color: 'var(--color-text)' }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Benchmarks */}
        <section aria-label="Benchmarks" className="mb-8">
          <h2
            className="text-xs font-mono font-medium tracking-widest uppercase mb-4"
            style={{ color: 'var(--color-text-faint)' }}
          >
            Benchmarks
          </h2>
          <dl className="grid grid-cols-3 gap-4">
            {[
              { label: 'MMLU', value: formatBenchmark(model.benchmarks.mmlu) },
              { label: 'HumanEval', value: formatBenchmark(model.benchmarks.humaneval) },
              { label: 'MT-Bench', value: formatBenchmark(model.benchmarks.mt_bench) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-4 border flex flex-col gap-1"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <dt
                  className="text-xs font-mono uppercase tracking-wider"
                  style={{ color: 'var(--color-text-faint)' }}
                >
                  {label}
                </dt>
                <dd
                  className="text-2xl font-bold font-mono"
                  style={{ color: value === '—' ? 'var(--color-text-faint)' : 'var(--color-text)' }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Modalities & Capabilities */}
        <section aria-label="Modalities and capabilities" className="mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2
                className="text-xs font-mono font-medium tracking-widest uppercase mb-3"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Modalities
              </h2>
              <ul className="flex flex-wrap gap-2 list-none">
                {model.modalities.map((m) => (
                  <li key={m}>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-mono font-medium"
                      style={{
                        backgroundColor: 'var(--color-secondary-subtle)',
                        color: 'var(--color-secondary)',
                        border: '1px solid var(--color-secondary-dim)',
                      }}
                    >
                      {m}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2
                className="text-xs font-mono font-medium tracking-widest uppercase mb-3"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Capabilities
              </h2>
              <ul className="flex flex-wrap gap-2 list-none">
                {model.capabilities.map((c) => (
                  <li key={c}>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-mono font-medium"
                      style={{
                        backgroundColor: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary-light)',
                        border: '1px solid var(--color-primary-dim)',
                      }}
                    >
                      {c}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Strengths & Weaknesses */}
        <section aria-label="Strengths and weaknesses" className="mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-xs font-mono font-medium tracking-widest uppercase mb-4"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Strengths
              </h2>
              <ul className="flex flex-col gap-2 list-none">
                {model.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span style={{ color: 'var(--color-secondary)' }} aria-hidden="true">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-xs font-mono font-medium tracking-widest uppercase mb-4"
                style={{ color: 'var(--color-text-faint)' }}
              >
                Weaknesses
              </h2>
              <ul className="flex flex-col gap-2 list-none">
                {model.weaknesses.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span style={{ color: 'var(--color-accent)' }} aria-hidden="true">−</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Links */}
        {(model.links.docs || model.links.paper) && (
          <section aria-label="External links" className="mb-8">
            <h2
              className="text-xs font-mono font-medium tracking-widest uppercase mb-4"
              style={{ color: 'var(--color-text-faint)' }}
            >
              Links
            </h2>
            <div className="flex gap-4">
              {model.links.docs && (
                <a
                  href={model.links.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-white/5"
                  style={{
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary-border)',
                  }}
                  aria-label={`${model.name} documentation (opens in new tab)`}
                >
                  Documentation ↗
                </a>
              )}
              {model.links.paper && (
                <a
                  href={model.links.paper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-white/5"
                  style={{
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary-border)',
                  }}
                  aria-label={`${model.name} paper (opens in new tab)`}
                >
                  Paper ↗
                </a>
              )}
            </div>
          </section>
        )}

        {/* Graph deep-dive link */}
        <div
          className="rounded-xl p-5 border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-panel-bg-alt)',
            borderColor: 'var(--color-primary-dim)',
          }}
        >
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
              Explore in the Knowledge Graph
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              See how {model.name} relates to other models in the 3-D graph.
            </p>
          </div>
          <Link
            href={`/graph?highlight=${model.id}`}
            className="text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-white/5 flex-shrink-0 ml-4"
            style={{
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary-border)',
            }}
          >
            Open Graph →
          </Link>
        </div>
      </div>
    </main>
  )
}
