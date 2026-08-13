'use client';

import { useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import type { Model } from '@/lib/models';
import { getProviderColor } from '@/lib/models';
import type { GraphNode, GraphEdge, NodeMeta } from '@/lib/graph-layout';
import { buildEdges, deriveCostTier } from '@/lib/graph-layout';
import { NodePanel } from '@/components/graph/NodePanel';
import { FilterBar } from '@/components/graph/FilterBar';
import { useGraphStore } from '@/lib/store/graph-store';

// Lazy-load the R3F canvas — Three.js must never run during SSR.
const GraphCanvas = dynamic(
  () => import('@/components/graph/GraphCanvas').then((m) => ({ default: m.GraphCanvas })),
  { ssr: false },
);

type Props = {
  /** Initial model list from the server (SSR). TanStack Query will refresh
   *  from /api/models in the background and keep the graph up to date. */
  initialModels: Model[];
};

async function fetchModels(): Promise<Model[]> {
  const res = await fetch('/api/models');
  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { models: Model[] };
  return json.models;
}

function buildNodes(models: Model[]): GraphNode[] {
  return models.map((model, i) => {
    const angle = (i / models.length) * Math.PI * 2;
    const radius = 200 + Math.random() * 80;
    const phi = Math.acos(2 * Math.random() - 1);
    const r3d = radius * 0.6;
    return {
      id: model.id,
      label: model.name,
      provider: model.provider,
      family: model.family,
      color: getProviderColor(model.provider),
      x: r3d * Math.sin(phi) * Math.cos(angle),
      y: r3d * Math.sin(phi) * Math.sin(angle),
      z: r3d * Math.cos(phi),
      vx: 0,
      vy: 0,
      vz: 0,
      radius: model.context_window >= 500_000 ? 9 : model.context_window >= 100_000 ? 7 : 5,
      pulseOffset: Math.random() * Math.PI * 2,
    };
  });
}

function buildMetaMap(models: Model[]): Record<string, NodeMeta> {
  const map: Record<string, NodeMeta> = {};
  for (const m of models) {
    map[m.id] = {
      family: m.family,
      provider: m.provider,
      primaryModality: m.modalities[0] ?? 'text',
      costTier: deriveCostTier(m.pricing.input),
      mmlu: m.benchmarks.mmlu,
    };
  }
  return map;
}

export function GraphExplorer({ initialModels }: Props) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight') ?? null;

  // ── Zustand store ──────────────────────────────────────────────────────────
  const {
    selectedId,
    hoveredId,
    filterProvider,
    activeCapabilities,
    activeModalities,
    activeLicenses,
    clusterMode,
    searchQuery,
    setSelectedId,
    setHoveredId,
    setFilterProvider,
    toggleCapability,
    toggleModality,
    toggleLicense,
    setClusterMode,
    setSearchQuery,
    setHighlightId,
    clearAllFilters,
  } = useGraphStore();

  // Sync the ?highlight query param into the store on mount / param change
  useEffect(() => {
    if (highlightId !== null) {
      setHighlightId(highlightId);
      setSelectedId(highlightId);
      setSearchQuery('');
    }
  }, [highlightId, setHighlightId, setSelectedId, setSearchQuery]);

  // Fetch models from the API; use the SSR-provided list as initial data so
  // the graph renders immediately without a loading flash.
  const { data: models = initialModels } = useQuery<Model[]>({
    queryKey: ['models'],
    queryFn: fetchModels,
    initialData: initialModels,
  });

  const nodes = useMemo(() => buildNodes(models), [models]);
  const metaMap = useMemo(() => buildMetaMap(models), [models]);
  const edges = useMemo<GraphEdge[]>(
    () => buildEdges(nodes, metaMap, clusterMode),
    [nodes, metaMap, clusterMode],
  );

  // Derive unique filter options from model data
  const providers = useMemo(
    () => Array.from(new Set(models.map((m) => m.provider))).sort(),
    [models],
  );

  const allCapabilities = useMemo(
    () => Array.from(new Set(models.flatMap((m) => m.capabilities))).sort(),
    [models],
  );

  const allModalities = useMemo(
    () => Array.from(new Set(models.flatMap((m) => m.modalities as string[]))).sort(),
    [models],
  );

  const allLicenses = useMemo(
    () => Array.from(new Set(models.map((m) => m.license))).sort(),
    [models],
  );

  // Build a set of model ids that pass all active filters
  const visibleIds = useMemo(() => {
    return new Set(
      models
        .filter((m) => {
          if (filterProvider !== null && m.provider !== filterProvider) return false;
          if (
            activeCapabilities.length > 0 &&
            !activeCapabilities.every((c) => m.capabilities.includes(c))
          )
            return false;
          if (
            activeModalities.length > 0 &&
            !activeModalities.every((mod) => (m.modalities as string[]).includes(mod))
          )
            return false;
          if (activeLicenses.length > 0 && !activeLicenses.includes(m.license)) return false;
          return true;
        })
        .map((m) => m.id),
    );
  }, [models, filterProvider, activeCapabilities, activeModalities, activeLicenses]);

  // Apply search: highlight matching nodes (all matches, not just first)
  const searchMatchIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matched = models
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.family.toLowerCase().includes(q) ||
          m.capabilities.some((c) => c.toLowerCase().includes(q)),
      )
      .map((m) => m.id);
    return new Set(matched);
  }, [searchQuery, models]);

  // Effective visible set: intersection of filter-based and search-based
  const effectiveVisibleIds = useMemo(() => {
    if (!searchMatchIds) return visibleIds;
    return new Set([...visibleIds].filter((id) => searchMatchIds.has(id)));
  }, [visibleIds, searchMatchIds]);

  const effectiveSelectedId = useMemo(() => {
    if (searchQuery.trim() && searchMatchIds && searchMatchIds.size > 0) {
      if (selectedId && searchMatchIds.has(selectedId)) return selectedId;
      return [...searchMatchIds][0] ?? selectedId;
    }
    return selectedId;
  }, [searchQuery, searchMatchIds, selectedId]);

  const selectedModel = useMemo(
    () => models.find((m) => m.id === effectiveSelectedId) ?? null,
    [models, effectiveSelectedId],
  );

  const handleSelectNode = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      setSearchQuery('');
    },
    [setSelectedId, setSearchQuery],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedId(null);
    setSearchQuery('');
  }, [setSelectedId, setSearchQuery]);

  return (
    <div className="relative w-full h-full">
      <FilterBar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        providers={providers}
        activeProvider={filterProvider}
        onSelectProvider={setFilterProvider}
        capabilities={allCapabilities}
        activeCapabilities={activeCapabilities}
        onToggleCapability={toggleCapability}
        modalities={allModalities}
        activeModalities={activeModalities}
        onToggleModality={toggleModality}
        licenses={allLicenses}
        activeLicenses={activeLicenses}
        onToggleLicense={toggleLicense}
        clusterMode={clusterMode}
        onSetClusterMode={setClusterMode}
        onClearAllFilters={clearAllFilters}
      />

      {/* Canvas is offset to the right of the filter panel (13rem = 208px) */}
      <div className="absolute top-0 right-0 bottom-0" style={{ left: '13rem' }}>
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          selectedId={effectiveSelectedId}
          hoveredId={hoveredId}
          visibleIds={effectiveVisibleIds}
          highlightId={highlightId}
          onSelectNode={handleSelectNode}
          onHoverNode={setHoveredId}
        />
      </div>

      {selectedModel && <NodePanel model={selectedModel} onClose={handleClosePanel} />}

      {/* Provider color legend */}
      <div
        className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10"
        role="list"
        aria-label="Provider color legend"
      >
        {providers.map((provider) => {
          const color = getProviderColor(provider);
          return (
            <div key={provider} className="flex items-center gap-2" role="listitem">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span
                className="text-xs font-mono capitalize"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {provider}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}