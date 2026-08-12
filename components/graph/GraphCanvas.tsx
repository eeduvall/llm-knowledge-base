'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { GraphNode, GraphEdge } from '@/lib/graph-layout';
import { tickLayout } from '@/lib/graph-layout';

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  hoveredId: string | null;
  /** Set of node ids that pass all active filters; all others are dimmed. */
  visibleIds: Set<string>;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  /** Model id to pan the camera to on mount (from ?highlight query param). */
  highlightId?: string | null;
};

type Camera = {
  x: number;
  y: number;
  scale: number;
};

export function GraphCanvas({
  nodes,
  edges,
  selectedId,
  hoveredId,
  visibleIds,
  highlightId,
  onSelectNode,
  onHoverNode,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>(nodes);
  const edgesRef = useRef<GraphEdge[]>(edges);
  const tRef = useRef(0);
  const synapseRef = useRef<{ id: string; t: number } | null>(null);
  // Track keyboard-focused node index for arrow-key navigation
  const focusIndexRef = useRef<number>(-1);

  // Camera state: current and target for smooth interpolation
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });
  const cameraTargetRef = useRef<Camera>({ x: 0, y: 0, scale: 1 });

  // Keep refs in sync with props
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Trigger synapse animation on hover
  useEffect(() => {
    if (hoveredId) {
      synapseRef.current = { id: hoveredId, t: 0 };
    }
  }, [hoveredId]);

  // Pan camera to the highlighted node after physics has had time to settle.
  // We wait ~1.5 s so the force simulation has moved nodes from their initial
  // ring positions before we read coordinates.
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      const node = nodesRef.current.find((n) => n.id === highlightId);
      if (!node) return;
      cameraTargetRef.current = { x: node.x, y: node.y, scale: 2 };
    }, 1500);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // Zoom-to-fit when visible set changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.offsetWidth || canvas.width;
    const h = canvas.offsetHeight || canvas.height;

    const allVisible = nodesRef.current.every((n) => visibleIds.has(n.id));
    if (allVisible) {
      // Reset to default view
      return;
    }

    // Compute bounding box of visible nodes
    const visibleNodes = nodesRef.current.filter((n) => visibleIds.has(n.id));
    if (visibleNodes.length === 0) {
      cameraTargetRef.current = { x: 0, y: 0, scale: 1 };
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of visibleNodes) {
      minX = Math.min(minX, n.x - n.radius);
      maxX = Math.max(maxX, n.x + n.radius);
      minY = Math.min(minY, n.y - n.radius);
      maxY = Math.max(maxY, n.y + n.radius);
    }

    const padding = 80;
    const bboxW = maxX - minX + padding * 2;
    const bboxH = maxY - minY + padding * 2;
    const bboxCx = (minX + maxX) / 2;
    const bboxCy = (minY + maxY) / 2;

    const scaleX = w / bboxW;
    const scaleY = h / bboxH;
    const scale = Math.min(scaleX, scaleY, 2.5); // cap at 2.5×

    // Camera offset: translate so bbox center maps to canvas center
    // After transform: screenX = (worldX - cx) * scale + w/2
    // We want bboxCx to map to w/2, so cx = bboxCx
    cameraTargetRef.current = {
      x: bboxCx,
      y: bboxCy,
      scale,
    };
  }, [visibleIds]);

  const getVisibleNodes = useCallback((): GraphNode[] => {
    return nodesRef.current.filter((n) => visibleIds.has(n.id));
  }, [visibleIds]);

  const getNodeAt = useCallback(
    (screenX: number, screenY: number): GraphNode | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const w = canvas.width;
      const h = canvas.height;
      const cam = cameraRef.current;

      // Convert screen coords to world coords
      const worldX = (screenX - w / 2) / cam.scale + cam.x;
      const worldY = (screenY - h / 2) / cam.scale + cam.y;

      for (const node of nodesRef.current) {
        const visible = visibleIds.has(node.id);
        if (!visible) continue;
        const dx = node.x - worldX;
        const dy = node.y - worldY;
        if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6 / cam.scale) return node;
      }
      return null;
    },
    [visibleIds],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const LERP = 0.08; // smoothing factor per frame

    const draw = () => {
      tRef.current += 0.008;
      const t = tRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // Advance synapse animation
      if (synapseRef.current) {
        synapseRef.current.t += 0.04;
        if (synapseRef.current.t > 1) synapseRef.current = null;
      }

      // Run physics
      tickLayout(nodes, edges, w, h);

      // Smooth camera interpolation
      const cam = cameraRef.current;
      const target = cameraTargetRef.current;
      cam.x += (target.x - cam.x) * LERP;
      cam.y += (target.y - cam.y) * LERP;
      cam.scale += (target.scale - cam.scale) * LERP;

      ctx.clearRect(0, 0, w, h);

      // Apply camera transform: translate so world-center maps to canvas-center
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.scale, cam.scale);
      ctx.translate(-cam.x, -cam.y);

      // Draw edges
      for (const edge of edges) {
        const a = nodes.find((n) => n.id === edge.source);
        const b = nodes.find((n) => n.id === edge.target);
        if (!a || !b) continue;

        const aVisible = visibleIds.has(a.id);
        const bVisible = visibleIds.has(b.id);
        if (!aVisible && !bVisible) continue;

        const alpha = aVisible && bVisible ? 0.35 : 0.1;

        // Synapse glow on hovered node's edges
        let lineWidth = 0.8;
        let extraAlpha = 0;
        if (
          synapseRef.current &&
          (edge.source === synapseRef.current.id || edge.target === synapseRef.current.id)
        ) {
          const progress = synapseRef.current.t;
          extraAlpha = Math.max(0, 0.6 * (1 - progress));
          lineWidth = 1.5;
        }

        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        const aAlpha = Math.round((alpha + extraAlpha) * 255)
          .toString(16)
          .padStart(2, '0');
        const bAlpha = Math.round((alpha + extraAlpha) * 0.6 * 255)
          .toString(16)
          .padStart(2, '0');
        grad.addColorStop(0, a.color + aAlpha);
        grad.addColorStop(1, b.color + bAlpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        const visible = visibleIds.has(node.id);
        const isSelected = node.id === selectedId;
        const isHovered = node.id === hoveredId;
        const dimmed = !visible;

        const pulse = 1 + 0.08 * Math.sin(t * 2 + node.pulseOffset);
        const r = node.radius * pulse * (isSelected ? 1.4 : isHovered ? 1.2 : 1);
        const globalAlpha = dimmed ? 0.15 : 1;

        ctx.globalAlpha = globalAlpha;

        // Outer glow
        const glowR = r * (isSelected ? 5 : isHovered ? 4.5 : 4);
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
        const glowAlpha = isSelected ? '60' : isHovered ? '50' : '30';
        glow.addColorStop(0, node.color + glowAlpha);
        glow.addColorStop(1, node.color + '00');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core sphere
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

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
          ctx.strokeStyle = node.color + 'cc';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      }

      // ── Label pass with collision avoidance ──────────────────────────────
      // Collect natural label positions (below each node), then iteratively
      // push overlapping bounding boxes apart so labels don't stack on top of
      // each other when nodes cluster tightly (e.g. modality grouping).
      const FONT_SIZE = 11;
      const LABEL_PAD_X = 4; // horizontal padding around text
      const LABEL_PAD_Y = 2; // vertical padding above/below text
      const LABEL_GAP = 3; // minimum gap between label boxes
      const LABEL_OFFSET_Y = 14; // initial offset below node edge

      ctx.font = `${FONT_SIZE}px "Inter", sans-serif`;

      const labels: Array<{
        node: GraphNode;
        text: string;
        bold: boolean;
        x: number;
        y: number;
        w: number;
        h: number;
      }> = [];
      for (const node of nodes) {
        if (!visibleIds.has(node.id)) continue;
        const isSelected = node.id === selectedId;
        const isHovered = node.id === hoveredId;
        if (!(isSelected || isHovered || node.radius >= 7)) continue;

        const pulse = 1 + 0.08 * Math.sin(t * 2 + node.pulseOffset);
        const r = node.radius * pulse * (isSelected ? 1.4 : isHovered ? 1.2 : 1);

        const text = node.label;
        const bold = isSelected;
        ctx.font = `${bold ? 'bold ' : ''}${FONT_SIZE}px "Inter", sans-serif`;
        const tw = ctx.measureText(text).width;
        labels.push({
          node,
          text,
          bold,
          x: node.x,
          y: node.y + r + LABEL_OFFSET_Y + FONT_SIZE / 2,
          w: tw / 2 + LABEL_PAD_X,
          h: FONT_SIZE / 2 + LABEL_PAD_Y,
        });
      }

      // Iterative overlap resolution: push label centres apart
      const ITERS = 20;
      for (let iter = 0; iter < ITERS; iter++) {
        for (let i = 0; i < labels.length; i++) {
          for (let j = i + 1; j < labels.length; j++) {
            const a = labels[i];
            const b = labels[j];
            const overlapX = a.w + b.w + LABEL_GAP - Math.abs(b.x - a.x);
            const overlapY = a.h + b.h + LABEL_GAP - Math.abs(b.y - a.y);
            if (overlapX <= 0 || overlapY <= 0) continue;
            // Resolve along the axis of least overlap
            if (overlapY <= overlapX) {
              const shift = overlapY / 2;
              if (b.y >= a.y) {
                a.y -= shift;
                b.y += shift;
              } else {
                a.y += shift;
                b.y -= shift;
              }
            } else {
              const shift = overlapX / 2;
              if (b.x >= a.x) {
                a.x -= shift;
                b.x += shift;
              } else {
                a.x += shift;
                b.x -= shift;
              }
            }
          }
        }
      }

      // Draw resolved labels
      for (const lbl of labels) {
        const isSelected = lbl.node.id === selectedId;
        ctx.font = `${lbl.bold ? 'bold ' : ''}${FONT_SIZE}px "Inter", sans-serif`;
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.75)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        ctx.fillText(lbl.text, lbl.x, lbl.y);
        ctx.textBaseline = 'alphabetic';
      }

      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [selectedId, hoveredId, visibleIds]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = getNodeAt(x, y);
      onHoverNode(node ? node.id : null);
      canvas.style.cursor = node ? 'pointer' : 'default';
    },
    [getNodeAt, onHoverNode],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const node = getNodeAt(x, y);
      onSelectNode(node ? node.id : null);
    },
    [getNodeAt, onSelectNode],
  );

  const handleMouseLeave = useCallback(() => {
    onHoverNode(null);
  }, [onHoverNode]);

  // Keyboard navigation: Tab focuses canvas, arrow keys cycle nodes, Enter selects
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLCanvasElement>) => {
      const visible = getVisibleNodes();
      if (visible.length === 0) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusIndexRef.current = (focusIndexRef.current + 1) % visible.length;
        const node = visible[focusIndexRef.current];
        onHoverNode(node.id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusIndexRef.current = (focusIndexRef.current - 1 + visible.length) % visible.length;
        const node = visible[focusIndexRef.current];
        onHoverNode(node.id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusIndexRef.current >= 0 && focusIndexRef.current < visible.length) {
          const node = visible[focusIndexRef.current];
          onSelectNode(node.id);
        }
      } else if (e.key === 'Escape') {
        onSelectNode(null);
        onHoverNode(null);
        focusIndexRef.current = -1;
      }
    },
    [getVisibleNodes, onHoverNode, onSelectNode],
  );

  const handleBlur = useCallback(() => {
    onHoverNode(null);
    focusIndexRef.current = -1;
  }, [onHoverNode]);

  // Derive accessible label from hovered/selected node
  const hoveredNode = nodes.find((n) => n.id === hoveredId);
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const ariaLabel = selectedNode
    ? `Knowledge graph — ${selectedNode.label} selected. Use arrow keys to navigate nodes, Enter to select, Escape to deselect.`
    : hoveredNode
      ? `Knowledge graph — ${hoveredNode.label} highlighted. Press Enter to open details.`
      : 'Interactive LLM knowledge graph. Use arrow keys to navigate nodes, Enter to select.';

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      aria-label={ariaLabel}
      role="application"
      tabIndex={0}
    />
  );
}
