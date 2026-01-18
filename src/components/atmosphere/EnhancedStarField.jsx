// src/components/atmosphere/EnhancedStarField.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Enhanced star field with GPU-based twinkling
 * - 2000+ instanced stars for performance
 * - 8 color variations (warm whites, blue giants, red dwarfs)
 * - Shader-based twinkling (no CPU animation)
 * - Size variation with soft glow
 * - Occasional shooting star
 */
export function EnhancedStarField({
  count = 2000,
  radius = 400,
  depth = 600,
}) {
  const pointsRef = useRef();
  const shootingStarRef = useRef();

  // Star colors: warm whites, blue giants, red dwarfs, yellow suns
  const starColors = useMemo(() => [
    new THREE.Color('#ffffff'),  // Pure white
    new THREE.Color('#ffe4c4'),  // Warm white
    new THREE.Color('#aaccff'),  // Blue giant
    new THREE.Color('#88bbff'),  // Bright blue
    new THREE.Color('#ffdddd'),  // Red dwarf
    new THREE.Color('#ffcc88'),  // Yellow sun
    new THREE.Color('#ddddff'),  // Cool white
    new THREE.Color('#ffbbaa'),  // Orange giant
  ], []);

  // Generate star data
  const { positions, colors, sizes, twinklePhases, twinkleSpeeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinklePhases = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute stars in a dome around the scene
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // Upper hemisphere only
      const r = radius + Math.random() * 100;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 20; // Shift up
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - depth / 2;

      // Random color
      const colorIndex = Math.floor(Math.random() * starColors.length);
      const color = starColors[colorIndex];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Size variation (most small, few large)
      const sizeRandom = Math.random();
      sizes[i] = sizeRandom < 0.9 ? 0.3 + Math.random() * 0.5 : 1.0 + Math.random() * 1.5;

      // Twinkle parameters
      twinklePhases[i] = Math.random() * Math.PI * 2;
      twinkleSpeeds[i] = 0.5 + Math.random() * 2.5;
    }

    return { positions, colors, sizes, twinklePhases, twinkleSpeeds };
  }, [count, radius, depth, starColors]);

  // Shader material for twinkling
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute float twinklePhase;
        attribute float twinkleSpeed;
        attribute vec3 starColor;

        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = starColor;

          // GPU-based twinkling
          float twinkle = sin(uTime * twinkleSpeed + twinklePhase);
          vTwinkle = 0.5 + twinkle * 0.5; // Normalize to 0.0-1.0

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size with distance attenuation and twinkle
          float sizeAtten = (300.0 / -mvPosition.z);
          gl_PointSize = size * sizeAtten * uPixelRatio * (0.7 + vTwinkle * 0.3);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          // Soft circular point with glow falloff
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);

          // Sharp core with soft glow
          float core = 1.0 - smoothstep(0.0, 0.2, dist);
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);

          float alpha = core + glow * 0.4;
          alpha *= vTwinkle;

          if (alpha < 0.01) discard;

          // Slight color boost for core
          vec3 finalColor = vColor * (1.0 + core * 0.5);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Shooting star state
  const shootingStar = useRef({
    active: false,
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    trail: [],
    life: 0,
    nextSpawnTime: Math.random() * 10 + 5,
  });

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
    }

    // Shooting star logic
    const ss = shootingStar.current;
    const time = clock.getElapsedTime();

    if (!ss.active && time > ss.nextSpawnTime) {
      // Spawn new shooting star
      ss.active = true;
      ss.life = 0;

      // Start from random position in upper sky
      ss.position.set(
        (Math.random() - 0.5) * 200,
        150 + Math.random() * 100,
        -200 - Math.random() * 200
      );

      // Velocity: diagonal downward
      const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
      ss.velocity.set(
        Math.cos(angle) * 8,
        -4 - Math.random() * 3,
        -2 + Math.random() * 4
      );

      ss.trail = [];
    }

    if (ss.active && shootingStarRef.current) {
      ss.life += 0.016;

      // Update position
      ss.position.add(ss.velocity.clone().multiplyScalar(0.016 * 60));

      // Add to trail
      ss.trail.push(ss.position.clone());
      if (ss.trail.length > 20) ss.trail.shift();

      // Update mesh
      shootingStarRef.current.position.copy(ss.position);

      // Fade out
      if (ss.life > 1.5 || ss.position.y < 0) {
        ss.active = false;
        ss.nextSpawnTime = time + 8 + Math.random() * 15;
      }
    }
  });

  return (
    <group>
      {/* Main star field */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-starColor"
            count={count}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={sizes}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-twinklePhase"
            count={count}
            array={twinklePhases}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-twinkleSpeed"
            count={count}
            array={twinkleSpeeds}
            itemSize={1}
          />
        </bufferGeometry>
        <primitive object={shaderMaterial} attach="material" />
      </points>

      {/* Shooting star */}
      <mesh ref={shootingStarRef} visible={shootingStar.current.active}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

export default EnhancedStarField;
