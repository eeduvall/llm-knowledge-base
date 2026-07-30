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

type Camera = {
  x: number
  y: number
  scale: number
}

type CameraTarget = Camera

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

  // Camera state: current and target for smooth interpolation
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 })
  const cameraTargetRef = useRef<CameraTarget>({ x: 0, y: 0, scale: 1 })

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

  // Zoom-to-fit when filter changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const w = canvas.offsetWidth || canvas.width
    const h = canvas.offsetHeight || canvas.height

    if (filterProvider === null) {
      // Reset to default view
      cameraTargetRef.current = { x: 0, y: 0, scale: 1 }
      return
    }

    // Compute bounding box of visible nodes
    const visibleNodes = nodesRef.current.filter(
      (n) => n.provider === filterProvider
    )
    if (visibleNodes.length === 0) {
      cameraTargetRef.current = { x: 0, y: 0, scale: 1 }
      return
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const n of visibleNodes) {
      minX = Math.min(minX, n.x - n.radius)
      maxX = Math.max(maxX, n.x + n.radius)
      minY = Math.min(minY, n.y - n.radius)
      maxY = Math.max(maxY, n.y + n.radius)
    }

    const padding = 80
    const bboxW = maxX - minX + padding * 2
    const bboxH = maxY - minY + padding * 2
    const bboxCx = (minX + maxX) / 2
    const bboxCy = (minY + maxY) / 2

    const scaleX = w / bboxW
    const scaleY = h / bboxH
    const scale = Math.min(scaleX, scaleY, 2.5) // cap at 2.5×

    // Camera offset: translate so bbox center maps to canvas center
    // After transform: screenX = (worldX - cx) * scale + w/2
    // We want bboxCx to map to w/2, so cx = bboxCx
    cameraTargetRef.current = {
      x: bboxCx,
      y: bboxCy,
      scale,
    }
  }, [filterProvider])

  const getNodeAt = useCallback(
    (screenX: number, screenY: number): GraphNode | null => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const w = canvas.width
      const h = canvas.height
      const cam = cameraRef.current

      // Convert screen coords to world coords
      const worldX = (screenX - w / 2) / cam.scale + cam.x
      const worldY = (screenY - h / 2) / cam.scale + cam.y

      for (const node of nodesRef.current) {
        const visible =
          filterProvider === null || node.provider === filterProvider
        if (!visible) continue
        const dx = node.x - worldX
        const dy = node.y - worldY
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6 / cam.scale)
          return node
      }
      return null
    },
    [filterProvider]
  )

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

    const LERP = 0.08 // smoothing factor per frame

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

      // Smooth camera interpolation
      const cam = cameraRef.current
      const target = cameraTargetRef.current
      cam.x += (target.x - cam.x) * LERP
      cam.y += (target.y - cam.y) * LERP
      cam.scale += (target.scale - cam.scale) * LERP

      ctx.clearRect(0, 0, w, h)

      // Apply camera transform: translate so world-center maps to canvas-center
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(cam.scale, cam.scale)
      ctx.translate(-cam.x, -cam.y)

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

      ctx.restore()

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
