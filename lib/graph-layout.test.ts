import { tickLayout, buildEdges, deriveCostTier, deriveBenchmarkBand } from './graph-layout';
import type { GraphNode, NodeMeta } from './graph-layout';

function makeNode(id: string, provider: string, family: string, x = 0, y = 0, z = 0): GraphNode {
  return {
    id,
    label: id,
    provider,
    family,
    color: '#6C63FF',
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 6,
    pulseOffset: 0,
  };
}

function makeMeta(family: string, provider: string, overrides: Partial<NodeMeta> = {}): NodeMeta {
  return { family, provider, ...overrides };
}

describe('tickLayout', () => {
  it('moves nodes (updates x/y positions) via repulsion', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4', -10, 0),
      makeNode('b', 'anthropic', 'claude-3', 10, 0),
    ];

    const beforeAx = nodes[0].x;
    const beforeBx = nodes[1].x;
    tickLayout(nodes, [], 800, 600);
    expect(nodes[0].x).toBeLessThan(beforeAx);
    expect(nodes[1].x).toBeGreaterThan(beforeBx);
  });

  it('applies z-axis repulsion — nodes separated only on z axis are pushed apart', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4', 0, 0, -10),
      makeNode('b', 'anthropic', 'claude-3', 0, 0, 10),
    ];
    const beforeAz = nodes[0].z;
    const beforeBz = nodes[1].z;
    tickLayout(nodes, [], 800, 600);
    expect(nodes[0].z).toBeLessThan(beforeAz);
    expect(nodes[1].z).toBeGreaterThan(beforeBz);
  });

  it('applies z-axis spring attraction along edges', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4', 0, 0, -300),
      makeNode('b', 'openai', 'gpt-4', 0, 0, 300),
    ];
    const edges = [{ source: 'a', target: 'b', strength: 1 }];
    const beforeDist = Math.abs(nodes[1].z - nodes[0].z);
    tickLayout(nodes, edges, 800, 600);
    const afterDist = Math.abs(nodes[1].z - nodes[0].z);
    expect(afterDist).toBeLessThan(beforeDist);
  });

  it('applies z-axis center gravity — node drifts toward z=0 over many ticks', () => {
    const nodes: GraphNode[] = [makeNode('a', 'openai', 'gpt-4', 0, 0, 400)];
    for (let i = 0; i < 50; i++) {
      tickLayout(nodes, [], 800, 600);
    }
    expect(nodes[0].z).toBeLessThan(400);
  });

  it('applies center gravity — nodes drift toward world-space origin (0, 0) over many ticks', () => {
    const nodes: GraphNode[] = [makeNode('a', 'openai', 'gpt-4', 400, 300)];
    nodes[0].vx = 0;
    nodes[0].vy = 0;

    for (let i = 0; i < 50; i++) {
      tickLayout(nodes, [], 800, 600);
    }
    expect(nodes[0].x).toBeLessThan(400);
    expect(nodes[0].y).toBeLessThan(300);
  });

  it('does not throw with empty nodes array', () => {
    expect(() => tickLayout([], [], 800, 600)).not.toThrow();
  });

  it('applies spring attraction along edges', () => {
    const nodes: GraphNode[] = [
      makeNode('a', 'openai', 'gpt-4', -300, 0),
      makeNode('b', 'openai', 'gpt-4', 300, 0),
    ];
    const edges = [{ source: 'a', target: 'b', strength: 1 }];
    const beforeDist = Math.abs(nodes[1].x - nodes[0].x);
    tickLayout(nodes, edges, 800, 600);
    const afterDist = Math.abs(nodes[1].x - nodes[0].x);
    expect(afterDist).toBeLessThan(beforeDist);
  });

  it('skips edges with unknown node ids', () => {
    const nodes: GraphNode[] = [makeNode('a', 'openai', 'gpt-4', 0, 0)];
    const edges = [{ source: 'a', target: 'missing', strength: 1 }];
    expect(() => tickLayout(nodes, edges, 800, 600)).not.toThrow();
  });
});
