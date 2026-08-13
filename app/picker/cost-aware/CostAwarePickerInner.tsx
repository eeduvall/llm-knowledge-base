'use client';

import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { CostAwarePicker } from '@/components/picker/CostAwarePicker';
import type { Model } from '@/lib/models';

async function fetchModels(): Promise<Model[]> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = (await res.json()) as { models: Model[] };
  return data.models;
}

export function CostAwarePickerPage() {
  const {
    data: models = [],
    isLoading,
    isError,
  } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
  });

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />
      <div className="flex flex-col items-center px-6 pt-28 pb-24">
        <div className="w-full max-w-2xl mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>
            Cost-Aware Model Picker
          </h1>
          <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
            Set your budget, latency, and capability requirements — we&apos;ll find the cheapest
            model that meets them all.
          </p>
        </div>

        {isLoading && (
          <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
            Loading models…
          </p>
        )}
        {isError && (
          <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Failed to load models. Please refresh.
          </p>
        )}
        {!isLoading && !isError && <CostAwarePicker models={models} />}
      </div>
    </main>
  );
}
