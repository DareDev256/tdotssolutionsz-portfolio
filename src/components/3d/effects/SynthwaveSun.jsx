/**
 * Synthwave sun with layered horizon bars — positioned at the end of the drive.
 * Pure presentational, no animation (static geometry).
 */
const SynthwaveSun = ({ zPosition = -300 }) => {
    return (
        <group position={[0, 15, zPosition - 50]}>
            {[...Array(6)].map((_, i) => (
                <mesh key={i} position={[0, -i * 1.5, -i * 0.01]}>
                    <circleGeometry args={[22 - i * 0.6, 32]} />
                    <meshBasicMaterial
                        color={i < 3 ? '#ffcc00' : '#ff6600'}
                        transparent
                        opacity={0.95 - i * 0.1}
                    />
                </mesh>
            ))}
            {[...Array(5)].map((_, i) => (
                <mesh key={`line-${i}`} position={[0, -4 - i * 2.5, 0.1]}>
                    <planeGeometry args={[55, 1.2 + i * 0.3]} />
                    <meshBasicMaterial color="#0d0221" />
                </mesh>
            ))}
        </group>
    )
}

export default SynthwaveSun
