/**
 * CNTower — Tron Energy Spire with orbiting rings.
 *
 * A procedural CN Tower landmark with animated beacon, pulsing pod windows,
 * three orbiting energy rings, and neon edge lines. The beacon uses quadratic
 * pulse (sin²) for a natural glow rhythm.
 *
 * @param {[number,number,number]} [props.position=[0,0,0]] - World position
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CNTower = ({ position = [0, 0, 0] }) => {
    const beaconRef = useRef()
    const glowRef = useRef()
    const podGlowRef = useRef()
    const ring1Ref = useRef()
    const ring2Ref = useRef()
    const ring3Ref = useRef()
    const coreRef = useRef()

    useFrame((state) => {
        const time = state.clock.elapsedTime

        // Pulsing beacon
        if (beaconRef.current) {
            const pulse = Math.sin(time * 3) * 0.5 + 0.5
            beaconRef.current.material.emissiveIntensity = 3 + pulse * 7
            beaconRef.current.scale.setScalar(1 + pulse * 0.3)
        }

        // Outer glow pulse
        if (glowRef.current) {
            const pulse = Math.sin(time * 3) * 0.5 + 0.5
            glowRef.current.material.opacity = 0.1 + pulse * 0.2
            glowRef.current.scale.setScalar(1 + pulse * 0.5)
        }

        // Pod windows subtle pulse
        if (podGlowRef.current) {
            const pulse = Math.sin(time * 1.5) * 0.3 + 0.7
            podGlowRef.current.material.emissiveIntensity = 2 + pulse * 2
        }

        // Orbiting energy rings
        if (ring1Ref.current) {
            ring1Ref.current.rotation.y = time * 0.5
            ring1Ref.current.rotation.x = Math.sin(time * 0.3) * 0.2
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.y = -time * 0.7
            ring2Ref.current.rotation.z = Math.cos(time * 0.4) * 0.15
        }
        if (ring3Ref.current) {
            ring3Ref.current.rotation.y = time * 0.3
            ring3Ref.current.rotation.x = Math.cos(time * 0.2) * 0.3
        }

        // Energy core pulse
        if (coreRef.current) {
            const p = Math.sin(time * 2) * 0.5 + 0.5
            coreRef.current.material.emissiveIntensity = 4 + p * 4
        }
    })

    return (
        <group position={position}>
            {/* Main shaft */}
            <mesh position={[0, 15, 0]}>
                <cylinderGeometry args={[0.8, 1.5, 30, 6]} />
                <meshBasicMaterial color="#1a1a2e" />
            </mesh>
            {/* Shaft neon edge lines */}
            {[0, 1, 2, 3, 4, 5].map(i => (
                <mesh key={`shaft-line-${i}`} position={[
                    Math.cos(i * Math.PI / 3) * 1.1,
                    15,
                    Math.sin(i * Math.PI / 3) * 1.1
                ]}>
                    <boxGeometry args={[0.03, 30, 0.03]} />
                    <meshStandardMaterial color="#05d9e8" emissive="#05d9e8" emissiveIntensity={2} toneMapped={false} />
                </mesh>
            ))}
            {/* Pod (observation deck) */}
            <mesh position={[0, 28, 0]}>
                <cylinderGeometry args={[3, 2.5, 4, 12]} />
                <meshBasicMaterial color="#0a0a15" />
            </mesh>
            {/* Pod windows glow */}
            <mesh ref={podGlowRef} position={[0, 28, 0]}>
                <cylinderGeometry args={[3.1, 2.6, 1.5, 12]} />
                <meshStandardMaterial color="#05d9e8" emissive="#05d9e8" emissiveIntensity={3} transparent opacity={0.9} toneMapped={false} />
            </mesh>
            {/* Pod neon ring */}
            <mesh position={[0, 26, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.05, 8, 24]} />
                <meshStandardMaterial color="#ff2a6d" emissive="#ff2a6d" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            <mesh position={[0, 30, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.05, 8, 24]} />
                <meshStandardMaterial color="#ff2a6d" emissive="#ff2a6d" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            {/* Energy core inside pod */}
            <mesh ref={coreRef} position={[0, 28, 0]}>
                <sphereGeometry args={[1.2, 12, 12]} />
                <meshStandardMaterial color="#05d9e8" emissive="#05d9e8" emissiveIntensity={5} transparent opacity={0.6} toneMapped={false} />
            </mesh>
            {/* Orbiting energy rings */}
            <group ref={ring1Ref} position={[0, 28, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[5, 0.06, 8, 32]} />
                    <meshStandardMaterial color="#05d9e8" emissive="#05d9e8" emissiveIntensity={3} transparent opacity={0.7} toneMapped={false} />
                </mesh>
            </group>
            <group ref={ring2Ref} position={[0, 28, 0]}>
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                    <torusGeometry args={[6.5, 0.04, 8, 32]} />
                    <meshStandardMaterial color="#ff2a6d" emissive="#ff2a6d" emissiveIntensity={2.5} transparent opacity={0.5} toneMapped={false} />
                </mesh>
            </group>
            <group ref={ring3Ref} position={[0, 28, 0]}>
                <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}>
                    <torusGeometry args={[8, 0.03, 8, 32]} />
                    <meshStandardMaterial color="#d300c5" emissive="#d300c5" emissiveIntensity={2} transparent opacity={0.4} toneMapped={false} />
                </mesh>
            </group>
            {/* Upper shaft */}
            <mesh position={[0, 35, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 10, 6]} />
                <meshBasicMaterial color="#1a1a2e" />
            </mesh>
            {/* Antenna */}
            <mesh position={[0, 48, 0]}>
                <cylinderGeometry args={[0.1, 0.3, 20, 4]} />
                <meshBasicMaterial color="#222" />
            </mesh>
            {/* Antenna neon tip */}
            <mesh position={[0, 57, 0]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial color="#05d9e8" emissive="#05d9e8" emissiveIntensity={4} toneMapped={false} />
            </mesh>
            {/* Beacon outer glow */}
            <mesh ref={glowRef} position={[0, 58, 0]}>
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshBasicMaterial color="#ff2a6d" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            {/* Beacon */}
            <mesh ref={beaconRef} position={[0, 58, 0]}>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshStandardMaterial color="#ff2a6d" emissive="#ff2a6d" emissiveIntensity={5} toneMapped={false} />
            </mesh>
            {/* Beacon point light */}
            <pointLight position={[0, 58, 0]} color="#ff2a6d" intensity={50} distance={100} />
            {/* Base platform */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2, 6, 6]} />
                <meshStandardMaterial color="#05d9e8" emissive="#05d9e8" emissiveIntensity={1.5} transparent opacity={0.3} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

export default CNTower
