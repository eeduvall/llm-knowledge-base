import { Suspense } from 'react';
import type { Metadata } from 'next';
import ComparisonPageInner from './ComparisonPageInner';

export const metadata: Metadata = {
  title: 'Compare Models — LLM Knowledge Base',
  description:
    'Side-by-side comparison of LLMs: pricing, context window, benchmarks, capabilities, strengths, and weaknesses.',
};

export default function ComparisonPage() {
  return (
    <Suspense fallback={null}>
      <ComparisonPageInner />
    </Suspense>
  );
}
