'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Model, Modality } from '@/lib/models'
import { getProviderColor } from '@/lib/models'
import type { GraphNode, GraphEdge, NodeMeta } from '@/lib/graph-layout'
import { buildEdges, deriveCostTier } from '@/lib/graph-layout'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { NodePanel } from '@/components/graph/NodePanel'
import { FilterBar } from '@/components/graph/FilterBar'
import type { ClusterMode } from '@/components/graph/FilterBar'

type Props = {
  models: Model[]
}

function buildNodes(models: Model[]): GraphNode[] {
  return models.map((model, i) => {
    const angle = (i / models.length) * Math.PI * 2
    const radius = 200 + Math.random() * 80
    return {
      id: model.id,
      label: model.name,
      provider: model.provider,
      family: model.family,
      color: getProviderColor(model.provider),
      // Initial positions centered on world-space origin (0, 0) so the camera
      // transform in GraphCanvas (which maps world origin to screen centre)
      // starts the nodes in the visible area.
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      radius: model.context_window >= 500_000 ? 9 : model.context_window >= 100_000 ? 7 : 5,
      pulseOffset: Math.random() * Math.PI * 2,
    }
  })
}

function buildMetaMap(models: Model[]): Record<string, NodeMeta> {
  const map: Record<string, NodeMeta> = {}
  for (const m of models) {
    map[m.id] = {
      family: m.family,
      provider: m.provider,
      primaryModality: m.modalities[0] ?? 'text',
      costTier: deriveCostTier(m.pricing.input),
      mmlu: m.benchmarks.mmlu,
    }
  }
  return map
}

export function GraphExplorer({ models }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filterProvider, setFilterProvider] = useState<string | null>(null)
  const [activeCapabilities, setActiveCapabilities] = useState<string[]>([])
  const [activeModalities, setActiveModalities] = useState<Modality[]>([])
  const [activeLicenses, setActiveLicenses] = useState<string[]>([])
  const [clusterMode, setClusterMode] = useState<ClusterMode>('family')
  const [searchQuery, setSearchQuery] = useState('')

  const nodes = useMemo(() => buildNodes(models), [models])

  const metaMap = useMemo(() => buildMetaMap(models), [models])

  const edges = useMemo<GraphEdge[]>(
    () => buildEdges(nodes, metaMap, clusterMode),
    [nodes, metaMap, clusterMode]
  )

  // Derive unique filter options from model data
  const providers = useMemo(
    () => Array.from(new Set(models.map((m) => m.provider))).sort(),
    [models]
  )

  const allCapabilities = useMemo(
    () => Array.from(new Set(models.flatMap((m) => m.capabilities))).sort(),
    [models]
  )

  const allModalities = useMemo(
    () => Array.from(new Set(models.flatMap((m) => m.modalities))).sort() as Modality[],
    [models]
  )

  const allLicenses = useMemo(
    () => Array.from(new Set(models.map((m) => m.license))).sort(),
    [models]
  )

  // Build a set of model ids that pass all active filters
  const visibleIds = useMemo(() => {
    return new Set(
      models
        .filter((m) => {
          if (filterProvider !== null && m.provider !== filterProvider) return false
          if (
            activeCapabilities.length > 0 &&
            !activeCapabilities.every((c) => m.capabilities.includes(c))
          )
            return false
          if (
            activeModalities.length > 0 &&
            !activeModalities.every((mod) => m.modalities.includes(mod))
          )
            return false
          if (activeLicenses.length > 0 && !activeLicenses.includes(m.license))
            return false
          return true
        })
        .map((m) => m.id)
    )
  }, [models, filterProvider, activeCapabilities, activeModalities, activeLicenses])

  // Apply search: highlight matching node
  const effectiveSelectedId = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const match = models.find(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
      )
      return match ? match.id : selectedId
    }
    return selectedId
  }, [searchQuery, models, selectedId])

  const selectedModel = useMemo(
    () => models.find((m) => m.id === effectiveSelectedId) ?? null,
    [models, effectiveSelectedId]
  )

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedId(id)
    setSearchQuery('')
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedId(null)
    setSearchQuery('')
  }, [])

  const handleToggleCapability = useCallback((cap: string) => {
    setActiveCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    )
  }, [])

  const handleToggleModality = useCallback((mod: string) => {
    setActiveModalities((prev) => {
      const m = mod as Modality
      return prev.includes(m) ? prev.filter((v) => v !== m) : [...prev, m]
    })
  }, [])

  const handleToggleLicense = useCallback((lic: string) => {
    setActiveLicenses((prev) =>
      prev.includes(lic) ? prev.filter((l) => l !== lic) : [...prev, lic]
    )
  }, [])

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
        onToggleCapability={handleToggleCapability}
        modalities={allModalities}
        activeModalities={activeModalities}
        onToggleModality={handleToggleModality}
        licenses={allLicenses}
        activeLicenses={activeLicenses}
        onToggleLicense={handleToggleLicense}
        clusterMode={clusterMode}
        onSetClusterMode={setClusterMode}
      />

      {/* Canvas is offset to the right of the filter panel (13rem = 208px) */}
      <div className="absolute top-0 right-0 bottom-0" style={{ left: '13rem' }}>
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          selectedId={effectiveSelectedId}
          hoveredId={hoveredId}
          visibleIds={visibleIds}
          onSelectNode={handleSelectNode}
          onHoverNode={setHoveredId}
        />
      </div>

      {selectedModel && (
        <NodePanel model={selectedModel} onClose={handleClosePanel} />
      )}

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10"
        role="list"
        aria-label="Provider color legend"
      >
        {providers.map((provider) => {
          const color = getProviderColor(provider)
          return (
            <div key={provider} className="flex items-center gap-2" role="listitem">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className="text-xs font-mono capitalize" style={{ color: 'var(--color-text-faint)' }}>
                {provider}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
