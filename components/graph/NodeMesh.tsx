'use client';

// NodeMesh — individual LLM node rendered as a glowing icosahedron sphere.
// This is a React Three Fiber component; it must only be used inside a <Canvas>.

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GraphNode } from '@/lib/graph-layout';

type Props = {
  node: GraphNode;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onPointerOver: (id: string) => void;
  onPointerOut: () => void;
  onClick: (id: string) => void;
};

export function NodeMesh({
  node,
  isSelected,
  isHovered,
  isDimmed,
  onPointerOver,
  onPointerOut,
  onClick,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  // Per-node phase accumulator for the breathing pulse
  const phaseRef = useRef(node.pulseOffset);

  const nodeColor = useMemo(() => new THREE.Color(node.color), [node.color]);

  // Core material — emissive so it glows through the Bloom pass
  const coreMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: nodeColor,
      emissive: nodeColor,
      emissiveIntensity: isSelected ? 2.5 : isHovered ? 2.0 : 1.2,
      roughness: 0.2,
      metalness: 0.6,
      transparent: true,
      opacity: isDimmed ? 0.15 : 1.0,
    });
    return mat;
  }, [nodeColor, isSelected, isHovered, isDimmed]);

  // Outer glow shell — larger, very transparent sphere
  const glowMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: nodeColor,
      transparent: true,
      opacity: isDimmed ? 0.02 : isSelected ? 0.12 : isHovered ? 0.1 : 0.06,
      side: THREE.BackSide,
      depthWrite: false,
    });
    return mat;
  }, [nodeColor, isSelected, isHovered, isDimmed]);

  // Dispose materials on unmount
  // (geometries are shared via useMemo and disposed separately)
  // Note: materials are recreated when deps change; the old ones are GC'd.
  // For a production app we'd track and dispose them explicitly, but since
  // the node count is small (< 50) this is acceptable.

  useFrame((_, delta) => {
    if (!meshRef.current || !glowRef.current) return;

    // Breathing pulse: scale 1.0 → 1.08 → 1.0 over ~3 s
    phaseRef.current += delta * 0.7; // ~0.7 rad/s ≈ 3 s period
    const pulse = 1 + 0.08 * Math.sin(phaseRef.current);
    const baseScale = isSelected ? 1.4 : isHovered ? 1.2 : 1.0;
    const s = baseScale * pulse;

    meshRef.current.scale.setScalar(s);
    glowRef.current.scale.setScalar(s * 2.2);

    // Sync position from the physics simulation
    meshRef.current.position.set(node.x, node.y, node.z);
    glowRef.current.position.set(node.x, node.y, node.z);

    // Update emissive intensity reactively
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = isSelected
      ? 2.5
      : isHovered
        ? 2.0
        : 1.2;
  });

  const r = node.radius * 0.12; // scale world-space radius to scene units

  return (
    <group>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={[node.x, node.y, node.z]}
        material={coreMaterial}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver(node.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onPointerOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node.id);
        }}
      >
        <icosahedronGeometry args={[r, 2]} />
      </mesh>

      {/* Outer glow shell */}
      <mesh
        ref={glowRef}
        position={[node.x, node.y, node.z]}
        material={glowMaterial}
      >
        <icosahedronGeometry args={[r, 2]} />
      </mesh>
    </group>
  );
}
