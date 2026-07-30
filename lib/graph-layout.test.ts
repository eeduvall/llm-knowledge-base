import { tickLayout, buildEdges } from './graph-layout'
import type { GraphNode } from './graph-layout'

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

describe('buildEdges', () => {
  it('creates strong edges between nodes in the same family', () => {
    const nodes: GraphNode[] = [
      makeNode('gpt-4o', 'openai', 'gpt-4'),
      makeNode('gpt-4o-mini', 'openai', 'gpt-4'),
    ]
    const familyMap = { 'gpt-4o': 'gpt-4', 'gpt-4o-mini': 'gpt-4' }
    const edges = buildEdges(nodes, familyMap)
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
    const familyMap = {
      'claude-3-5-sonnet': 'claude-3-5',
      'claude-3-haiku': 'claude-3',
    }
    const edges = buildEdges(nodes, familyMap)
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
    const familyMap = { 'gpt-4o': 'gpt-4', 'claude-3-haiku': 'claude-3' }
    const edges = buildEdges(nodes, familyMap)
    expect(edges).toHaveLength(0)
  })

  it('does not create duplicate edges', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4'),
      makeNode('b', 'openai', 'gpt-4'),
      makeNode('c', 'openai', 'gpt-4'),
    ]
    const familyMap = { a: 'gpt-4', b: 'gpt-4', c: 'gpt-4' }
    const edges = buildEdges(nodes, familyMap)
    const keys = edges.map((e) => `${e.source}--${e.target}`)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })

  it('returns empty array for empty nodes', () => {
    expect(buildEdges([], {})).toEqual([])
  })
})
