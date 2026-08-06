import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { loadModels } from '@/lib/models-server'
import { getProviderColor } from '@/lib/models'
import type { Model } from '@/lib/models'
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

function deriveCostTier(model: Model): { label: string; color: string } {
  const input = model.pricing.input
  if (input === null) return { label: 'Open Weights', color: 'var(--color-secondary)' }
  if (input <= 0.5) return { label: 'Budget', color: '#4ade80' }
  if (input <= 5.0) return { label: 'Mid-range', color: 'var(--color-primary)' }
  return { label: 'Premium', color: 'var(--color-accent)' }
}

function computeCostEfficiency(model: Model): string {
  const { input, output } = model.pricing
  if (input === null || output === null || input === 0) return '—'
  const ratio = output / input
  return `${ratio.toFixed(1)}×`
}

type BenchmarkEntry = {
  key: keyof Model['benchmarks']
  label: string
  description: string
  maxScore: number
}

const BENCHMARK_META: BenchmarkEntry[] = [
  { key: 'mmlu', label: 'MMLU', description: 'Massive Multitask Language Understanding — 57-subject knowledge test', maxScore: 100 },
  { key: 'humaneval', label: 'HumanEval', description: 'Code generation pass@1 — 164 Python programming problems', maxScore: 100 },
  { key: 'mt_bench', label: 'MT-Bench', description: 'Multi-turn conversation quality — GPT-4 judge, scored 1–10', maxScore: 10 },
]

type BenchmarkStats = {
  best: number | null
  worst: number | null
  rank: number
  total: number
}

function computeBenchmarkStats(
  key: keyof Model['benchmarks'],
  currentModel: Model,
  allModels: Model[]
): BenchmarkStats {
  const scores = allModels
    .map((m) => m.benchmarks[key])
    .filter((v): v is number => v !== null)

  if (scores.length === 0) return { best: null, worst: null, rank: 0, total: 0 }

  const best = Math.max(...scores)
  const worst = Math.min(...scores)
  const current = currentModel.benchmarks[key]

  if (current === null) return { best, worst, rank: 0, total: scores.length }

  const sorted = [...scores].sort((a, b) => b - a)
  const rank = sorted.indexOf(current) + 1

  return { best, worst, rank, total: scores.length }
}

export default function ModelDetailPage({ params }: Props) {
  const allModels = loadModels()
  const model = allModels.find((m) => m.id === params.id)
  if (!model) notFound()

  const providerColor = getProviderColor(model.provider)
  const costTier = deriveCostTier(model)
  const costEfficiency = computeCostEfficiency(model)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Hero header with provider accent stripe */}
        <div className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${providerColor} 0%, transparent 60%)` }} />
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: providerColor }} />
          <div className="relative max-w-5xl mx-auto px-6 py-12">
            <div className="flex flex-wrap items-start gap-4 mb-6">
              <Link
                href="/models"
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <span>←</span> All Models
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${providerColor}22`, color: providerColor, border: `1px solid ${providerColor}44` }}
              >
                {model.provider}
              </span>
              <span
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${costTier.color}22`, color: costTier.color, border: `1px solid ${costTier.color}44` }}
              >
                {costTier.label}
              </span>
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
              >
                {model.license}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{model.name}</h1>
            <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
              {model.family} family &middot; Released {model.release_date}
              {model.last_verified && <span> &middot; Data verified {model.last_verified}</span>}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'var(--color-text-muted)' }}>At a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {/* Context window */}
            <div className="col-span-1 rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Context Window</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>{formatContextWindow(model.context_window)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>tokens</div>
            </div>
            {/* Input price */}
            <div className="col-span-1 rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Input Price</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{formatPrice(model.pricing.input)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>per 1M tokens</div>
            </div>
            {/* Output price */}
            <div className="col-span-1 rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Output Price</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{formatPrice(model.pricing.output)}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>per 1M tokens</div>
            </div>
            {/* Cost efficiency */}
            <div className="col-span-1 rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Output/Input Ratio</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{costEfficiency}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>cost multiplier</div>
            </div>
            {/* Modalities */}
            <div className="col-span-1 rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Modalities</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{model.modalities.length}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>{model.modalities.join(', ')}</div>
            </div>
            {/* Capabilities */}
            <div className="col-span-1 rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Capabilities</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{model.capabilities.length}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>features</div>
            </div>
          </div>

          {/* Two-column layout: benchmarks + capabilities/modalities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Benchmarks */}
            <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>Benchmarks</h2>
              <p className="text-xs mb-6" style={{ color: 'var(--color-text-faint)' }}>Scores compared against all {allModels.length} models in the knowledge base</p>
              <div className="space-y-6">
                {BENCHMARK_META.map((bm) => {
                  const score = model.benchmarks[bm.key]
                  const stats = computeBenchmarkStats(bm.key, model, allModels)
                  const pct = score !== null && stats.best !== null ? (score / bm.maxScore) * 100 : 0
                  const bestPct = stats.best !== null ? (stats.best / bm.maxScore) * 100 : 0
                  const isFirst = stats.rank === 1 && score !== null
                  const isLast = stats.rank === stats.total && score !== null && stats.total > 1
                  return (
                    <div key={bm.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{bm.label}</span>
                          {isFirst && <span title="Best in class" className="text-base">👑</span>}
                          {isLast && <span title="Last among scored models" className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,157,0.15)', color: 'var(--color-accent)' }}>last</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          {score !== null ? (
                            <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{score}</span>
                          ) : (
                            <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>N/A</span>
                          )}
                          {score !== null && stats.total > 0 && (
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>#{stats.rank} of {stats.total}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs mb-2" style={{ color: 'var(--color-text-faint)' }}>{bm.description}</div>
                      {/* Bar track */}
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-divider)' }}>
                        {/* Best-in-class marker */}
                        {stats.best !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 opacity-40"
                            style={{ left: `${bestPct}%`, background: 'var(--color-text-muted)' }}
                          />
                        )}
                        {/* Score bar */}
                        {score !== null && (
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: isFirst
                                ? 'linear-gradient(90deg, var(--color-secondary), var(--color-primary))'
                                : isLast
                                ? 'var(--color-accent)'
                                : providerColor,
                            }}
                          />
                        )}
                      </div>
                      {stats.best !== null && (
                        <div className="flex justify-between mt-1">
                          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>0</span>
                          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Best: {stats.best} / {bm.maxScore}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Capabilities & Modalities */}
            <div className="space-y-6">
              <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Capabilities</h2>
                <div className="flex flex-wrap gap-2">
                  {model.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: 'var(--color-panel-bg-alt)', color: 'var(--color-primary)', border: '1px solid rgba(108,99,255,0.3)' }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Modalities</h2>
                <div className="flex flex-wrap gap-2">
                  {model.modalities.map((mod) => (
                    <span
                      key={mod}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--color-secondary)', border: '1px solid rgba(0,212,255,0.25)' }}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
              {/* Pricing detail */}
              <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Pricing Detail</h2>
                {model.pricing.input === null ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Open weights — pricing depends on your infrastructure.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Input (prompt)</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatPrice(model.pricing.input)} / 1M tokens</span>
                    </div>
                    <div className="h-px" style={{ background: 'var(--color-divider)' }} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Output (completion)</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{formatPrice(model.pricing.output)} / 1M tokens</span>
                    </div>
                    <div className="h-px" style={{ background: 'var(--color-divider)' }} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Output/Input ratio</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>{costEfficiency}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Strengths</h2>
              <ul className="space-y-2">
                {model.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-secondary)' }}>✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>Weaknesses</h2>
              <ul className="space-y-2">
                {model.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                    <span className="mt-0.5 shrink-0" style={{ color: 'var(--color-accent)' }}>✕</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Links & actions */}
          <div className="flex flex-wrap gap-4 items-center">
            {model.links.docs && (
              <a
                href={model.links.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                style={{ background: providerColor, color: '#fff' }}
              >
                Documentation ↗
              </a>
            )}
            {model.links.paper && (
              <a
                href={model.links.paper}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                Research Paper ↗
              </a>
            )}
            <Link
              href={`/graph?highlight=${model.id}`}
              className="text-sm px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-panel-bg-alt)', color: 'var(--color-primary)', border: '1px solid rgba(108,99,255,0.3)' }}
            >
              View in Knowledge Graph →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
