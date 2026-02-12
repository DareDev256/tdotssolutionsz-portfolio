import { useMemo } from 'react'

/**
 * Static star field — optimized fallback for reduced-effects mode.
 * No useFrame — positions are computed once and never updated.
 */
const StarField = () => {
    const count = 400

    const [positions, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI * 0.4
            const radius = 150 + Math.random() * 100

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.cos(phi) + 20
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 100

            const colorChoice = Math.random()
            if (colorChoice < 0.7) {
                colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1
            } else if (colorChoice < 0.85) {
                colors[i * 3] = 0.02; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.91
            } else {
                colors[i * 3] = 1; colors[i * 3 + 1] = 0.16; colors[i * 3 + 2] = 0.43
            }
        }
        return [positions, colors]
    }, [])

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.6} vertexColors transparent opacity={0.9} sizeAttenuation />
        </points>
    )
}

export default StarField
