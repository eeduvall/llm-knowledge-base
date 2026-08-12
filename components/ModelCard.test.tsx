import { render, screen } from '@testing-library/react';
import { ModelCard } from './ModelCard';
import type { Model } from '@/lib/models';

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
  };
}

describe('ModelCard', () => {
  it('renders the model name', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('GPT-4o')).toBeInTheDocument();
  });

  it('renders the model id', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  it('renders the provider', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('openai')).toBeInTheDocument();
  });

  it('renders the context window', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('128K tokens')).toBeInTheDocument();
  });

  it('renders the input price when available', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('$5/M')).toBeInTheDocument();
  });

  it('renders "Open weights" when pricing is null', () => {
    render(<ModelCard model={makeModel({ pricing: { input: null, output: null } })} />);
    expect(screen.getByText('Open weights')).toBeInTheDocument();
  });

  it('renders the license', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('proprietary')).toBeInTheDocument();
  });

  it('renders capability tags', () => {
    render(<ModelCard model={makeModel()} />);
    expect(screen.getByText('reasoning')).toBeInTheDocument();
    expect(screen.getByText('vision')).toBeInTheDocument();
  });

  it('renders an overflow badge when there are more than 4 capabilities', () => {
    render(
      <ModelCard
        model={makeModel({
          capabilities: ['reasoning', 'vision', 'tool-use', 'structured-output', 'code'],
        })}
      />,
    );
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('links to the model detail page', () => {
    render(<ModelCard model={makeModel()} />);
    const link = screen.getByRole('link', { name: /view details for gpt-4o/i });
    expect(link).toHaveAttribute('href', '/models/gpt-4o');
  });
});
