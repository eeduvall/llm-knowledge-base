// ---------------------------------------------------------------------------
// Q&A Picker Flow — Decision Tree
// ---------------------------------------------------------------------------
// This module implements the progressive question funnel described in README.md.
// It is pure logic — no React, no side effects. Treat changes here with the
// same care as a pricing algorithm: test every branch (AGENTS.md §15.10).
// ---------------------------------------------------------------------------

import type { Model } from './models';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnswerId = string;

export type Answer = {
  id: AnswerId;
  label: string;
  /** Optional hint text shown below the label */
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
  /** Plain-English explanation of why this model fits */
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
      { id: 'chatbot', label: 'Customer-facing chatbot', hint: 'Conversational UI, support, Q&A' },
      { id: 'code', label: 'Code assistant / copilot', hint: 'Autocomplete, review, generation' },
      {
        id: 'rag',
        label: 'Document analysis / RAG pipeline',
        hint: 'Retrieval, summarisation, citations',
      },
      {
        id: 'agent',
        label: 'Autonomous agent / tool-use',
        hint: 'Multi-step tasks, function calling',
      },
      {
        id: 'creative',
        label: 'Creative / generative content',
        hint: 'Writing, images, multimodal',
      },
    ],
  },
  {
    id: 'latency',
    text: "What's your latency budget?",
    answers: [
      { id: 'fast', label: '< 500 ms', hint: 'Real-time, streaming required' },
      { id: 'medium', label: '1–2 seconds', hint: 'Acceptable for most chat UIs' },
      { id: 'flexible', label: 'Flexible', hint: 'Batch jobs, async pipelines' },
    ],
  },
  {
    id: 'budget',
    text: "What's your monthly token budget?",
    answers: [
      { id: 'low', label: 'Low (< $50 / month)', hint: 'Prototypes, personal projects' },
      { id: 'mid', label: 'Medium ($50–$500 / month)', hint: 'Small production apps' },
      { id: 'high', label: 'High (> $500 / month)', hint: 'Enterprise / high-volume' },
      { id: 'self_host', label: 'Self-hosted / open weights', hint: 'No per-token cost' },
    ],
  },
  {
    id: 'context',
    text: 'How large is your typical input?',
    answers: [
      { id: 'short', label: 'Short (< 8K tokens)', hint: 'Single messages, small docs' },
      { id: 'medium', label: 'Medium (8K–100K tokens)', hint: 'Long documents, codebases' },
      { id: 'long', label: 'Very long (> 100K tokens)', hint: 'Books, large corpora' },
    ],
  },
  {
    id: 'modality',
    text: 'Do you need multimodal input?',
    answers: [
      { id: 'text_only', label: 'Text only', hint: 'No images or audio' },
      { id: 'vision', label: 'Images / vision', hint: 'Screenshots, diagrams, photos' },
      { id: 'audio', label: 'Audio', hint: 'Speech, voice input' },
      { id: 'multimodal', label: 'Multiple modalities', hint: 'Text + images + audio' },
    ],
  },
  {
    id: 'license',
    text: 'Do you need open weights / self-hostable models?',
    answers: [
      {
        id: 'open',
        label: 'Yes — open weights required',
        hint: 'On-prem, air-gapped, full control',
      },
      { id: 'any', label: 'No preference', hint: 'Proprietary APIs are fine' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scoring logic
// ---------------------------------------------------------------------------

/**
 * Determine which questions to show based on answers so far.
 * Returns the next unanswered question, or null if the funnel is complete.
 */
export function getNextQuestion(answers: UserAnswers): Question | null {
  for (const q of QUESTIONS) {
    if (!(q.id in answers)) {
      return q;
    }
  }
  return null;
}

/**
 * Returns true when all questions have been answered.
 */
export function isFunnelComplete(answers: UserAnswers): boolean {
  return QUESTIONS.every((q) => q.id in answers);
}

/**
 * Score a single model against the user's answers.
 * Returns a numeric score (higher = better fit) and a reason string.
 */
export function scoreModel(model: Model, answers: UserAnswers): ScoredModel {
  let score = 0;
  const reasons: string[] = [];

  // --- Use case ---
  const useCase = answers['use_case'];
  if (useCase === 'code') {
    if (model.capabilities.includes('code')) {
      score += 30;
      reasons.push('strong code generation capabilities');
    }
  } else if (useCase === 'rag') {
    if (model.capabilities.includes('long-context') || model.context_window >= 100000) {
      score += 25;
      reasons.push('large context window suits RAG pipelines');
    }
    if (model.capabilities.includes('structured-output')) {
      score += 10;
      reasons.push('structured output for citation grounding');
    }
  } else if (useCase === 'agent') {
    if (model.capabilities.includes('tool-use')) {
      score += 30;
      reasons.push('native tool-use / function calling');
    }
    if (model.capabilities.includes('structured-output')) {
      score += 10;
      reasons.push('reliable structured JSON output');
    }
  } else if (useCase === 'chatbot') {
    if (model.capabilities.includes('reasoning')) {
      score += 15;
      reasons.push('strong reasoning for conversational quality');
    }
  } else if (useCase === 'creative') {
    if (model.modalities.includes('image')) {
      score += 20;
      reasons.push('multimodal for creative content');
    }
    if (model.capabilities.includes('reasoning')) {
      score += 10;
      reasons.push('reasoning supports creative coherence');
    }
  }

  // --- Latency ---
  const latency = answers['latency'];
  const inputPrice = model.pricing.input;
  if (latency === 'fast') {
    // Prefer cheaper/smaller models which tend to be faster
    if (inputPrice !== null && inputPrice < 1.0) {
      score += 15;
      reasons.push('low cost tier typically means faster inference');
    }
  } else if (latency === 'flexible') {
    // Heavier models are fine
    if (inputPrice !== null && inputPrice >= 5.0) {
      score += 5;
      reasons.push('premium model fits flexible latency budget');
    }
  }

  // --- Budget ---
  const budget = answers['budget'];
  if (budget === 'low') {
    if (inputPrice !== null && inputPrice < 0.5) {
      score += 25;
      reasons.push('very low cost per token');
    } else if (inputPrice !== null && inputPrice < 2.0) {
      score += 10;
    } else if (inputPrice !== null && inputPrice >= 5.0) {
      score -= 15;
    }
  } else if (budget === 'mid') {
    if (inputPrice !== null && inputPrice >= 0.5 && inputPrice < 5.0) {
      score += 15;
      reasons.push('mid-range pricing fits your budget');
    }
  } else if (budget === 'high') {
    if (inputPrice !== null && inputPrice >= 5.0) {
      score += 10;
      reasons.push('premium model justified by high-volume budget');
    }
  } else if (budget === 'self_host') {
    if (model.pricing.input === null && model.pricing.output === null) {
      score += 40;
      reasons.push('open weights — no per-token cost, fully self-hostable');
    } else {
      score -= 20;
    }
  }

  // --- Context window ---
  const context = answers['context'];
  if (context === 'long') {
    if (model.context_window >= 500000) {
      score += 30;
      reasons.push(`massive ${(model.context_window / 1000).toFixed(0)}K context window`);
    } else if (model.context_window >= 100000) {
      score += 15;
      reasons.push(`large ${(model.context_window / 1000).toFixed(0)}K context window`);
    } else {
      score -= 10;
    }
  } else if (context === 'medium') {
    if (model.context_window >= 100000) {
      score += 10;
      reasons.push('ample context for medium-length documents');
    }
  }

  // --- Modality ---
  const modality = answers['modality'];
  if (modality === 'vision' || modality === 'multimodal') {
    if (model.modalities.includes('image')) {
      score += 20;
      reasons.push('native vision / image understanding');
    } else {
      score -= 15;
    }
  }
  if (modality === 'audio' || modality === 'multimodal') {
    if (model.modalities.includes('audio')) {
      score += 15;
      reasons.push('native audio input support');
    } else if (modality === 'audio') {
      score -= 15;
    }
  }

  // --- License ---
  const license = answers['license'];
  if (license === 'open') {
    const openLicenses = ['apache-2.0', 'mit', 'llama'];
    if (openLicenses.includes(model.license)) {
      score += 30;
      reasons.push(`open ${model.license} license — fully self-hostable`);
    } else {
      score -= 25;
    }
  }

  // Baseline quality boost from benchmarks
  if (model.benchmarks.mmlu !== null && model.benchmarks.mmlu >= 85) {
    score += 5;
    reasons.push('top-tier benchmark scores');
  }

  const reason =
    reasons.length > 0
      ? reasons.slice(0, 3).join('; ') + '.'
      : 'Solid general-purpose model for your use case.';

  return { model, score, reason };
}

/**
 * Score all models and return them sorted by score descending.
 * Only returns models with a positive score (relevant matches).
 * Always returns at least 3 results even if scores are low.
 */
export function getRecommendations(models: Model[], answers: UserAnswers): ScoredModel[] {
  const scored = models.map((m) => scoreModel(m, answers));
  scored.sort((a, b) => b.score - a.score);

  // Always return at least 3 results
  const positive = scored.filter((s) => s.score > 0);
  if (positive.length >= 3) return positive;

  return scored.slice(0, Math.max(3, positive.length));
}
