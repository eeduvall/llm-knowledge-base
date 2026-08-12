'use client';

import { useEffect, useRef } from 'react';

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  pulseOffset: number;
};

type Edge = {
  from: number;
  to: number;
};

const NODE_COLORS = [
  '#6C63FF', // primary violet
  '#00D4FF', // cyan
  '#6C63FF',
  '#00D4FF',
  '#FF6B9D', // accent pink
  '#6C63FF',
  '#00D4FF',
  '#9B8FFF',
  '#00D4FF',
  '#6C63FF',
  '#00D4FF',
  '#6C63FF',
  '#00D4FF',
  '#9B8FFF',
  '#6C63FF',
  '#00D4FF',
  '#FF6B9D',
  '#6C63FF',
  '#00D4FF',
  '#9B8FFF',
];

function createNodes(width: number, height: number): Node[] {
  return NODE_COLORS.map((color, i) => ({
    x: width * 0.3 + Math.random() * width * 0.65,
    y: height * 0.05 + Math.random() * height * 0.85,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: i === 4 ? 8 : i % 5 === 0 ? 6 : 4,
    color,
    pulseOffset: Math.random() * Math.PI * 2,
  }));
}

function createEdges(nodeCount: number): Edge[] {
  const edges: Edge[] = [];
  // Create a connected graph with some extra edges
  for (let i = 1; i < nodeCount; i++) {
    edges.push({ from: Math.floor(Math.random() * i), to: i });
  }
  // Add a few extra edges for density
  for (let k = 0; k < 8; k++) {
    const from = Math.floor(Math.random() * nodeCount);
    const to = Math.floor(Math.random() * nodeCount);
    if (from !== to) edges.push({ from, to });
  }
  return edges;
}

export function GraphAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect prefers-reduced-motion: skip animation entirely
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      nodesRef.current = createNodes(canvas.width, canvas.height);
      edgesRef.current = createEdges(nodesRef.current.length);
    };

    resize();
    window.addEventListener('resize', resize);

    if (prefersReduced) {
      // Draw a single static frame and stop
      const w = canvas.width;
      const h = canvas.height;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      ctx.clearRect(0, 0, w, h);
      edges.forEach(({ from, to }) => {
        const a = nodes[from];
        const b = nodes[to];
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, a.color + '55');
        grad.addColorStop(1, b.color + '33');
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      nodes.forEach((node) => {
        const r = node.r;
        const core = ctx.createRadialGradient(
          node.x - r * 0.3,
          node.y - r * 0.3,
          0,
          node.x,
          node.y,
          r,
        );
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.4, node.color);
        core.addColorStop(1, node.color + 'aa');
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      });

      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    let t = 0;

    const draw = () => {
      t += 0.008;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Update node positions (gentle drift)
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        // Soft boundary bounce
        if (node.x < w * 0.25 || node.x > w * 0.98) node.vx *= -1;
        if (node.y < h * 0.02 || node.y > h * 0.95) node.vy *= -1;
      });

      // Draw edges
      edges.forEach(({ from, to }) => {
        const a = nodes[from];
        const b = nodes[to];
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, a.color + '55');
        grad.addColorStop(1, b.color + '33');
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        const pulse = 1 + 0.08 * Math.sin(t * 2 + node.pulseOffset);
        const r = node.r * pulse;

        // Outer glow
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 4);
        glow.addColorStop(0, node.color + '40');
        glow.addColorStop(1, node.color + '00');
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        const core = ctx.createRadialGradient(
          node.x - r * 0.3,
          node.y - r * 0.3,
          0,
          node.x,
          node.y,
          r,
        );
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.4, node.color);
        core.addColorStop(1, node.color + 'aa');
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();

        void i; // suppress unused-var lint for index
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
}
