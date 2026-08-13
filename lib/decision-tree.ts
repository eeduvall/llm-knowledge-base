/**
 * lib/decision-tree.ts
 *
 * Pure logic for the Q&A Picker Flow — no React, no side effects.
 * This module encodes the entire question funnel, model scoring, and
 * recommendation ranking.
 *
 * ⚠️  AGENTS.md §15.10: "The decision tree is product logic. Changes here
 * affect recommendations shown to users. Treat it with the same care as a
 * pricing algorithm — test every branch."
 */
import type { Model } from './models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnswerId = string;

export type Answer = {
  id: AnswerId;
  label: string;
  hint?: string;
};

export type Question = {
  id: string;
  text: string;
  answers: Answer[];
};

export type UserAnswers = Record<string, AnswerId>;

export type ScoredModel = {
  model: Model;
  score: number;
  reason: string;
};

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------

export const QUESTIONS: Question[] = [
  {
    id: 'use_case',
    text: 'What are you building?',
    answers: [
      { id: 'chatbot', label: 'Customer-facing chatbot', hint: 'Conversational assistant' },
      { id: 'code', label: 'Code assistant / copilot', hint: 'Code generation and review' },
      {
        id: 'rag',
        label: 'Document analysis / RAG pipeline',
        hint: 'Retrieval-augmented generation',
      },
      { id: 'agent', label: 'Autonomous agent / tool-use', hint: 'Multi-step task execution' },
      {
        id: 'creative',
        label: 'Creative / generative content',
        hint: 'Text, image, or multimodal generation',
      },
    ],
  },
  {
    id: 'latency',
    text: "What's your latency budget?",
    answers: [
      { id: 'fast', label: 'Real-time (< 500 ms)', hint: 'Streaming, interactive UX' },
      { id: 'medium', label: 'Near real-time (1–2 s)', hint: 'Acceptable for most chat UIs' },
      { id: 'flexible', label: 'Batch / async (flexible)', hint: 'Background jobs, pipelines' },
    ],
  },
  {
    id: 'budget',
    text: "What's your monthly token budget?",
    answers: [
      { id: 'low', label: 'Low (< $50 / month)', hint: 'Prototype or low-traffic app' },
      { id: 'mid', label: 'Mid ($50–$500 / month)', hint: 'Growing production app' },
      { id: 'high', label: 'High (> $500 / month)', hint: 'Enterprise or high-volume' },
      {
        id: 'self_host',
        label: 'Self-host (no per-token cost)',
        hint: 'Open-weights on your infra',
      },
    ],
  },
  {
    id: 'context',
    text: 'How large is your typical input?',
    answers: [
      { id: 'short', label: 'Short (< 4 K tokens)', hint: 'Single messages, snippets' },
      { id: 'medium', label: 'Medium (4 K–32 K tokens)', hint: 'Documents, conversations' },
      { id: 'long', label: 'Long (> 32 K tokens)', hint: 'Books, large codebases, long threads' },
    ],
  },
  {
    id: 'modality',
    text: 'Do you need multimodal capabilities?',
    answers: [
      { id: 'text_only', label: 'Text only', hint: 'No images or audio needed' },
      { id: 'vision', label: 'Vision (images)', hint: 'Analyse or generate images' },
      { id: 'audio', label: 'Audio / speech', hint: 'Transcription or voice' },
      {
        id: 'multimodal',
        label: 'Multimodal (text + image + audio)',
        hint: 'Full multimedia pipeline',
      },
    ],
  },
  {
    id: 'license',
    text: 'Do you require open weights?',
    answers: [
      { id: 'open', label: 'Yes — open weights required', hint: 'Apache-2.0, MIT, Llama, etc.' },
      { id: 'any', label: 'No — proprietary is fine', hint: 'API-only models are acceptable' },
    ],
  },
  {
    id: 'deployment',
    text: 'Where will this run?',
    answers: [
      {
        id: 'cloud_api',
        label: 'Cloud API (managed)',
        hint: 'OpenAI, Anthropic, Google — no infra to manage',
      },
      {
        id: 'cloud_self',
        label: 'Cloud (self-hosted)',
        hint: 'AWS, GCP, or Azure VMs you control',
      },
      { id: 'edge', label: 'Edge / on-device', hint: 'Mobile, browser, or IoT' },
      { id: 'on_prem', label: 'On-premises', hint: 'Private data centre, air-gapped' },
    ],
  },
  {
    id: 'compliance',
    text: 'Do you have compliance requirements?',
    answers: [
      { id: 'none', label: 'No special requirements', hint: 'Standard commercial use' },
      {
        id: 'data_residency',
        label: 'Data residency / sovereignty',
        hint: 'EU, specific region, or country',
      },
      { id: 'hipaa', label: 'HIPAA / healthcare', hint: 'Protected health information' },
      { id: 'pci', label: 'PCI-DSS / financial', hint: 'Payment card data' },
      { id: 'sox', label: 'SOX / enterprise audit', hint: 'Financial reporting compliance' },
    ],
  },
  {
    id: 'customization',
    text: 'How much customization do you need?',
    answers: [
      {
        id: 'prompt_only',
        label: 'Prompt engineering only',
        hint: 'Few-shot examples, system prompts',
      },
      { id: 'fine_tune', label: 'Fine-tuning', hint: 'Adapt the model weights to your domain' },
      { id: 'both', label: 'Both prompt + fine-tuning', hint: 'Maximum flexibility' },
    ],
  },
  {
    id: 'reasoning_style',
    text: 'What reasoning approach fits your use case?',
    answers: [
      { id: 'single_turn', label: 'Single-turn response', hint: 'Fast, direct answers' },
      { id: 'multi_step', label: 'Multi-step reasoning', hint: 'Chain-of-thought, step-by-step' },
      { id: 'flexible', label: 'Flexible (task-dependent)', hint: 'Mix of both as needed' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Flow control
// ---------------------------------------------------------------------------

export function getNextQuestion(answers: UserAnswers): Question | null {
  return QUESTIONS.find((q) => !(q.id in answers)) ?? null;
}

export function isFunnelComplete(answers: UserAnswers): boolean {
  return QUESTIONS.every((q) => q.id in answers);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const OPEN_LICENSES = new Set(['apache-2.0', 'mit', 'llama']);
const ENTERPRISE_PROVIDERS = new Set(['openai', 'anthropic', 'google']);
const EU_PROVIDERS = new Set(['mistral', 'aleph-alpha']);

export function scoreModel(model: Model, answers: UserAnswers): ScoredModel {
  let score = 0;
  const reasons: string[] = [];

  // --- use_case ---
  const useCase = answers['use_case'];
  if (useCase === 'code') {
    if (model.capabilities.includes('code')) {
      score += 30;
      reasons.push('strong code generation capability');
    }
  } else if (useCase === 'rag') {
    if (model.capabilities.includes('long-context') || model.context_window >= 100000) {
      score += 25;
      reasons.push('large context window suits RAG pipelines');
    }
    if (model.capabilities.includes('structured-output')) {
      score += 10;
      reasons.push('structured output for reliable extraction');
    }
  } else if (useCase === 'agent') {
    if (model.capabilities.includes('tool-use')) {
      score += 25;
      reasons.push('native tool-use support');
    }
    if (model.capabilities.includes('structured-output')) {
      score += 15;
      reasons.push('structured output for reliable tool calls');
    }
  } else if (useCase === 'chatbot') {
    if (model.capabilities.includes('reasoning')) {
      score += 15;
      reasons.push('strong reasoning for conversational quality');
    }
  } else if (useCase === 'creative') {
    if (model.modalities.includes('image')) {
      score += 20;
      reasons.push('image generation / understanding');
    }
    if (model.capabilities.includes('reasoning')) {
      score += 10;
      reasons.push('reasoning supports creative coherence');
    }
  }

  // --- latency ---
  const latency = answers['latency'];
  if (latency === 'fast') {
    if (model.pricing.input !== null && model.pricing.input < 1.0) {
      score += 15;
      reasons.push('low cost signals smaller, faster model');
    }
  }

  // --- budget ---
  const budget = answers['budget'];
  if (budget === 'low') {
    if (model.pricing.input !== null && model.pricing.input < 0.5) {
      score += 25;
      reasons.push('very low input cost');
    } else if (model.pricing.input !== null && model.pricing.input >= 5.0) {
      score -= 15;
    }
  } else if (budget === 'self_host') {
    if (model.pricing.input === null && model.pricing.output === null) {
      score += 40;
      reasons.push('open weights — self-hostable at no per-token cost');
    } else {
      score -= 20;
    }
  }

  // --- context ---
  const context = answers['context'];
  if (context === 'long') {
    if (model.context_window >= 500000) {
      score += 30;
      reasons.push('very large context window');
    } else if (model.context_window < 16000) {
      score -= 10;
    }
  }

  // --- modality ---
  const modality = answers['modality'];
  if (modality === 'vision' || modality === 'multimodal') {
    if (model.modalities.includes('image')) {
      score += 20;
      reasons.push('vision / image support');
    } else {
      score -= 15;
    }
  }
  if (modality === 'audio' || modality === 'multimodal') {
    if (model.modalities.includes('audio')) {
      score += 15;
      reasons.push('audio / speech support');
    } else {
      score -= 15;
    }
  }

  // --- license ---
  const license = answers['license'];
  if (license === 'open') {
    if (OPEN_LICENSES.has(model.license)) {
      score += 30;
      reasons.push('open-source license');
    } else {
      score -= 25;
    }
  }

  // --- benchmarks ---
  if (model.benchmarks.mmlu !== null && model.benchmarks.mmlu >= 85) {
    score += 5;
    reasons.push('high MMLU benchmark score');
  }

  // --- deployment ---
  const deployment = answers['deployment'];
  if (deployment === 'edge') {
    if (model.capabilities.includes('quantizable') || model.context_window <= 32000) {
      score += 20;
      reasons.push('compact model suitable for edge deployment');
    }
    if (model.pricing.input === null) {
      score += 15;
      reasons.push('open weights enable on-device inference');
    }
  } else if (deployment === 'cloud_api') {
    if (model.pricing.input !== null) {
      score += 10;
      reasons.push('API-first model with managed infrastructure');
    }
  } else if (deployment === 'on_prem') {
    if (model.pricing.input === null && model.license !== 'proprietary') {
      score += 25;
      reasons.push('open weights enable on-premises deployment');
    }
  } else if (deployment === 'cloud_self') {
    if (model.pricing.input === null) {
      score += 15;
      reasons.push('open weights deployable on your own cloud VMs');
    }
  }

  // --- compliance ---
  const compliance = answers['compliance'];
  if (compliance === 'data_residency') {
    if (EU_PROVIDERS.has(model.provider)) {
      score += 20;
      reasons.push('EU-based provider supports data residency');
    }
    if (model.pricing.input === null) {
      score += 15;
      reasons.push('self-hosted option for data sovereignty');
    }
  } else if (compliance === 'hipaa' || compliance === 'pci' || compliance === 'sox') {
    if (ENTERPRISE_PROVIDERS.has(model.provider)) {
      score += 15;
      reasons.push('enterprise provider with compliance certifications');
    }
    if (model.pricing.input === null) {
      score += 10;
      reasons.push('self-hosted deployment keeps data on-premises');
    }
  }

  // --- customization ---
  const customization = answers['customization'];
  if (customization === 'fine_tune' || customization === 'both') {
    if (model.capabilities.includes('fine-tuning')) {
      score += 25;
      reasons.push('native fine-tuning support');
    }
    if (model.pricing.input === null) {
      score += 20;
      reasons.push('open weights enable custom fine-tuning');
    }
  }
  if (customization === 'prompt_only' || customization === 'both') {
    if (model.capabilities.includes('in-context-learning')) {
      score += 15;
      reasons.push('strong few-shot / in-context learning');
    }
  }

  // --- reasoning_style ---
  const reasoningStyle = answers['reasoning_style'];
  if (reasoningStyle === 'multi_step') {
    if (model.capabilities.includes('reasoning')) {
      score += 20;
      reasons.push('strong chain-of-thought reasoning');
    }
    if (model.benchmarks.mmlu !== null && model.benchmarks.mmlu >= 80) {
      score += 10;
      reasons.push('high reasoning benchmark scores');
    }
  } else if (reasoningStyle === 'single_turn') {
    if (model.pricing.input !== null && model.pricing.input < 2.0) {
      score += 10;
      reasons.push('efficient single-turn inference');
    }
  }

  const reason = reasons.slice(0, 3).join('; ') || 'Solid general-purpose model for your use case.';

  return { model, score, reason };
}

export function getRecommendations(models: Model[], answers: UserAnswers): ScoredModel[] {
  if (models.length === 0) return [];

  const scored = models.map((m) => scoreModel(m, answers)).sort((a, b) => b.score - a.score);

  const positive = scored.filter((s) => s.score > 0);
  return positive.length >= 3 ? positive : scored.slice(0, 3);
}
