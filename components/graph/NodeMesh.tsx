'use client';

// NodeMesh — individual LLM node rendered as a glowing icosahedron sphere.
// This is a React Three Fiber component; it must only be used inside a <Canvas>.

import { useRef, useMemo, useEffect } from 'react';
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

  // Shared geometry — one icosahedron shape reused for both core and glow meshes.
  // Stored in useMemo so it is created once and disposed on unmount.
  const r = node.radius * 0.12; // scale world-space radius to scene units
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(r, 2), [r]);

  // Core material — emissive so it glows through the Bloom pass
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: isSelected ? 2.5 : isHovered ? 2.0 : 1.2,
        roughness: 0.2,
        metalness: 0.6,
        transparent: true,
        opacity: isDimmed ? 0.15 : 1.0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeColor, isDimmed],
  );

  // Outer glow shell — larger, very transparent sphere
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: nodeColor,
        transparent: true,
        opacity: isDimmed ? 0.02 : isSelected ? 0.12 : isHovered ? 0.1 : 0.06,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodeColor, isDimmed],
  );

  // Dispose geometry and materials when the component unmounts or when
  // the memoised objects are replaced (dep changes trigger a new useMemo,
  // so the cleanup runs before the next value is created).
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      coreMaterial.dispose();
    };
  }, [coreMaterial]);

  useEffect(() => {
    return () => {
      glowMaterial.dispose();
    };
  }, [glowMaterial]);

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

    // Update emissive intensity reactively (avoids recreating the material)
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = isSelected
      ? 2.5
      : isHovered
        ? 2.0
        : 1.2;
  });

  return (
    <group>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        position={[node.x, node.y, node.z]}
        geometry={geometry}
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
      />

      {/* Outer glow shell */}
      <mesh
        ref={glowRef}
        position={[node.x, node.y, node.z]}
        geometry={geometry}
        material={glowMaterial}
      />
    </group>
  );
}
