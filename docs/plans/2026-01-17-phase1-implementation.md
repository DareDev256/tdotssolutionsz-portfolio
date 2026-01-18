# Phase 1: Core Visual Impact - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform flat pixel particles into soft atmospheric sprites, add volumetric ground fog, and apply fresnel rim lighting to vehicles.

**Architecture:** Create modular components in `src/components/` for particles, atmosphere, and materials. Use Canvas2D for procedural texture generation, custom shaders for fog and fresnel effects, and instanced meshes for performance.

**Tech Stack:** React Three Fiber, @react-three/drei, Three.js ShaderMaterial, Canvas2D textures

---

## Task 1: Create Procedural Texture Utilities

**Files:**
- Create: `src/utils/proceduralTextures.js`

**Step 1: Create the texture utility file**

```javascript
// src/utils/proceduralTextures.js
import * as THREE from 'three';

/**
 * Creates a soft circular particle texture with feathered edges
 * @param {number} size - Texture size in pixels (default 64)
 * @param {string} color - Center color (default white)
 * @returns {THREE.CanvasTexture}
 */
export function createSoftCircleTexture(size = 64, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color + 'cc'); // 80% opacity
  gradient.addColorStop(0.6, color + '66'); // 40% opacity
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a hexagonal bokeh texture for sci-fi lens flares
 * @param {number} size - Texture size in pixels (default 64)
 * @param {string} color - Hex color (default cyan)
 * @returns {THREE.CanvasTexture}
 */
export function createHexBokehTexture(size = 64, color = '#05d9e8') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  // Draw hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Gradient fill
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color + '88');
  gradient.addColorStop(1, color + '00');

  ctx.fillStyle = gradient;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates an elongated streak/wisp texture for speed effects
 * @param {number} width - Texture width (default 128)
 * @param {number} height - Texture height (default 32)
 * @param {string} color - Streak color (default white)
 * @returns {THREE.CanvasTexture}
 */
export function createStreakTexture(width = 128, height = 32, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, height / 2, width, height / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.2, color + '44');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(0.8, color + '44');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  // Vertical fade
  const vertGradient = ctx.createLinearGradient(0, 0, 0, height);
  vertGradient.addColorStop(0, 'rgba(0,0,0,0)');
  vertGradient.addColorStop(0.5, 'white');
  vertGradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Apply vertical fade as mask
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = vertGradient;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a soft dust mote texture
 * @param {number} size - Texture size (default 32)
 * @returns {THREE.CanvasTexture}
 */
export function createDustTexture(size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
```

**Step 2: Verify file created**

Run: `ls -la src/utils/`
Expected: `proceduralTextures.js` exists

**Step 3: Commit**

```bash
git add src/utils/proceduralTextures.js
git commit -m "feat: add procedural texture utilities for particles"
```

---

## Task 2: Create Soft Particles Component

**Files:**
- Create: `src/components/particles/SoftParticles.jsx`

**Step 1: Create the particles directory**

```bash
mkdir -p src/components/particles
```

**Step 2: Create the SoftParticles component**

```jsx
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
```

**Step 3: Verify file created**

Run: `ls -la src/components/particles/`
Expected: `SoftParticles.jsx` exists

**Step 4: Commit**

```bash
git add src/components/particles/SoftParticles.jsx
git commit -m "feat: add SoftParticles component with textured sprites"
```

---

## Task 3: Create Ground Fog Component

**Files:**
- Create: `src/components/atmosphere/GroundFog.jsx`

**Step 1: Create the atmosphere directory**

```bash
mkdir -p src/components/atmosphere
```

**Step 2: Create the GroundFog component**

```jsx
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
```

**Step 3: Verify file created**

Run: `ls -la src/components/atmosphere/`
Expected: `GroundFog.jsx` exists

**Step 4: Commit**

```bash
git add src/components/atmosphere/GroundFog.jsx
git commit -m "feat: add GroundFog and DistanceHaze atmosphere components"
```

---

## Task 4: Create Fresnel Material Hook

**Files:**
- Create: `src/hooks/useFresnelMaterial.js`

**Step 1: Create the hooks directory if needed**

```bash
mkdir -p src/hooks
```

**Step 2: Create the fresnel material hook**

```javascript
// src/hooks/useFresnelMaterial.js
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Creates a material with fresnel rim lighting effect
 * @param {Object} options
 * @param {string} options.baseColor - Base color of the material
 * @param {string} options.rimColor - Color of the fresnel rim glow
 * @param {number} options.rimPower - Fresnel falloff power (higher = tighter rim)
 * @param {number} options.rimIntensity - Brightness of the rim
 * @param {number} options.metalness - Material metalness
 * @param {number} options.roughness - Material roughness
 * @returns {THREE.ShaderMaterial}
 */
export function useFresnelMaterial({
  baseColor = '#1a1a2e',
  rimColor = '#05d9e8',
  rimPower = 2.5,
  rimIntensity = 1.5,
  metalness = 0.8,
  roughness = 0.3,
  emissive = '#000000',
  emissiveIntensity = 0,
} = {}) {
  return useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uBaseColor: { value: new THREE.Color(baseColor) },
        uRimColor: { value: new THREE.Color(rimColor) },
        uRimPower: { value: rimPower },
        uRimIntensity: { value: rimIntensity },
        uMetalness: { value: metalness },
        uRoughness: { value: roughness },
        uEmissive: { value: new THREE.Color(emissive) },
        uEmissiveIntensity: { value: emissiveIntensity },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uRimColor;
        uniform float uRimPower;
        uniform float uRimIntensity;
        uniform float uMetalness;
        uniform float uRoughness;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        uniform float uTime;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        void main() {
          // View direction
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          // Fresnel calculation
          float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
          fresnel = pow(fresnel, uRimPower);

          // Subtle pulse animation
          float pulse = sin(uTime * 2.0) * 0.1 + 0.9;

          // Base color with simple lighting
          float diffuse = max(dot(vNormal, vec3(0.5, 1.0, 0.3)), 0.0) * 0.5 + 0.5;
          vec3 baseContrib = uBaseColor * diffuse;

          // Metallic reflection approximation
          vec3 reflectDir = reflect(-viewDir, vNormal);
          float specular = pow(max(dot(reflectDir, vec3(0.5, 1.0, 0.3)), 0.0), 32.0 * (1.0 - uRoughness));
          vec3 specContrib = vec3(1.0) * specular * uMetalness;

          // Rim glow
          vec3 rimContrib = uRimColor * fresnel * uRimIntensity * pulse;

          // Emissive
          vec3 emissiveContrib = uEmissive * uEmissiveIntensity;

          // Combine
          vec3 finalColor = baseContrib + specContrib + rimContrib + emissiveContrib;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }, [baseColor, rimColor, rimPower, rimIntensity, metalness, roughness, emissive, emissiveIntensity]);
}

/**
 * Updates fresnel material time uniform (call in useFrame)
 * @param {THREE.ShaderMaterial} material
 * @param {number} time
 */
export function updateFresnelMaterial(material, time) {
  if (material && material.uniforms && material.uniforms.uTime) {
    material.uniforms.uTime.value = time;
  }
}

/**
 * Creates a simple fresnel rim-only material for existing meshes
 * Use this to add rim glow to existing standard materials
 */
export function createRimGlowMaterial(rimColor = '#05d9e8', rimPower = 3, rimIntensity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRimColor: { value: new THREE.Color(rimColor) },
      uRimPower: { value: rimPower },
      uRimIntensity: { value: rimIntensity },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uRimColor;
      uniform float uRimPower;
      uniform float uRimIntensity;
      uniform float uTime;

      varying vec3 vNormal;
      varying vec3 vWorldPosition;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), uRimPower);
        float pulse = sin(uTime * 3.0) * 0.15 + 0.85;

        vec3 rimColor = uRimColor * fresnel * uRimIntensity * pulse;
        float alpha = fresnel * 0.8;

        gl_FragColor = vec4(rimColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide, // Render on back faces for outline effect
  });
}

export default useFresnelMaterial;
```

**Step 3: Verify file created**

Run: `ls -la src/hooks/`
Expected: `useFresnelMaterial.js` exists

**Step 4: Commit**

```bash
git add src/hooks/useFresnelMaterial.js
git commit -m "feat: add useFresnelMaterial hook for rim lighting effects"
```

---

## Task 5: Create Component Index Files

**Files:**
- Create: `src/components/particles/index.js`
- Create: `src/components/atmosphere/index.js`

**Step 1: Create particles index**

```javascript
// src/components/particles/index.js
export { SoftParticles } from './SoftParticles';
```

**Step 2: Create atmosphere index**

```javascript
// src/components/atmosphere/index.js
export { GroundFog, DistanceHaze } from './GroundFog';
```

**Step 3: Commit**

```bash
git add src/components/particles/index.js src/components/atmosphere/index.js
git commit -m "feat: add component index files for clean imports"
```

---

## Task 6: Integrate Components into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Read current App.jsx to understand structure**

Read the file first to find the right integration points.

**Step 2: Add imports at top of App.jsx**

Add after existing imports:

```javascript
// New Phase 1 components
import { SoftParticles } from './components/particles';
import { GroundFog, DistanceHaze } from './components/atmosphere';
import { updateFresnelMaterial, createRimGlowMaterial } from './hooks/useFresnelMaterial';
```

**Step 3: Replace FloatingParticles with SoftParticles**

Find the `<FloatingParticles />` component in the Scene and replace with:

```jsx
<SoftParticles
  count={100}
  spread={60}
  height={18}
  baseY={1}
  scrollOffset={scroll.offset}
/>
```

**Step 4: Add GroundFog and DistanceHaze to Scene**

Add after the road/environment components:

```jsx
{/* Atmospheric fog */}
<GroundFog
  width={120}
  length={600}
  height={4}
  color="#0d0221"
  secondaryColor="#ff2a6d"
  opacity={0.35}
  scrollOffset={scroll.offset}
/>
<DistanceHaze
  color="#0d0221"
  intensity={0.5}
/>
```

**Step 5: Add fresnel rim to vehicles**

In each vehicle component (TronLightCycle, DeLorean, CyberBike), add a rim glow mesh that wraps the main body. This is done by creating a slightly larger duplicate mesh with the rim material.

For the TRON cycle (which user said looks good), we can enhance it slightly. For DeLorean and CyberBike, add more noticeable rim glow.

**Step 6: Test the changes**

Run: `npm run dev`
Expected: Site loads with soft particles, ground fog, and fresnel rims on vehicles

**Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate Phase 1 visual upgrades (particles, fog, fresnel)"
```

---

## Task 7: Fine-tune and Polish

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/particles/SoftParticles.jsx` (if needed)
- Modify: `src/components/atmosphere/GroundFog.jsx` (if needed)

**Step 1: Adjust particle colors and density**

Based on visual testing, tweak:
- Particle count
- Color distribution
- Size range
- Animation speed

**Step 2: Adjust fog density and color**

Based on visual testing, tweak:
- Fog opacity
- Color gradient
- Height distribution
- Animation speed

**Step 3: Adjust fresnel intensity**

Based on visual testing, tweak:
- Rim power (tightness)
- Rim intensity (brightness)
- Rim color per lane

**Step 4: Performance check**

Run: Check browser dev tools for FPS
Expected: Maintain 50+ FPS on desktop

**Step 5: Final commit**

```bash
git add -A
git commit -m "polish: fine-tune Phase 1 visual parameters"
```

---

## Success Criteria

- [ ] Particles are soft, glowing sprites (not pixel squares)
- [ ] Multiple particle textures (soft circles, hexagons, dust)
- [ ] Ground fog adds atmospheric depth
- [ ] Distance haze creates sense of depth
- [ ] Vehicles have fresnel rim glow
- [ ] Rim color matches lane (cyan right, pink left)
- [ ] Performance stays above 50fps
- [ ] No visual glitches or z-fighting

---

## Files Created/Modified Summary

| File | Action |
|------|--------|
| `src/utils/proceduralTextures.js` | CREATE |
| `src/components/particles/SoftParticles.jsx` | CREATE |
| `src/components/particles/index.js` | CREATE |
| `src/components/atmosphere/GroundFog.jsx` | CREATE |
| `src/components/atmosphere/index.js` | CREATE |
| `src/hooks/useFresnelMaterial.js` | CREATE |
| `src/App.jsx` | MODIFY |
