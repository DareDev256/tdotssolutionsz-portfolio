// src/components/particles/SoftParticles.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSoftCircleTexture, createHexBokehTexture, createDustTexture } from '../../utils/proceduralTextures';

// Color palette
const PARTICLE_COLORS = [
  '#ff2a6d', // pink
  '#05d9e8', // cyan
  '#d300c5', // purple
  '#ff6b35', // orange
];

/**
 * Atmospheric soft particles that float and drift
 * Replaces the old FloatingParticles with textured sprites
 */
export function SoftParticles({
  count = 80,
  spread = 50,
  height = 15,
  baseY = 2,
  scrollOffset = 0
}) {
  const meshRef = useRef();
  const particleData = useRef([]);

  // Generate textures once
  const textures = useMemo(() => ({
    soft: createSoftCircleTexture(64, '#ffffff'),
    hex: createHexBokehTexture(64, '#ffffff'),
    dust: createDustTexture(32),
  }), []);

  // Initialize particle data
  const { positions, colors, scales, textureIndices } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const textureIndices = new Float32Array(count);

    particleData.current = [];

    for (let i = 0; i < count; i++) {
      // Position
      const x = (Math.random() - 0.5) * spread;
      const y = baseY + Math.random() * height;
      const z = (Math.random() - 0.5) * 400; // Spread along road

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color
      const color = new THREE.Color(PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Scale (varied sizes)
      scales[i] = 0.3 + Math.random() * 0.7;

      // Texture type (0 = soft, 1 = hex, 2 = dust)
      textureIndices[i] = Math.floor(Math.random() * 3);

      // Animation data
      particleData.current.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.3,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
      });
    }

    return { positions, colors, scales, textureIndices };
  }, [count, spread, height, baseY]);

  // Create instanced geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
    geo.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));
    return geo;
  }, [colors, scales]);

  // Custom shader material for soft particles
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: textures.soft },
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute vec3 instanceColor;
        attribute float instanceScale;

        varying vec3 vColor;
        varying vec2 vUv;

        void main() {
          vColor = instanceColor;
          vUv = uv;

          // Billboard: always face camera
          vec4 mvPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mvPosition.xy += position.xy * instanceScale;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uTime;

        varying vec3 vColor;
        varying vec2 vUv;

        void main() {
          vec4 texColor = texture2D(uTexture, vUv);

          // Apply instance color
          vec3 finalColor = vColor * texColor.rgb * 2.0; // Boost brightness

          // Subtle pulse
          float pulse = sin(uTime * 2.0) * 0.1 + 0.9;
          finalColor *= pulse;

          gl_FragColor = vec4(finalColor, texColor.a * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [textures]);

  // Animation
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();
    material.uniforms.uTime.value = time;

    const positions = meshRef.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      const data = particleData.current[i];

      // Gentle floating motion
      const x = data.baseX + Math.sin(time * data.speedX + data.phaseX) * 2;
      const y = data.baseY + Math.sin(time * data.speedY + data.phaseY) * 1;
      const z = data.baseZ;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z - scrollOffset * 200; // Move with scroll
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    >
      <bufferAttribute
        attach="geometry-attributes-position"
        array={positions}
        count={count}
        itemSize={3}
      />
    </instancedMesh>
  );
}

export default SoftParticles;
