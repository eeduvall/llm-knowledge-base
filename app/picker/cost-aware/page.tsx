import { Suspense } from 'react';
import CostAwarePickerPage from './CostAwarePickerInner';

export const metadata = {
  title: 'Cost-Aware Model Picker — LLM Knowledge Base',
  description:
    'Find the cheapest LLM that meets your latency, capability, and context-window requirements.',
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CostAwarePickerPage />
    </Suspense>
  );
}
