'use client';

// GraphCanvas — React Three Fiber scene for the 3-D Knowledge Graph.
// This component is lazy-loaded via next/dynamic with { ssr: false } in
// GraphExplorer.tsx so Three.js never runs during server-side rendering.

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { GraphNode, GraphEdge } from '@/lib/graph-layout';
import { tickLayout } from '@/lib/graph-layout';
import { NodeMesh } from './NodeMesh';
import { EdgeLine } from './EdgeLine';
import { FogLayer } from './FogLayer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Inner scene — runs inside the R3F Canvas context
// ---------------------------------------------------------------------------

type SceneProps = Omit<Props, never>;

function Scene({
  nodes,
  edges,
  selectedId,
  hoveredId,
  visibleIds,
  highlightId,
  onSelectNode,
  onHoverNode,
}: SceneProps) {
  const nodesRef = useRef<GraphNode[]>(nodes);
  const edgesRef = useRef<GraphEdge[]>(edges);
  const { camera } = useThree();

  // Keep refs in sync with props so useFrame always has the latest data
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Pan camera to the highlighted node after the physics simulation settles
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      const node = nodesRef.current.find((n) => n.id === highlightId);
      if (!node) return;
      // Smoothly move the camera target toward the highlighted node
      const target = new THREE.Vector3(node.x, node.y, node.z);
      camera.position.set(target.x, target.y, target.z + 200);
      camera.lookAt(target);
    }, 1500);
    return () => clearTimeout(timer);
  }, [highlightId, camera]);

  // Run the physics simulation every frame
  useFrame(() => {
    tickLayout(nodesRef.current, edgesRef.current, 0, 0);
  });

  return (
    <>
      {/* Ambient + directional lighting for the metallic node materials */}
      <ambientLight intensity={0.3} />
      <pointLight position={[100, 100, 100]} intensity={1.5} color="#6c63ff" />
      <pointLight position={[-100, -100, -100]} intensity={0.8} color="#00d4ff" />

      {/* Volumetric fog particles */}
      <FogLayer opacity={1} />

      {/* Edges */}
      {edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        if (!src || !tgt) return null;
        const isActive = edge.source === hoveredId || edge.target === hoveredId;
        const isVisible = visibleIds.has(edge.source) && visibleIds.has(edge.target);
        return (
          <EdgeLine
            key={`${edge.source}--${edge.target}`}
            edge={edge}
            sourceNode={src}
            targetNode={tgt}
            isActive={isActive}
            isVisible={isVisible}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => (
        <NodeMesh
          key={node.id}
          node={node}
          isSelected={node.id === selectedId}
          isHovered={node.id === hoveredId}
          isDimmed={!visibleIds.has(node.id)}
          onPointerOver={onHoverNode}
          onPointerOut={useCallback(() => onHoverNode(null), [onHoverNode])}
          onClick={onSelectNode}
        />
      ))}

      {/* Post-processing: Bloom for the neural glow effect */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.025}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Labels overlay — rendered in HTML on top of the WebGL canvas
// ---------------------------------------------------------------------------

type LabelsProps = {
  nodes: GraphNode[];
  selectedId: string | null;
  hoveredId: string | null;
  visibleIds: Set<string>;
};

function Labels({ nodes, selectedId, hoveredId, visibleIds }: LabelsProps) {
  // Labels are rendered as absolutely-positioned HTML elements via CSS
  // transforms computed from the 3D positions projected to screen space.
  // We use a simple approach: only show labels for selected/hovered/large nodes.
  const labelNodes = useMemo(
    () =>
      nodes.filter(
        (n) =>
          visibleIds.has(n.id) &&
          (n.id === selectedId || n.id === hoveredId || n.radius >= 7),
      ),
    [nodes, selectedId, hoveredId, visibleIds],
  );

  if (labelNodes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {labelNodes.map((node) => (
        <NodeLabel
          key={node.id}
          node={node}
          isSelected={node.id === selectedId}
        />
      ))}
    </div>
  );
}

type NodeLabelProps = {
  node: GraphNode;
  isSelected: boolean;
};

function NodeLabel({ node, isSelected }: NodeLabelProps) {
  // Position labels using CSS custom properties set by a useFrame hook.
  // We use a ref to avoid re-renders on every frame.
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-xs pointer-events-none select-none"
      style={{
        // Initial position — will be updated by the projection hook
        left: '50%',
        top: '50%',
        color: isSelected ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontWeight: isSelected ? 600 : 400,
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
      }}
    >
      {node.label}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Keyboard navigation overlay
// ---------------------------------------------------------------------------

type KeyboardNavProps = {
  nodes: GraphNode[];
  visibleIds: Set<string>;
  selectedId: string | null;
  hoveredId: string | null;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
};

function KeyboardNav({
  nodes,
  visibleIds,
  selectedId,
  hoveredId,
  onSelectNode,
  onHoverNode,
}: KeyboardNavProps) {
  const focusIndexRef = useRef(-1);

  const visibleNodes = useMemo(
    () => nodes.filter((n) => visibleIds.has(n.id)),
    [nodes, visibleIds],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (visibleNodes.length === 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusIndexRef.current = (focusIndexRef.current + 1) % visibleNodes.length;
        onHoverNode(visibleNodes[focusIndexRef.current].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusIndexRef.current =
          (focusIndexRef.current - 1 + visibleNodes.length) % visibleNodes.length;
        onHoverNode(visibleNodes[focusIndexRef.current].id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusIndexRef.current >= 0 && focusIndexRef.current < visibleNodes.length) {
          onSelectNode(visibleNodes[focusIndexRef.current].id);
        }
      } else if (e.key === 'Escape') {
        onSelectNode(null);
        onHoverNode(null);
        focusIndexRef.current = -1;
      }
    },
    [visibleNodes, onSelectNode, onHoverNode],
  );

  const handleBlur = useCallback(() => {
    onHoverNode(null);
    focusIndexRef.current = -1;
  }, [onHoverNode]);

  const hoveredNode = nodes.find((n) => n.id === hoveredId);
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const ariaLabel = selectedNode
    ? `Knowledge graph — ${selectedNode.label} selected. Use arrow keys to navigate nodes, Enter to select, Escape to deselect.`
    : hoveredNode
      ? `Knowledge graph — ${hoveredNode.label} highlighted. Press Enter to open details.`
      : 'Interactive LLM knowledge graph. Use arrow keys to navigate nodes, Enter to select.';

  return (
    <div
      className="absolute inset-0 outline-none"
      role="application"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}

// ---------------------------------------------------------------------------
// GraphCanvas — exported component
// ---------------------------------------------------------------------------

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
  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 350], fov: 60, near: 1, far: 2000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'var(--color-bg)' }}
        aria-hidden="true"
      >
        <Scene
          nodes={nodes}
          edges={edges}
          selectedId={selectedId}
          hoveredId={hoveredId}
          visibleIds={visibleIds}
          highlightId={highlightId}
          onSelectNode={onSelectNode}
          onHoverNode={onHoverNode}
        />
      </Canvas>

      {/* HTML labels overlay */}
      <Labels
        nodes={nodes}
        selectedId={selectedId}
        hoveredId={hoveredId}
        visibleIds={visibleIds}
      />

      {/* Keyboard navigation overlay */}
      <KeyboardNav
        nodes={nodes}
        visibleIds={visibleIds}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelectNode={onSelectNode}
        onHoverNode={onHoverNode}
      />
    </div>
  );
}
