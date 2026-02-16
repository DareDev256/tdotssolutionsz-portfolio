/**
 * TronBuilding — Procedural neon-edged skyscraper.
 *
 * Generates a dark building body with illuminated edge lines, optional
 * window grids, horizontal accent lines, and rooftop antennas for tall
 * "tower" type buildings. Used by Cityscape to populate the skyline.
 *
 * @param {[number,number,number]} props.position - World position
 * @param {number} props.width - Building footprint width
 * @param {number} props.depth - Building footprint depth
 * @param {number} props.height - Building height
 * @param {string} props.color - Neon accent color (hex)
 * @param {'tower'|'mid'|'small'} props.type - Building type (affects detail level)
 */
import * as THREE from 'three'

const TronBuilding = ({ position, width, depth, height, color, type }) => {
    return (
        <group position={position}>
            {/* Main structure - dark body */}
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshBasicMaterial color="#0a1228" />
            </mesh>
            {/* Neon edge lines - vertical corners */}
            {[
                [-width / 2, 0, -depth / 2],
                [width / 2, 0, -depth / 2],
                [-width / 2, 0, depth / 2],
                [width / 2, 0, depth / 2],
            ].map((pos, i) => (
                <mesh key={i} position={[pos[0], height / 2, pos[2]]}>
                    <boxGeometry args={[0.06, height, 0.06]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
                </mesh>
            ))}
            {/* Top edge ring */}
            {[
                { pos: [0, height, 0], size: [width, 0.06, 0.06] },
                { pos: [0, height, 0], size: [0.06, 0.06, depth] },
            ].map((edge, i) => (
                <mesh key={`top-${i}`} position={edge.pos}>
                    <boxGeometry args={edge.size} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
                </mesh>
            ))}
            {/* Rooftop cap - subtle glow to define building top */}
            <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[width - 0.1, depth - 0.1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.3}
                    transparent
                    opacity={0.15}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Bottom edge */}
            <mesh position={[0, 0.03, 0]}>
                <boxGeometry args={[width + 0.1, 0.06, depth + 0.1]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
            {/* Window grid on front face */}
            {type !== 'small' && [...Array(Math.min(Math.floor(height / 3), 6))].map((_, row) => (
                [...Array(Math.min(Math.floor(width / 2), 4))].map((_, col) => {
                    const winW = (width * 0.6) / Math.min(Math.floor(width / 2), 4)
                    const winH = 1.2
                    const startX = -width * 0.3
                    const startY = 2 + row * 3
                    if (startY + winH > height - 1) return null
                    return (
                        <mesh key={`win-${row}-${col}`} position={[startX + col * (winW + 0.3), startY, depth / 2 + 0.02]}>
                            <planeGeometry args={[winW * 0.8, winH]} />
                            <meshStandardMaterial
                                color={color}
                                emissive={color}
                                emissiveIntensity={0.8}
                                transparent
                                opacity={0.25}
                                toneMapped={false}
                            />
                        </mesh>
                    )
                })
            ))}
            {/* Horizontal accent lines */}
            {type === 'tower' && [0.33, 0.66].map(frac => (
                <mesh key={frac} position={[0, height * frac, depth / 2 + 0.02]}>
                    <boxGeometry args={[width, 0.04, 0.01]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} />
                </mesh>
            ))}
            {/* Rooftop antenna for tall buildings */}
            {type === 'tower' && (
                <>
                    <mesh position={[0, height + 2, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 4, 4]} />
                        <meshBasicMaterial color="#1a1a2e" />
                    </mesh>
                    <mesh position={[0, height + 4, 0]}>
                        <sphereGeometry args={[0.15, 6, 6]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} toneMapped={false} />
                    </mesh>
                </>
            )}
        </group>
    )
}

export default TronBuilding
