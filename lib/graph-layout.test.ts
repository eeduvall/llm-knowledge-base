import { tickLayout, buildEdges, deriveCostTier, deriveBenchmarkBand } from './graph-layout';
import type { GraphNode, NodeMeta } from './graph-layout';

function makeNode(id: string, provider: string, family: string, x = 0, y = 0, z = 0): GraphNode {
  return {
    id, label: id, provider, family, color: '#6C63FF',
    x, y, z, vx: 0, vy: 0, vz: 0, radius: 6, pulseOffset: 0,
  };
}

function makeMeta(family: string, provider: string, overrides: Partial<NodeMeta> = {}): NodeMeta {
  return { family, provider, ...overrides };
}

describe('tickLayout', () => {
  it('moves nodes via x/y repulsion', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', -10, 0), makeNode('b', 'anthropic', 'claude-3', 10, 0)];
    const ax0 = nodes[0].x; const bx0 = nodes[1].x;
    tickLayout(nodes, [], 800, 600);
    expect(nodes[0].x).toBeLessThan(ax0);
    expect(nodes[1].x).toBeGreaterThan(bx0);
  });

  it('applies z-axis repulsion', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', 0, 0, -10), makeNode('b', 'anthropic', 'claude-3', 0, 0, 10)];
    const az0 = nodes[0].z; const bz0 = nodes[1].z;
    tickLayout(nodes, [], 800, 600);
    expect(nodes[0].z).toBeLessThan(az0);
    expect(nodes[1].z).toBeGreaterThan(bz0);
  });

  it('applies z-axis spring attraction along edges', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', 0, 0, -300), makeNode('b', 'openai', 'gpt-4', 0, 0, 300)];
    const d0 = Math.abs(nodes[1].z - nodes[0].z);
    tickLayout(nodes, [{ source: 'a', target: 'b', strength: 1 }], 800, 600);
    expect(Math.abs(nodes[1].z - nodes[0].z)).toBeLessThan(d0);
  });

  it('applies z-axis center gravity over many ticks', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', 0, 0, 400)];
    for (let i = 0; i < 50; i++) tickLayout(nodes, [], 800, 600);
    expect(nodes[0].z).toBeLessThan(400);
  });

  it('applies xy center gravity over many ticks', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', 400, 300)];
    for (let i = 0; i < 50; i++) tickLayout(nodes, [], 800, 600);
    expect(nodes[0].x).toBeLessThan(400);
    expect(nodes[0].y).toBeLessThan(300);
  });

  it('does not throw with empty nodes array', () => {
    expect(() => tickLayout([], [], 800, 600)).not.toThrow();
  });

  it('applies spring attraction along xy edges', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', -300, 0), makeNode('b', 'openai', 'gpt-4', 300, 0)];
    const d0 = Math.abs(nodes[1].x - nodes[0].x);
    tickLayout(nodes, [{ source: 'a', target: 'b', strength: 1 }], 800, 600);
    expect(Math.abs(nodes[1].x - nodes[0].x)).toBeLessThan(d0);
  });

  it('skips edges with unknown node ids', () => {
    const nodes = [makeNode('a', 'openai', 'gpt-4', 0, 0)];
    expect(() => tickLayout(nodes, [{ source: 'a', target: 'missing', strength: 1 }], 800, 600)).not.toThrow();
  });
});

describe('deriveCostTier', () => {
  it('returns free for null', () => expect(deriveCostTier(null)).toBe('free'));
  it('returns free for undefined', () => expect(deriveCostTier(undefined)).toBe('free'));
  it('returns low for 0.1', () => expect(deriveCostTier(0.1)).toBe('low'));
  it('returns mid for 1', () => expect(deriveCostTier(1)).toBe('mid'));
  it('returns high for 10', () => expect(deriveCostTier(10)).toBe('high'));
  it('boundary: 0.5 is mid', () => expect(deriveCostTier(0.5)).toBe('mid'));
  it('boundary: 5 is high', () => expect(deriveCostTier(5)).toBe('high'));
});

describe('deriveBenchmarkBand', () => {
  it('returns unknown for null', () => expect(deriveBenchmarkBand(null)).toBe('unknown'));
  it('returns unknown for undefined', () => expect(deriveBenchmarkBand(undefined)).toBe('unknown'));
  it('returns frontier for 90', () => expect(deriveBenchmarkBand(90)).toBe('frontier'));
  it('returns strong for 83', () => expect(deriveBenchmarkBand(83)).toBe('strong'));
  it('returns capable for 75', () => expect(deriveBenchmarkBand(75)).toBe('capable'));
  it('returns emerging for 60', () => expect(deriveBenchmarkBand(60)).toBe('emerging'));
  it('boundary: 87 is frontier', () => expect(deriveBenchmarkBand(87)).toBe('frontier'));
  it('boundary: 80 is strong', () => expect(deriveBenchmarkBand(80)).toBe('strong'));
  it('boundary: 70 is capable', () => expect(deriveBenchmarkBand(70)).toBe('capable'));
});

describe('buildEdges', () => {
  const nodes = [
    makeNode('a', 'openai', 'gpt-4'),
    makeNode('b', 'openai', 'gpt-4'),
    makeNode('c', 'openai', 'gpt-3'),
    makeNode('d', 'anthropic', 'claude-3'),
  ];

  const metaMap: Record<string, NodeMeta> = {
    a: makeMeta('gpt-4', 'openai', { costTier: 'high', primaryModality: 'text', mmlu: 90 }),
    b: makeMeta('gpt-4', 'openai', { costTier: 'high', primaryModality: 'text', mmlu: 88 }),
    c: makeMeta('gpt-3', 'openai', { costTier: 'low', primaryModality: 'text', mmlu: 75 }),
    d: makeMeta('claude-3', 'anthropic', { costTier: 'mid', primaryModality: 'image', mmlu: 60 }),
  };

  it('creates strong edges for same-family nodes in family mode', () => {
    const edges = buildEdges(nodes, metaMap, 'family');
    const ab = edges.find((e) => (e.source === 'a' && e.target === 'b') || (e.source === 'b' && e.target === 'a'));
    expect(ab).toBeDefined();
    expect(ab!.strength).toBe(1.5);
  });

  it('creates weaker same-provider cross-family edges in family mode', () => {
    const edges = buildEdges(nodes, metaMap, 'family');
    const ac = edges.find((e) => (e.source === 'a' && e.target === 'c') || (e.source === 'c' && e.target === 'a'));
    expect(ac).toBeDefined();
    expect(ac!.strength).toBe(0.8);
  });

  it('does not create cross-provider edges in family mode', () => {
    const edges = buildEdges(nodes, metaMap, 'family');
    const ad = edges.find((e) => (e.source === 'a' && e.target === 'd') || (e.source === 'd' && e.target === 'a'));
    expect(ad).toBeUndefined();
  });

  it('clusters by provider in provider mode', () => {
    const edges = buildEdges(nodes, metaMap, 'provider');
    const openaiEdges = edges.filter((e) =>
      ['a', 'b', 'c'].includes(e.source) && ['a', 'b', 'c'].includes(e.target),
    );
    expect(openaiEdges.length).toBeGreaterThan(0);
    openaiEdges.forEach((e) => expect(e.strength).toBe(1.5));
  });

  it('clusters by cost-tier in cost-tier mode', () => {
    const edges = buildEdges(nodes, metaMap, 'cost-tier');
    const ab = edges.find((e) => (e.source === 'a' && e.target === 'b') || (e.source === 'b' && e.target === 'a'));
    expect(ab).toBeDefined();
    expect(ab!.strength).toBe(1.5);
  });

  it('clusters by modality in modality mode', () => {
    const edges = buildEdges(nodes, metaMap, 'modality');
    const ab = edges.find((e) => (e.source === 'a' && e.target === 'b') || (e.source === 'b' && e.target === 'a'));
    expect(ab).toBeDefined();
  });

  it('clusters by benchmark band in benchmark mode', () => {
    const edges = buildEdges(nodes, metaMap, 'benchmark');
    const ab = edges.find((e) => (e.source === 'a' && e.target === 'b') || (e.source === 'b' && e.target === 'a'));
    expect(ab).toBeDefined();
  });

  it('uses default modality text when primaryModality is missing', () => {
    const nodesLocal = [makeNode('x', 'openai', 'gpt-4'), makeNode('y', 'openai', 'gpt-4')];
    const metaLocal: Record<string, NodeMeta> = {
      x: makeMeta('gpt-4', 'openai'),
      y: makeMeta('gpt-4', 'openai'),
    };
    const edges = buildEdges(nodesLocal, metaLocal, 'modality');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('uses free cost tier when costTier is missing', () => {
    const nodesLocal = [makeNode('x', 'openai', 'gpt-4'), makeNode('y', 'openai', 'gpt-4')];
    const metaLocal: Record<string, NodeMeta> = {
      x: makeMeta('gpt-4', 'openai'),
      y: makeMeta('gpt-4', 'openai'),
    };
    const edges = buildEdges(nodesLocal, metaLocal, 'cost-tier');
    expect(edges.length).toBeGreaterThan(0);
  });

  it('isolates node with no meta entry', () => {
    const nodesLocal = [makeNode('x', 'openai', 'gpt-4'), makeNode('unknown', 'openai', 'gpt-4')];
    const metaLocal: Record<string, NodeMeta> = { x: makeMeta('gpt-4', 'openai') };
    const edges = buildEdges(nodesLocal, metaLocal, 'family');
    const xUnknown = edges.find(
      (e) => (e.source === 'x' && e.target === 'unknown') || (e.source === 'unknown' && e.target === 'x'),
    );
    expect(xUnknown).toBeUndefined();
  });

  it('deduplicates edges', () => {
    const edges = buildEdges(nodes, metaMap, 'family');
    const keys = edges.map((e) => `${e.source}--${e.target}`);
    const unique = new Set(keys);
    expect(keys.length).toBe(unique.size);
  });

  it('returns empty array for empty nodes', () => {
    expect(buildEdges([], {}, 'family')).toEqual([]);
  });

  it('uses default cluster mode (family) when not specified', () => {
    const edges = buildEdges(nodes, metaMap);
    expect(edges.length).toBeGreaterThan(0);
  });
});
