'use client';

// EdgeLine — bioluminescent filament connecting two graph nodes.
// Rendered as a THREE.Line with a LineDashedMaterial.  A shimmer effect is
// achieved by animating the material's `scale` property (which shifts the
// dash pattern along the line).
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

export function EdgeLine({ edge: _edge, sourceNode, targetNode, isActive, isVisible }: Props) {
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
  // We keep a mutable BufferGeometry and update it each frame.
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

  const sourceColor = useMemo(() => new THREE.Color(sourceNode.color), [sourceNode.color]);

  const material = useMemo(() => {
    const baseOpacity = isVisible ? (isActive ? 0.7 : 0.3) : 0.06;
    const mat = new THREE.LineDashedMaterial({
      color: sourceColor,
      transparent: true,
      opacity: baseOpacity,
      dashSize: 8,
      gapSize: 4,
      scale: 1,
      depthWrite: false,
    });
    return mat;
  }, [sourceColor, isVisible, isActive]);

  // Build the THREE.Line object once
  const lineObject = useMemo(() => {
    const ln = new THREE.Line(geometry, material);
    ln.computeLineDistances();
    return ln;
  }, [geometry, material]);

  // Dispose geometry and material on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    // Update positions to follow physics simulation
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, sourceNode.x, sourceNode.y, sourceNode.z);
    posAttr.setXYZ(1, targetNode.x, targetNode.y, targetNode.z);
    posAttr.needsUpdate = true;
    geometry.computeBoundingSphere();

    // Shimmer: animate scale to shift the dash pattern
    shimmerRef.current += delta * (isActive ? 3.0 : 1.2);
    material.scale = 1 + 0.3 * Math.sin(shimmerRef.current);

    // Synapse-fire: briefly boost opacity then fade back
    if (synapseRef.current < 1) {
      synapseRef.current = Math.min(1, synapseRef.current + delta * 2.5); // ~400 ms
      const boost = Math.max(0, 0.6 * (1 - synapseRef.current));
      const baseOpacity = isVisible ? 0.3 : 0.06;
      material.opacity = baseOpacity + boost;
    } else {
      const targetOpacity = isVisible ? (isActive ? 0.7 : 0.3) : 0.06;
      material.opacity += (targetOpacity - material.opacity) * 0.1;
    }

    // Recompute line distances (required for dashed lines)
    lineObject.computeLineDistances();
  });

  return <primitive object={lineObject} />;
}
