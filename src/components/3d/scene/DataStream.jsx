/**
 * DataStream — Animated vertical light pillar.
 *
 * A pulsing neon beam rising from a glowing base ring. Phase offset is
 * randomized per instance so adjacent streams don't pulse in sync.
 *
 * @param {[number,number,number]} props.position - World position
 * @param {number} [props.height=30] - Pillar height in world units
 * @param {string} [props.color='#05d9e8'] - Neon color
 */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const DataStream = ({ position, height = 30, color = '#05d9e8' }) => {
    const streamRef = useRef()
    const basePhase = useMemo(() => Math.random() * Math.PI * 2, [])

    useFrame((state) => {
        if (streamRef.current) {
            const pulse = Math.sin(state.clock.elapsedTime * 2 + basePhase) * 0.3 + 0.7
            streamRef.current.material.opacity = 0.12 * pulse
        }
    })

    return (
        <group position={position}>
            {/* Light pillar */}
            <mesh ref={streamRef} position={[0, height / 2, 0]}>
                <planeGeometry args={[0.4, height]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.12}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Base glow ring */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.1, 0.6, 6]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.3} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

export default DataStream
