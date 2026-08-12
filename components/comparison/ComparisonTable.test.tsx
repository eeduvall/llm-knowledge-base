import { render, screen } from '@testing-library/react'
import { ComparisonTable } from './ComparisonTable'
import type { ComparisonRow } from '@/lib/comparison'
import type { Model } from '@/lib/models'

function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    family: 'gpt-4',
    release_date: '2024-05-13',
    context_window: 128000,
    modalities: ['text', 'image'],
    capabilities: ['reasoning', 'vision'],
    pricing: { input: 5.0, output: 15.0 },
    benchmarks: { mmlu: 88.7, humaneval: 90.2, mt_bench: 9.0 },
    strengths: ['Great reasoning'],
    weaknesses: ['Expensive'],
    license: 'proprietary',
    links: { docs: 'https://example.com', paper: null },
    ...overrides,
  }
}

function makeRow(model: Model, isBest = false, isWorst = false): ComparisonRow {
  return {
    model,
    highlights: {
      contextWindow: { value: model.context_window, isBest, isWorst },
      inputPrice: { value: model.pricing.input, isBest, isWorst },
      outputPrice: { value: model.pricing.output, isBest, isWorst },
      mmlu: { value: model.benchmarks.mmlu, isBest, isWorst },
      humaneval: { value: model.benchmarks.humaneval, isBest, isWorst },
      mt_bench: { value: model.benchmarks.mt_bench, isBest, isWorst },
    },
  }
}

describe('ComparisonTable', () => {
  it('renders empty state when no rows', () => {
    render(<ComparisonTable rows={[]} />)
    expect(screen.getByText(/select at least one model/i)).toBeInTheDocument()
  })

  it('renders model names in header', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
  })

  it('renders provider badge', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    const badges = screen.getAllByText('openai')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('renders section headers', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Pricing (per 1M tokens)')).toBeInTheDocument()
    expect(screen.getByText('Benchmarks')).toBeInTheDocument()
    // "Capabilities" appears as both a section header and a row label
    const capEls = screen.getAllByText('Capabilities')
    expect(capEls.length).toBeGreaterThanOrEqual(1)
  })

  it('renders benchmark labels', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    expect(screen.getByText('MMLU')).toBeInTheDocument()
    expect(screen.getByText('HumanEval')).toBeInTheDocument()
    expect(screen.getByText('MT-Bench')).toBeInTheDocument()
  })

  it('renders multiple models side by side', () => {
    const rows = [
      makeRow(makeModel({ id: 'model-a', name: 'Model A' })),
      makeRow(makeModel({ id: 'model-b', name: 'Model B', provider: 'anthropic' })),
    ]
    render(<ComparisonTable rows={rows} />)
    expect(screen.getByText('Model A')).toBeInTheDocument()
    expect(screen.getByText('Model B')).toBeInTheDocument()
  })

  it('renders capability chips', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    expect(screen.getByText('reasoning')).toBeInTheDocument()
    expect(screen.getByText('vision')).toBeInTheDocument()
  })

  it('renders context window value', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    expect(screen.getByText(/128K/)).toBeInTheDocument()
  })

  it('renders pricing values', () => {
    const row = makeRow(makeModel())
    render(<ComparisonTable rows={[row]} />)
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('$15.00')).toBeInTheDocument()
  })
})
