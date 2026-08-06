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
