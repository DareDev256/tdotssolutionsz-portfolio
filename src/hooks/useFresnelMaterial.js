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
