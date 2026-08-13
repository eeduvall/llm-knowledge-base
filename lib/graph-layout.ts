// Graph layout configuration for the 3-D force-directed graph.
// Uses a simple spring-repulsion simulation (no external dependency needed).

export type GraphNode = {
  id: string;
  label: string;
  provider: string;
  family: string;
  color: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  pulseOffset: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  strength: number;
};

/**
 * Metadata used by buildEdges to determine clustering relationships.
 * All fields are optional so callers can supply only what they have.
 */
export type NodeMeta = {
  family: string;
  provider: string;
  /** Primary modality (first entry in the model's modalities array). */
  primaryModality?: string;
  /** Cost tier derived from input pricing: 'free' | 'low' | 'mid' | 'high' */
  costTier?: string;
  /** MMLU benchmark score, used to group by performance band. */
  mmlu?: number | null;
};

/**
 * Clustering axis that determines which edges buildEdges creates.
 * Matches the ClusterMode type exported from FilterBar.
 */
export type ClusterMode = 'family' | 'provider' | 'cost-tier' | 'modality' | 'benchmark';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const REPULSION = 3500;
const SPRING_LENGTH = 120;
const SPRING_STRENGTH = 0.04;
const DAMPING = 0.88;
const CENTER_GRAVITY = 0.015;

// ---------------------------------------------------------------------------
// Force simulation tick (3-D)
// ---------------------------------------------------------------------------

export function tickLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  // width and height are kept for API compatibility but the gravity center is
  // always world-space origin (0, 0, 0).
  _width: number,
  _height: number,
): void {
  // Repulsion between all node pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;
      a.vx -= fx;
      a.vy -= fy;
      a.vz -= fz;
      b.vx += fx;
      b.vy += fy;
      b.vz += fz;
    }
  }

  // Spring attraction along edges
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    const displacement = dist - SPRING_LENGTH;
    const force = displacement * SPRING_STRENGTH * edge.strength;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    const fz = (dz / dist) * force;
    a.vx += fx;
    a.vy += fy;
    a.vz += fz;
    b.vx -= fx;
    b.vy -= fy;
    b.vz -= fz;
  }

  // Gravity toward world-space origin (0, 0, 0)
  for (const node of nodes) {
    node.vx += (0 - node.x) * CENTER_GRAVITY;
    node.vy += (0 - node.y) * CENTER_GRAVITY;
    node.vz += (0 - node.z) * CENTER_GRAVITY;
  }

  // Integrate velocities
  for (const node of nodes) {
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.vz *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;
    node.z += node.vz;
  }
}

// ---------------------------------------------------------------------------
// Cost-tier helper
// ---------------------------------------------------------------------------

/**
 * Derive a cost tier string from an input price (USD per 1M tokens).
 * null / undefined → 'free' (open-weight models with no hosted pricing).
 */
export function deriveCostTier(inputPrice: number | null | undefined): string {
  if (inputPrice == null) return 'free';
  if (inputPrice < 0.5) return 'low';
  if (inputPrice < 5) return 'mid';
  return 'high';
}

/**
 * Derive a benchmark band from an MMLU score.
 * null / undefined → 'unknown'.
 */
export function deriveBenchmarkBand(mmlu: number | null | undefined): string {
  if (mmlu == null) return 'unknown';
  if (mmlu >= 87) return 'frontier';
  if (mmlu >= 80) return 'strong';
  if (mmlu >= 70) return 'capable';
  return 'emerging';
}

// ---------------------------------------------------------------------------
// Edge generation from model data
// ---------------------------------------------------------------------------

/**
 * Build graph edges based on the chosen clustering axis.
 *
 * Each axis defines a "group key" function.  Two nodes share an edge when
 * they belong to the same group; the edge strength reflects how tightly
 * related they are within that group.
 *
 * @param nodes       Graph nodes to connect.
 * @param metaMap     Per-node metadata keyed by node id.
 * @param clusterMode Which axis to cluster by (default: 'family').
 */
export function buildEdges(
  nodes: GraphNode[],
  metaMap: Record<string, NodeMeta>,
  clusterMode: ClusterMode = 'family',
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const added = new Set<string>();

  /** Returns the group key for a node under the current cluster mode. */
  function groupKey(nodeId: string): string {
    const meta = metaMap[nodeId];
    if (!meta) return nodeId; // isolated — no group
    switch (clusterMode) {
      case 'family':
        return meta.family;
      case 'provider':
        return meta.provider;
      case 'cost-tier':
        return meta.costTier ?? deriveCostTier(undefined);
      case 'modality':
        return meta.primaryModality ?? 'text';
      case 'benchmark':
        return deriveBenchmarkBand(meta.mmlu);
    }
  }

  /**
   * For 'family' mode we also add a weaker same-provider edge so the graph
   * retains some provider-level structure even when families differ.
   */
  const addFamilyFallback = clusterMode === 'family';

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const key = `${a.id}--${b.id}`;
      if (added.has(key)) continue;

      const gA = groupKey(a.id);
      const gB = groupKey(b.id);

      if (gA === gB) {
        edges.push({ source: a.id, target: b.id, strength: 1.5 });
        added.add(key);
        continue;
      }

      // Family mode: secondary edge for same provider
      if (addFamilyFallback) {
        const metaA = metaMap[a.id];
        const metaB = metaMap[b.id];
        if (metaA && metaB && metaA.provider === metaB.provider) {
          edges.push({ source: a.id, target: b.id, strength: 0.8 });
          added.add(key);
        }
      }
    }
  }

  return edges;
}
