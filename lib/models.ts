// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Modality = 'text' | 'image' | 'audio' | 'video' | 'code';

export type Capability =
  'reasoning' | 'vision' | 'tool-use' | 'structured-output' | 'code' | 'long-context' | string;

export type Pricing = {
  input: number | null;
  output: number | null;
};

export type Benchmarks = {
  mmlu: number | null;
  humaneval: number | null;
  mt_bench: number | null;
};

export type Links = {
  docs: string | null;
  paper: string | null;
};

export type Model = {
  id: string;
  name: string;
  provider: string;
  family: string;
  release_date: string;
  context_window: number;
  modalities: Modality[];
  capabilities: Capability[];
  pricing: Pricing;
  benchmarks: Benchmarks;
  strengths: string[];
  weaknesses: string[];
  license: string;
  links: Links;
  last_verified?: string;
};

// ---------------------------------------------------------------------------
// Provider colour mapping (matches design-system palette)
// Each provider has a unique colour for clear visual distinction in the graph.
// ---------------------------------------------------------------------------

export const PROVIDER_COLORS: Record<string, string> = {
  openai: '#6C63FF', // primary violet
  anthropic: '#00D4FF', // cyan bioluminescence
  google: '#FF6B9D', // accent pink
  meta: '#9B8FFF', // soft violet
  mistral: '#F7B731', // amber — distinct from all others
};

export function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? '#6C63FF';
}
