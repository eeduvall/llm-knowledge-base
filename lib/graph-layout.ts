// Graph layout configuration for the 2-D force-directed graph.
// Uses a simple spring-repulsion simulation (no external dependency needed).

export type GraphNode = {
  id: string
  label: string
  provider: string
  family: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  pulseOffset: number
}

export type GraphEdge = {
  source: string
  target: string
  strength: number
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const REPULSION = 3500
const SPRING_LENGTH = 120
const SPRING_STRENGTH = 0.04
const DAMPING = 0.88
const CENTER_GRAVITY = 0.015

// ---------------------------------------------------------------------------
// Force simulation tick
// ---------------------------------------------------------------------------

export function tickLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  // width and height are kept for API compatibility but the gravity center is
  // always world-space origin (0, 0) — the camera transform in GraphCanvas
  // maps (0, 0) to the screen centre.
  _width: number,
  _height: number
): void {
  // Repulsion between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = REPULSION / (dist * dist)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx -= fx
      a.vy -= fy
      b.vx += fx
      b.vy += fy
    }
  }

  // Spring attraction along edges
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  for (const edge of edges) {
    const a = nodeMap.get(edge.source)
    const b = nodeMap.get(edge.target)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const displacement = dist - SPRING_LENGTH
    const force = displacement * SPRING_STRENGTH * edge.strength
    const fx = (dx / dist) * force
    const fy = (dy / dist) * force
    a.vx += fx
    a.vy += fy
    b.vx -= fx
    b.vy -= fy
  }

  // Gravity toward world-space origin (0, 0), which the camera maps to the
  // screen centre.
  for (const node of nodes) {
    node.vx += (0 - node.x) * CENTER_GRAVITY
    node.vy += (0 - node.y) * CENTER_GRAVITY
  }

  // Integrate velocities
  for (const node of nodes) {
    node.vx *= DAMPING
    node.vy *= DAMPING
    node.x += node.vx
    node.y += node.vy
  }
}

// ---------------------------------------------------------------------------
// Edge generation from model data
// ---------------------------------------------------------------------------

export function buildEdges(
  nodes: GraphNode[],
  modelFamilies: Record<string, string>
): GraphEdge[] {
  const edges: GraphEdge[] = []
  const added = new Set<string>()

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const key = `${a.id}--${b.id}`
      if (added.has(key)) continue

      // Same family → strong edge
      if (modelFamilies[a.id] === modelFamilies[b.id]) {
        edges.push({ source: a.id, target: b.id, strength: 1.5 })
        added.add(key)
        continue
      }

      // Same provider → medium edge
      if (a.provider === b.provider) {
        edges.push({ source: a.id, target: b.id, strength: 0.8 })
        added.add(key)
      }
    }
  }

  return edges
}
