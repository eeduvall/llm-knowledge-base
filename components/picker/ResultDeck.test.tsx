import { render, screen, fireEvent } from '@testing-library/react'
import { ResultDeck } from './ResultDeck'
import type { ScoredModel } from '@/lib/decision-tree'
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
    capabilities: ['reasoning', 'vision', 'tool-use', 'structured-output'],
    pricing: { input: 5.0, output: 15.0 },
    benchmarks: { mmlu: 88.7, humaneval: 90.2, mt_bench: null },
    strengths: ['Best-in-class multimodal reasoning'],
    weaknesses: ['Higher cost'],
    license: 'proprietary',
    links: { docs: 'https://platform.openai.com/docs', paper: null },
    ...overrides,
  }
}

const results: ScoredModel[] = [
  {
    model: makeModel(),
    score: 80,
    reason: 'Strong reasoning and tool-use capabilities.',
  },
  {
    model: makeModel({ id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic' }),
    score: 65,
    reason: 'Excellent for long-context tasks.',
  },
  {
    model: makeModel({
      id: 'llama-3-70b',
      name: 'Llama 3 70B',
      provider: 'meta',
      pricing: { input: null, output: null },
      license: 'llama',
    }),
    score: 50,
    reason: 'Open weights — no per-token cost.',
  },
]

describe('ResultDeck', () => {
  it('renders the heading', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    expect(screen.getByText('Your top picks')).toBeInTheDocument()
  })

  it('renders all result model names', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument()
    expect(screen.getByText('Llama 3 70B')).toBeInTheDocument()
  })

  it('renders the reason for each result', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    expect(screen.getByText('Strong reasoning and tool-use capabilities.')).toBeInTheDocument()
    expect(screen.getByText('Excellent for long-context tasks.')).toBeInTheDocument()
  })

  it('renders "Open weights" for models with null pricing', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    expect(screen.getByText('Open weights')).toBeInTheDocument()
  })

  it('renders a "Start over" button', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })

  it('calls onReset when "Start over" is clicked', () => {
    const onReset = jest.fn()
    render(<ResultDeck results={results} onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: /start over/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders "View in Knowledge Graph" links for each result', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    const links = screen.getAllByText(/View in Knowledge Graph/i)
    expect(links).toHaveLength(3)
  })

  it('renders rank badges', () => {
    render(<ResultDeck results={results} onReset={() => {}} />)
    expect(screen.getByLabelText('Rank 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Rank 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Rank 3')).toBeInTheDocument()
  })
})
