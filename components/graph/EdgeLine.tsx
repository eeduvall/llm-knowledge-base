'use client';

// EdgeLine — bioluminescent filament connecting two graph nodes.
// Rendered as a THREE.Line with a gradient-like color derived from the
// source and target node colors.  A shimmer effect is achieved by animating
// the dashOffset on a LineDashedMaterial.
//
// This is a React Three Fiber component; it must only be used inside a <Canvas>.

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GraphNode, GraphEdge } from '@/lib/graph-layout';

type Props = {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  /** Whether either endpoint is hovered (triggers synapse-fire brightness). */
  isActive: boolean;
  /** Whether both endpoints pass the current filter (dims the edge otherwise). */
  isVisible: boolean;
};

export function EdgeLine({ edge, sourceNode, targetNode, isActive, isVisible }: Props) {
  const lineRef = useRef<THREE.Line>(null);
  // Shimmer phase accumulator
  const shimmerRef = useRef(Math.random() * Math.PI * 2);
  // Synapse-fire progress (0 → 1 over ~400 ms)
  const synapseRef = useRef(0);
  const prevActiveRef = useRef(isActive);

  // Trigger synapse animation when isActive transitions false → true
  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      synapseRef.current = 0;
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  // Build the line geometry from source → target positions.
  // We rebuild the geometry whenever node positions change (each frame via
  // useFrame below), so we keep a mutable BufferGeometry.
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array([
      sourceNode.x,
      sourceNode.y,
      sourceNode.z,
      targetNode.x,
      targetNode.y,
      targetNode.z,
    ]);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispose geometry on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const sourceColor = useMemo(() => new THREE.Color(sourceNode.color), [sourceNode.color]);

  const material = useMemo(() => {
    const baseOpacity = isVisible ? (isActive ? 0.7 : 0.3) : 0.06;
    const mat = new THREE.LineDashedMaterial({
      color: sourceColor,
      transparent: true,
      opacity: baseOpacity,
      dashSize: 8,
      gapSize: 4,
      depthWrite: false,
    });
    return mat;
  }, [sourceColor, isVisible, isActive]);

  // Dispose material on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((_, delta) => {
    if (!lineRef.current) return;

    // Update positions to follow physics simulation
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, sourceNode.x, sourceNode.y, sourceNode.z);
    posAttr.setXYZ(1, targetNode.x, targetNode.y, targetNode.z);
    posAttr.needsUpdate = true;
    geometry.computeBoundingSphere();

    // Shimmer: animate dashOffset
    shimmerRef.current += delta * (isActive ? 3.0 : 1.2);
    (lineRef.current.material as THREE.LineDashedMaterial).dashOffset = -shimmerRef.current;

    // Synapse-fire: briefly boost opacity then fade back
    if (synapseRef.current < 1) {
      synapseRef.current = Math.min(1, synapseRef.current + delta * 2.5); // ~400 ms
      const boost = Math.max(0, 0.6 * (1 - synapseRef.current));
      const baseOpacity = isVisible ? 0.3 : 0.06;
      (lineRef.current.material as THREE.LineDashedMaterial).opacity = baseOpacity + boost;
    } else {
      const targetOpacity = isVisible ? (isActive ? 0.7 : 0.3) : 0.06;
      const mat = lineRef.current.material as THREE.LineDashedMaterial;
      mat.opacity += (targetOpacity - mat.opacity) * 0.1;
    }

    // Recompute line distances (required for dashed lines)
    (lineRef.current as THREE.Line).computeLineDistances();
  });

  // Edge strength controls line width (clamped to 1–2 for performance)
  const lineWidth = Math.min(2, Math.max(1, edge.strength));

  return (
    <primitive
      object={
        new THREE.Line(geometry, material)
      }
      ref={lineRef}
      lineWidth={lineWidth}
    />
  );
}
