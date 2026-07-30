import { tickLayout, buildEdges, deriveCostTier, deriveBenchmarkBand } from './graph-layout'
import type { GraphNode, NodeMeta } from './graph-layout'

function makeNode(id: string, provider: string, family: string, x = 0, y = 0): GraphNode {
  return {
    id,
    label: id,
    provider,
    family,
    color: '#6C63FF',
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 6,
    pulseOffset: 0,
  }
}

function makeMeta(family: string, provider: string, overrides: Partial<NodeMeta> = {}): NodeMeta {
  return { family, provider, ...overrides }
}

describe('tickLayout', () => {
  it('moves nodes (updates x/y positions) via repulsion', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4', -10, 0),
      makeNode('b', 'anthropic', 'claude-3', 10, 0),
    ]

    const beforeAx = nodes[0].x
    const beforeBx = nodes[1].x
    tickLayout(nodes, [], 800, 600)
    // Repulsion should push nodes apart
    expect(nodes[0].x).toBeLessThan(beforeAx)
    expect(nodes[1].x).toBeGreaterThan(beforeBx)
  })

  it('applies center gravity — nodes drift toward world-space origin (0, 0) over many ticks', () => {
    // Place a single node far from the origin; with no repulsion partner it
    // should be pulled toward (0, 0) by center gravity.
    const nodes: GraphNode[] = [makeNode('a', 'openai', 'gpt-4', 400, 300)]
    nodes[0].vx = 0
    nodes[0].vy = 0

    for (let i = 0; i < 50; i++) {
      tickLayout(nodes, [], 800, 600)
    }
    // Node should have moved closer to origin — x < 400, y < 300
    expect(nodes[0].x).toBeLessThan(400)
    expect(nodes[0].y).toBeLessThan(300)
  })

  it('does not throw with empty nodes array', () => {
    expect(() => tickLayout([], [], 800, 600)).not.toThrow()
  })

  it('applies spring attraction along edges', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4', -300, 0),
      makeNode('b', 'openai', 'gpt-4', 300, 0),
    ]
    const edges = [{ source: 'a', target: 'b', strength: 1 }]
    const beforeDist = Math.abs(nodes[1].x - nodes[0].x)
    tickLayout(nodes, edges, 800, 600)
    const afterDist = Math.abs(nodes[1].x - nodes[0].x)
    // Spring should pull nodes closer (distance decreases)
    expect(afterDist).toBeLessThan(beforeDist)
  })
})

describe('buildEdges — family mode (default)', () => {
  it('creates strong edges between nodes in the same family', () => {
    const nodes: GraphNode[] = [
      makeNode('gpt-4o', 'openai', 'gpt-4'),
      makeNode('gpt-4o-mini', 'openai', 'gpt-4'),
    ]
    const metaMap = {
      'gpt-4o': makeMeta('gpt-4', 'openai'),
      'gpt-4o-mini': makeMeta('gpt-4', 'openai'),
    }
    const edges = buildEdges(nodes, metaMap, 'family')
    const edge = edges.find(
      (e) =>
        (e.source === 'gpt-4o' && e.target === 'gpt-4o-mini') ||
        (e.source === 'gpt-4o-mini' && e.target === 'gpt-4o')
    )
    expect(edge).toBeDefined()
    expect(edge!.strength).toBe(1.5)
  })

  it('creates medium edges between nodes from the same provider but different families', () => {
    const nodes: GraphNode[] = [
      makeNode('claude-3-5-sonnet', 'anthropic', 'claude-3-5'),
      makeNode('claude-3-haiku', 'anthropic', 'claude-3'),
    ]
    const metaMap = {
      'claude-3-5-sonnet': makeMeta('claude-3-5', 'anthropic'),
      'claude-3-haiku': makeMeta('claude-3', 'anthropic'),
    }
    const edges = buildEdges(nodes, metaMap, 'family')
    const edge = edges.find(
      (e) =>
        (e.source === 'claude-3-5-sonnet' && e.target === 'claude-3-haiku') ||
        (e.source === 'claude-3-haiku' && e.target === 'claude-3-5-sonnet')
    )
    expect(edge).toBeDefined()
    expect(edge!.strength).toBe(0.8)
  })

  it('does not create edges between nodes from different providers and families', () => {
    const nodes: GraphNode[] = [
      makeNode('gpt-4o', 'openai', 'gpt-4'),
      makeNode('claude-3-haiku', 'anthropic', 'claude-3'),
    ]
    const metaMap = {
      'gpt-4o': makeMeta('gpt-4', 'openai'),
      'claude-3-haiku': makeMeta('claude-3', 'anthropic'),
    }
    const edges = buildEdges(nodes, metaMap, 'family')
    expect(edges).toHaveLength(0)
  })

  it('does not create duplicate edges', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4'),
      makeNode('b', 'openai', 'gpt-4'),
      makeNode('c', 'openai', 'gpt-4'),
    ]
    const metaMap = {
      a: makeMeta('gpt-4', 'openai'),
      b: makeMeta('gpt-4', 'openai'),
      c: makeMeta('gpt-4', 'openai'),
    }
    const edges = buildEdges(nodes, metaMap, 'family')
    const keys = edges.map((e) => `${e.source}--${e.target}`)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })

  it('returns empty array for empty nodes', () => {
    expect(buildEdges([], {}, 'family')).toEqual([])
  })
})

describe('buildEdges — provider mode', () => {
  it('connects nodes from the same provider regardless of family', () => {
    const nodes: GraphNode[] = [
      makeNode('gpt-4o', 'openai', 'gpt-4'),
      makeNode('o1-preview', 'openai', 'o1'),
      makeNode('claude-3-haiku', 'anthropic', 'claude-3'),
    ]
    const metaMap = {
      'gpt-4o': makeMeta('gpt-4', 'openai'),
      'o1-preview': makeMeta('o1', 'openai'),
      'claude-3-haiku': makeMeta('claude-3', 'anthropic'),
    }
    const edges = buildEdges(nodes, metaMap, 'provider')
    const openaiEdge = edges.find(
      (e) =>
        (e.source === 'gpt-4o' && e.target === 'o1-preview') ||
        (e.source === 'o1-preview' && e.target === 'gpt-4o')
    )
    expect(openaiEdge).toBeDefined()
    expect(openaiEdge!.strength).toBe(1.5)
    // Cross-provider edge should not exist
    const crossEdge = edges.find(
      (e) =>
        (e.source === 'gpt-4o' && e.target === 'claude-3-haiku') ||
        (e.source === 'claude-3-haiku' && e.target === 'gpt-4o')
    )
    expect(crossEdge).toBeUndefined()
  })
})

describe('buildEdges — cost-tier mode', () => {
  it('connects nodes in the same cost tier', () => {
    const nodes: GraphNode[] = [
      makeNode('cheap-a', 'openai', 'gpt-4'),
      makeNode('cheap-b', 'anthropic', 'claude-3'),
      makeNode('expensive-c', 'openai', 'o1'),
    ]
    const metaMap = {
      'cheap-a': makeMeta('gpt-4', 'openai', { costTier: 'low' }),
      'cheap-b': makeMeta('claude-3', 'anthropic', { costTier: 'low' }),
      'expensive-c': makeMeta('o1', 'openai', { costTier: 'high' }),
    }
    const edges = buildEdges(nodes, metaMap, 'cost-tier')
    const cheapEdge = edges.find(
      (e) =>
        (e.source === 'cheap-a' && e.target === 'cheap-b') ||
        (e.source === 'cheap-b' && e.target === 'cheap-a')
    )
    expect(cheapEdge).toBeDefined()
    const expensiveEdge = edges.find(
      (e) =>
        (e.source === 'cheap-a' && e.target === 'expensive-c') ||
        (e.source === 'expensive-c' && e.target === 'cheap-a')
    )
    expect(expensiveEdge).toBeUndefined()
  })
})

describe('buildEdges — modality mode', () => {
  it('connects nodes with the same primary modality', () => {
    const nodes: GraphNode[] = [
      makeNode('text-a', 'openai', 'gpt-4'),
      makeNode('text-b', 'anthropic', 'claude-3'),
      makeNode('image-c', 'google', 'gemini-1.5'),
    ]
    const metaMap = {
      'text-a': makeMeta('gpt-4', 'openai', { primaryModality: 'text' }),
      'text-b': makeMeta('claude-3', 'anthropic', { primaryModality: 'text' }),
      'image-c': makeMeta('gemini-1.5', 'google', { primaryModality: 'image' }),
    }
    const edges = buildEdges(nodes, metaMap, 'modality')
    const textEdge = edges.find(
      (e) =>
        (e.source === 'text-a' && e.target === 'text-b') ||
        (e.source === 'text-b' && e.target === 'text-a')
    )
    expect(textEdge).toBeDefined()
    const crossEdge = edges.find(
      (e) =>
        (e.source === 'text-a' && e.target === 'image-c') ||
        (e.source === 'image-c' && e.target === 'text-a')
    )
    expect(crossEdge).toBeUndefined()
  })
})

describe('buildEdges — benchmark mode', () => {
  it('connects nodes in the same benchmark band', () => {
    const nodes: GraphNode[] = [
      makeNode('frontier-a', 'openai', 'gpt-4'),
      makeNode('frontier-b', 'anthropic', 'claude-3'),
      makeNode('capable-c', 'meta', 'llama-3'),
    ]
    const metaMap = {
      'frontier-a': makeMeta('gpt-4', 'openai', { mmlu: 88.7 }),
      'frontier-b': makeMeta('claude-3', 'anthropic', { mmlu: 88.7 }),
      'capable-c': makeMeta('llama-3', 'meta', { mmlu: 75.0 }),
    }
    const edges = buildEdges(nodes, metaMap, 'benchmark')
    const frontierEdge = edges.find(
      (e) =>
        (e.source === 'frontier-a' && e.target === 'frontier-b') ||
        (e.source === 'frontier-b' && e.target === 'frontier-a')
    )
    expect(frontierEdge).toBeDefined()
    const crossEdge = edges.find(
      (e) =>
        (e.source === 'frontier-a' && e.target === 'capable-c') ||
        (e.source === 'capable-c' && e.target === 'frontier-a')
    )
    expect(crossEdge).toBeUndefined()
  })
})

describe('deriveCostTier', () => {
  it('returns free for null', () => expect(deriveCostTier(null)).toBe('free'))
  it('returns low for < 0.5', () => expect(deriveCostTier(0.15)).toBe('low'))
  it('returns mid for 0.5–4.99', () => expect(deriveCostTier(3.0)).toBe('mid'))
  it('returns high for >= 5', () => expect(deriveCostTier(15.0)).toBe('high'))
})

describe('deriveBenchmarkBand', () => {
  it('returns unknown for null', () => expect(deriveBenchmarkBand(null)).toBe('unknown'))
  it('returns frontier for >= 87', () => expect(deriveBenchmarkBand(88.7)).toBe('frontier'))
  it('returns strong for 80–86.9', () => expect(deriveBenchmarkBand(83.6)).toBe('strong'))
  it('returns capable for 70–79.9', () => expect(deriveBenchmarkBand(75.2)).toBe('capable'))
  it('returns emerging for < 70', () => expect(deriveBenchmarkBand(68.0)).toBe('emerging'))
})
