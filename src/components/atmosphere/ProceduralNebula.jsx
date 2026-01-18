// src/components/atmosphere/ProceduralNebula.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Procedural nebula clouds using FBM (Fractal Brownian Motion) noise
 * - 5-8 cloud layers at different depths for parallax
 * - Purple/pink/cyan color gradients
 * - Slow drift animation
 * - Responsive to scroll for parallax effect
 */
export function ProceduralNebula({
  scrollOffset = 0,
  intensity = 0.6,
}) {
  const meshRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uScrollOffset: { value: 0 },
        uIntensity: { value: intensity },
        uColor1: { value: new THREE.Color('#1a0a2e') },  // Deep purple
        uColor2: { value: new THREE.Color('#ff2a6d') },  // Neon pink
        uColor3: { value: new THREE.Color('#05d9e8') },  // Cyan
        uColor4: { value: new THREE.Color('#7700ff') },  // Violet
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          vUv = uv;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uScrollOffset;
        uniform float uIntensity;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform vec3 uColor4;

        varying vec2 vUv;
        varying vec3 vWorldPos;

        // Simplex noise functions
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                  dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        // Fractal Brownian Motion - multiple octaves of noise
        float fbm(vec2 p, int octaves) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          float lacunarity = 2.0;
          float persistence = 0.5;

          for (int i = 0; i < 6; i++) {
            if (i >= octaves) break;
            value += amplitude * snoise(p * frequency);
            frequency *= lacunarity;
            amplitude *= persistence;
          }

          return value;
        }

        // Domain warping for more organic shapes
        float warpedFbm(vec2 p, float time) {
          vec2 q = vec2(
            fbm(p + vec2(0.0, 0.0), 4),
            fbm(p + vec2(5.2, 1.3), 4)
          );

          vec2 r = vec2(
            fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * time, 4),
            fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * time, 4)
          );

          return fbm(p + 4.0 * r, 5);
        }

        void main() {
          // Multiple cloud layers with different speeds for parallax
          vec2 uv = vUv;
          float time = uTime * 0.05;

          // Layer 1: Large, slow-moving clouds
          vec2 p1 = uv * 2.0 + vec2(time * 0.1, time * 0.05);
          float n1 = warpedFbm(p1, time) * 0.5 + 0.5;

          // Layer 2: Medium clouds
          vec2 p2 = uv * 4.0 + vec2(time * 0.15, -time * 0.08);
          float n2 = warpedFbm(p2 + 100.0, time * 1.2) * 0.5 + 0.5;

          // Layer 3: Small detail wisps
          vec2 p3 = uv * 8.0 + vec2(-time * 0.2, time * 0.12);
          float n3 = fbm(p3 + 200.0, 3) * 0.5 + 0.5;

          // Layer 4: Very fine details
          vec2 p4 = uv * 12.0 + vec2(time * 0.08, time * 0.1);
          float n4 = fbm(p4 + 300.0, 2) * 0.5 + 0.5;

          // Combine layers with different weights
          float combinedNoise = n1 * 0.4 + n2 * 0.3 + n3 * 0.2 + n4 * 0.1;

          // Create cloud shapes from noise (threshold)
          float cloudShape = smoothstep(0.3, 0.7, combinedNoise);

          // Color gradient based on position and noise
          float colorMix1 = smoothstep(0.0, 0.5, uv.x + n1 * 0.3);
          float colorMix2 = smoothstep(0.5, 1.0, uv.y + n2 * 0.2);

          // Mix colors
          vec3 color = mix(uColor1, uColor2, colorMix1 * cloudShape);
          color = mix(color, uColor3, colorMix2 * n3 * 0.5);
          color = mix(color, uColor4, n4 * 0.3 * cloudShape);

          // Add some brightness variation
          color *= 0.8 + combinedNoise * 0.4;

          // Edge fade for natural blending
          float edgeFadeX = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
          float edgeFadeY = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
          float edgeFade = edgeFadeX * edgeFadeY;

          // Final alpha with cloud shape and edge fade
          float alpha = cloudShape * edgeFade * uIntensity;

          // Subtle pulsing
          alpha *= 0.9 + sin(time * 2.0) * 0.1;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, [intensity]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uScrollOffset.value = scrollOffset;
    }
  });

  return (
    <group>
      {/* Main nebula layer - far back */}
      <mesh
        ref={meshRef}
        position={[0, 80, -350]}
        scale={[400, 150, 1]}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive object={material} />
      </mesh>

      {/* Secondary layer - closer, different position */}
      <mesh
        position={[-100, 60, -250]}
        scale={[200, 100, 1]}
        rotation={[0, 0.1, 0]}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive object={material.clone()} />
      </mesh>

      {/* Third layer - right side accent */}
      <mesh
        position={[120, 100, -300]}
        scale={[180, 80, 1]}
        rotation={[0, -0.15, 0.05]}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
        <primitive object={material.clone()} />
      </mesh>
    </group>
  );
}

export default ProceduralNebula;
