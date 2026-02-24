/**
 * SpotlightPortal — Lightweight Three.js portal frame for VideoSpotlight.
 * Renders rotating neon torus rings + drifting particles behind the video
 * viewport, creating an "Astroworld gate" atmosphere. Transparent Canvas
 * with pointer-events: none so video interaction is unaffected.
 *
 * Respects prefers-reduced-motion (disables rotation/drift).
 * Desktop-only — hidden below 768px via CSS.
 */
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RING_COUNT = 2
const PARTICLE_COUNT = 40
const NEON_PALETTE = ['#ff2a6d', '#05d9e8', '#d300c5', '#7700ff']

/** Rotating neon ring pair that frames the viewport */
function PortalRings({ color, reducedMotion }) {
  const groupRef = useRef()
  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return
    groupRef.current.rotation.z += delta * 0.15
  })
  return (
    <group ref={groupRef}>
      {Array.from({ length: RING_COUNT }).map((_, i) => {
        const scale = 1.6 + i * 0.35
        const opacity = 0.25 - i * 0.08
        return (
          <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.4]}>
            <torusGeometry args={[scale, 0.015, 8, 64]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={3}
              transparent
              opacity={opacity}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/** Drifting particles that float around the portal perimeter */
function PortalParticles({ color, reducedMotion }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2
      const radius = 1.4 + Math.random() * 0.8
      arr[i * 3] = Math.cos(angle) * radius
      arr[i * 3 + 1] = Math.sin(angle) * radius
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.6
    }
    return arr
  }, [])

  useFrame((state) => {
    if (reducedMotion || !ref.current) return
    ref.current.rotation.z = state.clock.elapsedTime * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.03}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function SpotlightPortal({ colorIndex = 0 }) {
  const color = NEON_PALETTE[colorIndex % NEON_PALETTE.length]
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="now-playing__portal" aria-hidden="true">
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ pointerEvents: 'none' }}
      >
        <PortalRings color={color} reducedMotion={reducedMotion} />
        <PortalParticles color={color} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
