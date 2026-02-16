/**
 * Cityscape — Procedurally generated synthwave skyline flanking the highway.
 *
 * Uses a seeded PRNG (not Math.random) so the city layout is identical across
 * renders and hot-reloads — preventing jarring building position shifts.
 * Building count scales with TOTAL_DISTANCE so the skyline always fills the
 * full scrollable road length. Also places HighwayArch and DataStream elements
 * at regular intervals for visual rhythm.
 *
 * @param {number} props.totalDistance - Total scrollable distance for scaling
 * @param {number} [props.cnTowerZ=-280] - Z position for the CN Tower landmark
 */
import { useMemo } from 'react'
import CNTower from './CNTower'
import TronBuilding from './TronBuilding'
import HighwayArch from './HighwayArch'
import DataStream from './DataStream'

const NEON_PALETTE = ['#05d9e8', '#ff2a6d', '#7700ff', '#d300c5', '#00ff88']

/**
 * Deterministic PRNG — sin-hash trick (from GPU shader tradition).
 * The magic constants (127.1, 43758.5453) produce a well-distributed
 * pseudo-random sequence when fed sequential integers as seeds.
 */
const seed = (n) => {
    let x = Math.sin(n * 127.1) * 43758.5453
    return x - Math.floor(x)
}

const Cityscape = ({ totalDistance, cnTowerZ = -280 }) => {
    const cityData = useMemo(() => {
        const buildings = []
        const arches = []
        const streams = []
        const baseZ = -30
        const spread = totalDistance + 100

        // Scale building count to road length (roughly 1 building per 40 units per row)
        const innerCount = Math.max(18, Math.floor(spread / 40))
        const outerCount = Math.max(14, Math.floor(spread / 55))

        // LEFT SIDE - Dense inner row (close to road)
        for (let i = 0; i < innerCount; i++) {
            const s = seed(i * 3.7)
            const s2 = seed(i * 7.3)
            const s3 = seed(i * 11.1)
            const height = 12 + s * 35
            const width = 3 + s2 * 5
            const z = baseZ - i * (spread / innerCount)
            const type = height > 30 ? 'tower' : height > 18 ? 'mid' : 'small'
            buildings.push({
                position: [-18 - s2 * 6, 0, z],
                width, depth: 2 + s3 * 3, height,
                color: NEON_PALETTE[Math.floor(s3 * NEON_PALETTE.length)],
                type
            })
        }

        // LEFT SIDE - Outer row (further back)
        for (let i = 0; i < outerCount; i++) {
            const s = seed(i * 5.1 + 100)
            const s2 = seed(i * 9.7 + 100)
            const s3 = seed(i * 13.3 + 100)
            const height = 18 + s * 45
            const width = 4 + s2 * 8
            const z = baseZ - 15 - i * (spread / outerCount)
            buildings.push({
                position: [-30 - s2 * 18, 0, z],
                width, depth: 3 + s3 * 4, height,
                color: NEON_PALETTE[Math.floor(s3 * NEON_PALETTE.length)],
                type: height > 35 ? 'tower' : 'mid'
            })
        }

        // RIGHT SIDE - Dense inner row
        for (let i = 0; i < innerCount; i++) {
            const s = seed(i * 4.3 + 200)
            const s2 = seed(i * 8.1 + 200)
            const s3 = seed(i * 12.7 + 200)
            const height = 12 + s * 35
            const width = 3 + s2 * 5
            const z = baseZ - i * (spread / innerCount)
            const type = height > 30 ? 'tower' : height > 18 ? 'mid' : 'small'
            buildings.push({
                position: [18 + s2 * 6, 0, z],
                width, depth: 2 + s3 * 3, height,
                color: NEON_PALETTE[Math.floor(s3 * NEON_PALETTE.length)],
                type
            })
        }

        // RIGHT SIDE - Outer row
        for (let i = 0; i < outerCount; i++) {
            const s = seed(i * 6.1 + 300)
            const s2 = seed(i * 10.3 + 300)
            const s3 = seed(i * 14.7 + 300)
            const height = 18 + s * 45
            const width = 4 + s2 * 8
            const z = baseZ - 15 - i * (spread / outerCount)
            buildings.push({
                position: [30 + s2 * 18, 0, z],
                width, depth: 3 + s3 * 4, height,
                color: NEON_PALETTE[Math.floor(s3 * NEON_PALETTE.length)],
                type: height > 35 ? 'tower' : 'mid'
            })
        }

        // Highway arches scale with distance
        const archCount = Math.max(8, Math.floor(totalDistance / 80))
        for (let i = 0; i < archCount; i++) {
            const z = -60 - i * (totalDistance / archCount)
            arches.push({
                zPos: z,
                color: i % 2 === 0 ? '#05d9e8' : '#ff2a6d'
            })
        }

        // Data stream pillars scale with distance
        const streamCount = Math.max(12, Math.floor(totalDistance / 100))
        for (let i = 0; i < streamCount; i++) {
            const s = seed(i * 17.3 + 500)
            const s2 = seed(i * 19.7 + 500)
            const side = i % 2 === 0 ? -1 : 1
            streams.push({
                position: [side * (20 + s * 15), 0, -50 - i * (totalDistance / streamCount)],
                height: 25 + s2 * 30,
                color: NEON_PALETTE[Math.floor(s * NEON_PALETTE.length)]
            })
        }

        return { buildings, arches, streams }
    }, [totalDistance])

    return (
        <group>
            <CNTower position={[0, 0, cnTowerZ]} />

            {cityData.buildings.map((b, i) => (
                <TronBuilding
                    key={`bldg-${i}`}
                    position={b.position}
                    width={b.width}
                    depth={b.depth}
                    height={b.height}
                    color={b.color}
                    type={b.type}
                />
            ))}

            {cityData.arches.map((arch, i) => (
                <HighwayArch key={`arch-${i}`} zPos={arch.zPos} color={arch.color} />
            ))}

            {cityData.streams.map((stream, i) => (
                <DataStream key={`stream-${i}`} position={stream.position} height={stream.height} color={stream.color} />
            ))}
        </group>
    )
}

export default Cityscape
