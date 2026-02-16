/**
 * HighwayArch — Tron-style arch spanning the road.
 *
 * Two dark pillars with neon edge lines, a cross-beam, and a central
 * downward light strip. Placed at regular intervals by Cityscape for
 * visual rhythm along the highway.
 *
 * @param {number} props.zPos - Z position along the road
 * @param {string} [props.color='#05d9e8'] - Neon accent color
 */
import React from 'react'
import * as THREE from 'three'

const HighwayArch = ({ zPos, color = '#05d9e8' }) => {
    return (
        <group position={[0, 0, zPos]}>
            {/* Left pillar */}
            <mesh position={[-14, 10, 0]}>
                <boxGeometry args={[0.3, 20, 0.3]} />
                <meshBasicMaterial color="#08081a" />
            </mesh>
            {/* Right pillar */}
            <mesh position={[14, 10, 0]}>
                <boxGeometry args={[0.3, 20, 0.3]} />
                <meshBasicMaterial color="#08081a" />
            </mesh>
            {/* Top beam */}
            <mesh position={[0, 20, 0]}>
                <boxGeometry args={[28.6, 0.3, 0.3]} />
                <meshBasicMaterial color="#08081a" />
            </mesh>
            {/* Neon outlines - pillars */}
            {[-14, 14].map((x, i) => (
                <React.Fragment key={i}>
                    <mesh position={[x, 10, 0.16]}>
                        <boxGeometry args={[0.04, 20, 0.04]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
                    </mesh>
                    <mesh position={[x, 10, -0.16]}>
                        <boxGeometry args={[0.04, 20, 0.04]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
                    </mesh>
                </React.Fragment>
            ))}
            {/* Neon top beam */}
            <mesh position={[0, 20.16, 0]}>
                <boxGeometry args={[28.6, 0.04, 0.04]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
            {/* Downward light strip from center of arch */}
            <mesh position={[0, 15, 0]}>
                <planeGeometry args={[0.08, 10]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.15} toneMapped={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
        </group>
    )
}

export default HighwayArch
