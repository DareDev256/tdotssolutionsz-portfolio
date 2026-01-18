// src/components/atmosphere/GroundFog.jsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Animated ground fog with noise-based opacity
 * Creates depth and atmosphere near the road surface
 */
export function GroundFog({
  width = 100,
  length = 600,
  height = 3,
  color = '#1a0a2e',
  secondaryColor = '#ff2a6d',
  opacity = 0.4,
  scrollOffset = 0
}) {
  const meshRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFogColor: { value: new THREE.Color(color) },
        uSecondaryColor: { value: new THREE.Color(secondaryColor) },
        uOpacity: { value: opacity },
        uScrollOffset: { value: 0 },
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
        uniform vec3 uFogColor;
        uniform vec3 uSecondaryColor;
        uniform float uOpacity;
        uniform float uScrollOffset;

        varying vec2 vUv;
        varying vec3 vWorldPos;

        // Simplex noise function
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

        void main() {
          // Animated noise for fog wisps
          vec2 noiseCoord = vWorldPos.xz * 0.02;
          noiseCoord.y -= uTime * 0.1; // Slow drift

          float noise1 = snoise(noiseCoord) * 0.5 + 0.5;
          float noise2 = snoise(noiseCoord * 2.0 + 100.0) * 0.5 + 0.5;
          float combinedNoise = noise1 * 0.7 + noise2 * 0.3;

          // Height-based fade (thicker at bottom)
          float heightFade = 1.0 - smoothstep(0.0, 1.0, vUv.y);
          heightFade = pow(heightFade, 0.5);

          // Distance fade (thinner near camera)
          float distFade = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);

          // Color gradient (mix fog color with secondary at edges)
          float edgeMix = smoothstep(0.3, 0.0, abs(vWorldPos.x) / 50.0);
          vec3 finalColor = mix(uFogColor, uSecondaryColor, edgeMix * 0.3);

          // Final opacity
          float alpha = combinedNoise * heightFade * distFade * uOpacity;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });
  }, [color, secondaryColor, opacity]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uScrollOffset.value = scrollOffset;
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, height / 2, -length / 2]}
      rotation={[0, 0, 0]}
    >
      <planeGeometry args={[width, height, 1, 1]} />
      <primitive object={material} />
    </mesh>
  );
}

/**
 * Distance haze that creates depth perception
 */
export function DistanceHaze({
  scrollOffset = 0,
  color = '#0d0221',
  intensity = 0.6
}) {
  const meshRef = useRef();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        varying vec2 vUv;

        void main() {
          // Gradient from bottom (clear) to top (hazy)
          float gradient = smoothstep(0.0, 0.7, vUv.y);
          float alpha = gradient * uIntensity;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [color, intensity]);

  return (
    <mesh
      ref={meshRef}
      position={[0, 20, -400]}
      scale={[200, 80, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={material} />
    </mesh>
  );
}

export default GroundFog;
