'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { GraphNode, GraphEdge } from '@/lib/graph-layout'
import { tickLayout } from '@/lib/graph-layout'

type Props = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedId: string | null
  hoveredId: string | null
  filterProvider: string | null
  onSelectNode: (id: string | null) => void
  onHoverNode: (id: string | null) => void
}

export function GraphCanvas({
  nodes,
  edges,
  selectedId,
  hoveredId,
  filterProvider,
  onSelectNode,
  onHoverNode,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const nodesRef = useRef<GraphNode[]>(nodes)
  const edgesRef = useRef<GraphEdge[]>(edges)
  const tRef = useRef(0)
  const synapseRef = useRef<{ id: string; t: number } | null>(null)

  // Keep refs in sync with props
  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  // Trigger synapse animation on hover
  useEffect(() => {
    if (hoveredId) {
      synapseRef.current = { id: hoveredId, t: 0 }
    }
  }, [hoveredId])

  const getNodeAt = useCallback((x: number, y: number): GraphNode | null => {
    for (const node of nodesRef.current) {
      const visible =
        filterProvider === null || node.provider === filterProvider
      if (!visible) continue
      const dx = node.x - x
      const dy = node.y - y
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) return node
    }
    return null
  }, [filterProvider])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      tRef.current += 0.008
      const t = tRef.current
      const w = canvas.width
      const h = canvas.height
      const nodes = nodesRef.current
      const edges = edgesRef.current

      // Advance synapse animation
      if (synapseRef.current) {
        synapseRef.current.t += 0.04
        if (synapseRef.current.t > 1) synapseRef.current = null
      }

      // Run physics
      tickLayout(nodes, edges, w, h)

      ctx.clearRect(0, 0, w, h)

      // Draw edges
      for (const edge of edges) {
        const a = nodes.find((n) => n.id === edge.source)
        const b = nodes.find((n) => n.id === edge.target)
        if (!a || !b) continue

        const aVisible =
          filterProvider === null || a.provider === filterProvider
        const bVisible =
          filterProvider === null || b.provider === filterProvider
        if (!aVisible && !bVisible) continue

        const alpha = aVisible && bVisible ? 0.35 : 0.1

        // Synapse glow on hovered node's edges
        let lineWidth = 0.8
        let extraAlpha = 0
        if (
          synapseRef.current &&
          (edge.source === synapseRef.current.id ||
            edge.target === synapseRef.current.id)
        ) {
          const progress = synapseRef.current.t
          extraAlpha = Math.max(0, 0.6 * (1 - progress))
          lineWidth = 1.5
        }

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
        const aAlpha = Math.round((alpha + extraAlpha) * 255)
          .toString(16)
          .padStart(2, '0')
        const bAlpha = Math.round((alpha + extraAlpha) * 0.6 * 255)
          .toString(16)
          .padStart(2, '0')
        grad.addColorStop(0, a.color + aAlpha)
        grad.addColorStop(1, b.color + bAlpha)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = lineWidth
        ctx.stroke()
      }

      // Draw nodes
      for (const node of nodes) {
        const visible =
          filterProvider === null || node.provider === filterProvider
        const isSelected = node.id === selectedId
        const isHovered = node.id === hoveredId
        const dimmed = !visible

        const pulse = 1 + 0.08 * Math.sin(t * 2 + node.pulseOffset)
        const r = node.radius * pulse * (isSelected ? 1.4 : isHovered ? 1.2 : 1)
        const globalAlpha = dimmed ? 0.15 : 1

        ctx.globalAlpha = globalAlpha

        // Outer glow
        const glowR = r * (isSelected ? 5 : isHovered ? 4.5 : 4)
        const glow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowR
        )
        const glowAlpha = isSelected ? '60' : isHovered ? '50' : '30'
        glow.addColorStop(0, node.color + glowAlpha)
        glow.addColorStop(1, node.color + '00')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()

        // Core sphere
        const core = ctx.createRadialGradient(
          node.x - r * 0.3,
          node.y - r * 0.3,
          0,
          node.x,
          node.y,
          r
        )
        core.addColorStop(0, '#ffffff')
        core.addColorStop(0.4, node.color)
        core.addColorStop(1, node.color + 'aa')
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = core
        ctx.fill()

        // Selection ring
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2)
          ctx.strokeStyle = node.color + 'cc'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        ctx.globalAlpha = 1

        // Label
        if (visible && (isSelected || isHovered || node.radius >= 7)) {
          ctx.font = `${isSelected ? 'bold ' : ''}11px "Inter", sans-serif`
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.75)'
          ctx.textAlign = 'center'
          ctx.fillText(node.label, node.x, node.y + r + 14)
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [selectedId, hoveredId, filterProvider])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const node = getNodeAt(x, y)
      onHoverNode(node ? node.id : null)
      canvas.style.cursor = node ? 'pointer' : 'default'
    },
    [getNodeAt, onHoverNode]
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const node = getNodeAt(x, y)
      onSelectNode(node ? node.id : null)
    },
    [getNodeAt, onSelectNode]
  )

  const handleMouseLeave = useCallback(() => {
    onHoverNode(null)
  }, [onHoverNode])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      aria-label="Interactive LLM knowledge graph"
      role="img"
    />
  )
}
