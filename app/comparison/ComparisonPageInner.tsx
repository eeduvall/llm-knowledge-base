'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { StrengthsWeaknessesDiff } from '@/components/comparison/StrengthsWeaknessesDiff';
import { ModelSelector } from '@/components/comparison/ModelSelector';
import { ExportButton } from '@/components/comparison/ExportButton';
import { ShareButtons } from '@/components/comparison/ShareButtons';
import { CostCalculator } from '@/components/comparison/CostCalculator';
import { ROIProjector } from '@/components/comparison/ROIProjector';
import { CapabilityMatrix } from '@/components/comparison/CapabilityMatrix';
import { compareModels } from '@/lib/comparison';
import type { Model } from '@/lib/models';

async function fetchModels(): Promise<Model[]> {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = (await res.json()) as { models: Model[] };
  return data.models;
}

type Tab = 'table' | 'strengths' | 'cost' | 'capabilities';

type Props = {
  initialIds: string[];
};

function ComparisonClient({ initialIds }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [activeTab, setActiveTab] = useState<Tab>('table');
  const isFirstRender = useRef(true);

  const {
    data: allModels = [],
    isLoading,
    isError,
  } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
  });

  // Sync URL when selectedIds changes (skip first render to avoid double-push)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (selectedIds.length > 0) params.set('models', selectedIds.join(','));
    router.replace(`/comparison?${params.toString()}`, { scroll: false });
  }, [selectedIds, router]);

  const handleAdd = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const selectedModels = allModels.filter((m) => selectedIds.includes(m.id));
  const comparison = compareModels(selectedModels);

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/comparison?models=${selectedIds.join(',')}`
      : `/comparison?models=${selectedIds.join(',')}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'table', label: 'Side-by-side Table' },
    { id: 'strengths', label: 'Strengths & Weaknesses' },
    { id: 'cost', label: 'Cost & ROI' },
    { id: 'capabilities', label: 'Capabilities' },
  ];

  const tabPanelLabel = tabs.find((t) => t.id === activeTab)?.label ?? '';

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
        {/* Page header — responsive text sizing */}
        <div className="mb-10">
          <h1
            className="mb-3 text-2xl font-bold sm:text-4xl"
            style={{ color: 'var(--color-text)' }}
          >
            Compare Models
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--color-text-muted)' }}>
            Select up to 5 models to compare side-by-side across pricing, context window,
            benchmarks, capabilities, and strengths.
          </p>
        </div>

        {/* Model selector */}
        <div
          className="mb-8 rounded-xl p-4 sm:p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2
            className="mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Select Models
          </h2>
          {isLoading ? (
            <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              Loading models…
            </p>
          ) : isError ? (
            <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
              Failed to load models. Please refresh.
            </p>
          ) : (
            <ModelSelector
              allModels={allModels}
              selectedIds={selectedIds}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          )}
        </div>

        {/* Actions bar */}
        {selectedModels.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div
              className="flex overflow-hidden rounded-lg"
              role="tablist"
              aria-label="Comparison view"
              style={{ border: '1px solid var(--color-border)' }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3 py-2 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 sm:px-4 sm:text-sm"
                  style={{
                    background:
                      activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: activeTab === tab.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Export + Share */}
            <div className="flex items-center gap-2">
              <ExportButton models={selectedModels} />
              <ShareButtons url={shareUrl} modelNames={selectedModels.map((m) => m.name)} />
            </div>
          </div>
        )}

        {/* Comparison content */}
        {selectedModels.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center sm:p-16"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="mb-2 text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>
              No models selected
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              Use the search above to add models to your comparison.
            </p>
          </div>
        ) : (
          <div role="tabpanel" aria-label={tabPanelLabel}>
            {activeTab === 'table' && <ComparisonTable rows={comparison.rows} />}
            {activeTab === 'strengths' && <StrengthsWeaknessesDiff models={selectedModels} />}
            {activeTab === 'cost' && (
              <div className="flex flex-col gap-6">
                <CostCalculator models={selectedModels} />
                <ROIProjector models={selectedModels} />
              </div>
            )}
            {activeTab === 'capabilities' && <CapabilityMatrix models={selectedModels} />}
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper — reads URL search params and passes to client component
// ---------------------------------------------------------------------------

export default function ComparisonPageInner() {
  const searchParams = useSearchParams();
  const modelsParam = searchParams.get('models') ?? '';
  const initialIds = modelsParam
    ? modelsParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return <ComparisonClient initialIds={initialIds} />;
}
