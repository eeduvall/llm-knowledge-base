'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Model } from '@/lib/models'
import { getProviderColor } from '@/lib/models'
import type { GraphNode, GraphEdge } from '@/lib/graph-layout'
import { buildEdges } from '@/lib/graph-layout'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { NodePanel } from '@/components/graph/NodePanel'
import { FilterBar } from '@/components/graph/FilterBar'

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

export function GraphExplorer({ models }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filterProvider, setFilterProvider] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const nodes = useMemo(() => buildNodes(models), [models])

  const edges = useMemo<GraphEdge[]>(() => {
    const familyMap: Record<string, string> = {}
    for (const m of models) familyMap[m.id] = m.family
    return buildEdges(nodes, familyMap)
  }, [nodes, models])

  const providers = useMemo(
    () => Array.from(new Set(models.map((m) => m.provider))).sort(),
    [models]
  )

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

  return (
    <div className="relative w-full h-full">
      <FilterBar
        providers={providers}
        activeProvider={filterProvider}
        onSelect={setFilterProvider}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <GraphCanvas
        nodes={nodes}
        edges={edges}
        selectedId={effectiveSelectedId}
        hoveredId={hoveredId}
        filterProvider={filterProvider}
        onSelectNode={handleSelectNode}
        onHoverNode={setHoveredId}
      />

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
              <span className="text-xs font-mono capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {provider}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
