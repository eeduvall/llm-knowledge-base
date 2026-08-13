'use client';

// FogLayer — volumetric particle fog that drifts across the graph.
// Implemented as a THREE.Points system with 600 semi-transparent particles
// animated with a simple Perlin-like noise approximation (sum of sines).
//
// This is a React Three Fiber component; it must only be used inside a <Canvas>.

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 600;
const SPREAD = 280; // world-space radius of the particle cloud

type Props = {
  /** Opacity multiplier (0–1). Reduce for subtle fog, increase for dense. */
  opacity?: number;
};

export function FogLayer({ opacity = 1 }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // Generate initial random positions and per-particle phase offsets
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const ph = new Float32Array(PARTICLE_COUNT * 3); // x, y, z phase offsets
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 2;
      ph[i * 3] = Math.random() * Math.PI * 2;
      ph[i * 3 + 1] = Math.random() * Math.PI * 2;
      ph[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: ph };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      // Design-system fog color: rgba(100, 120, 255, 0.04) → #6478ff
      color: new THREE.Color(0x6478ff),
      size: 3.5,
      transparent: true,
      opacity: 0.055 * opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [opacity]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta * 0.12; // slow drift
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const px = phases[i * 3];
      const py = phases[i * 3 + 1];
      const pz = phases[i * 3 + 2];

      // Approximate Perlin drift: sum of low-frequency sines
      const ox = 6 * Math.sin(t * 0.7 + px) + 3 * Math.sin(t * 1.3 + py * 2);
      const oy = 6 * Math.sin(t * 0.5 + py) + 3 * Math.cos(t * 1.1 + pz * 2);
      const oz = 4 * Math.cos(t * 0.6 + pz) + 2 * Math.sin(t * 0.9 + px * 1.5);

      posAttr.setXYZ(
        i,
        positions[i * 3] + ox,
        positions[i * 3 + 1] + oy,
        positions[i * 3 + 2] + oz,
      );
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
