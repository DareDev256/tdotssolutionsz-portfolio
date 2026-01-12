import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    PerspectiveCamera,
    Text,
    ScrollControls,
    useScroll
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise, Scanline, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// ============================================
// PROJECT DATA (YouTube Links)
// ============================================
const NEON_COLORS = ['#ff2a6d', '#05d9e8', '#d300c5', '#7700ff', '#ff6b35', '#ffcc00', '#00ff88', '#ff00ff']

const VIDEOS = [
    // Original 6 videos
    { id: 1, title: 'Synthwave Beats', description: 'Original vibes', url: 'https://www.youtube.com/watch?v=9hRUzEGfW7o', uploadDate: '2023-01-15', viewCount: 850000 },
    { id: 2, title: 'Vaporwave Vibes', description: 'Chill aesthetic', url: 'https://www.youtube.com/watch?v=EmrpNsyVtDQ', uploadDate: '2023-03-20', viewCount: 1200000 },
    { id: 3, title: 'Neon Nights', description: 'City lights', url: 'https://www.youtube.com/watch?v=Xedv19NEX-E', uploadDate: '2023-05-10', viewCount: 750000 },
    { id: 4, title: 'Cyberpunk Drive', description: 'Future roads', url: 'https://www.youtube.com/watch?v=8p4i1b5IW2k', uploadDate: '2023-07-22', viewCount: 2100000 },
    { id: 5, title: 'Retro Future', description: 'Back to tomorrow', url: 'https://www.youtube.com/watch?v=u3O5PKN9vCQ', uploadDate: '2023-09-05', viewCount: 450000 },
    { id: 6, title: 'Final Lap', description: 'Victory ride', url: 'https://www.youtube.com/watch?v=E7ZStZMn-ac', uploadDate: '2023-11-18', viewCount: 1800000 },
    // New 16 videos (placeholder data - update later)
    { id: 7, title: 'Digital Dreams', description: 'Electronic vision', url: 'https://www.youtube.com/watch?v=L1ECRyART6o', uploadDate: '2024-01-15', viewCount: 500000 },
    { id: 8, title: 'Midnight Run', description: 'Night drive', url: 'https://www.youtube.com/watch?v=gOid4x6kpAk', uploadDate: '2024-02-20', viewCount: 750000 },
    { id: 9, title: 'Neon Highway', description: 'Endless road', url: 'https://www.youtube.com/watch?v=B28ZQ0l2loc', uploadDate: '2024-03-10', viewCount: 1200000 },
    { id: 10, title: 'Starlight Express', description: 'Cosmic journey', url: 'https://www.youtube.com/watch?v=d5ganmZS6aY', uploadDate: '2024-04-05', viewCount: 2000000 },
    { id: 11, title: 'Chrome Hearts', description: 'Metallic soul', url: 'https://www.youtube.com/watch?v=rFoNntvuQA8', uploadDate: '2024-05-12', viewCount: 350000 },
    { id: 12, title: 'Electric Sunset', description: 'Golden hour', url: 'https://www.youtube.com/watch?v=pPVPBMPShkQ', uploadDate: '2024-06-18', viewCount: 1500000 },
    { id: 13, title: 'Vapor Trail', description: 'Disappearing act', url: 'https://www.youtube.com/watch?v=kgIISZzhQBE', uploadDate: '2024-07-22', viewCount: 800000 },
    { id: 14, title: 'Turbo Boost', description: 'Maximum speed', url: 'https://www.youtube.com/watch?v=7MZ3YfQPZrs', uploadDate: '2024-08-30', viewCount: 3000000 },
    { id: 15, title: 'Laser Grid', description: 'Digital matrix', url: 'https://www.youtube.com/watch?v=FkVtdPrgtsU', uploadDate: '2024-09-14', viewCount: 450000 },
    { id: 16, title: 'Arcade Mode', description: 'Game on', url: 'https://www.youtube.com/watch?v=AKuI1b-o69M', uploadDate: '2024-10-08', viewCount: 1100000 },
    { id: 17, title: 'Pulse Wave', description: 'Heartbeat rhythm', url: 'https://www.youtube.com/watch?v=cUnESoCRPsw', uploadDate: '2024-11-20', viewCount: 600000 },
    { id: 18, title: 'Hologram City', description: 'Virtual reality', url: 'https://www.youtube.com/watch?v=_ijbOhWdGHQ', uploadDate: '2024-12-05', viewCount: 900000 },
    { id: 19, title: 'Quantum Leap', description: 'Time warp', url: 'https://www.youtube.com/watch?v=L75mTYXcRHw', uploadDate: '2025-01-10', viewCount: 2500000 },
    { id: 20, title: 'Plasma Core', description: 'Energy surge', url: 'https://www.youtube.com/watch?v=gwXOTijyua4', uploadDate: '2025-02-14', viewCount: 400000 },
    { id: 21, title: 'Warp Speed', description: 'Beyond limits', url: 'https://www.youtube.com/watch?v=0l5xIst3VME', uploadDate: '2025-03-22', viewCount: 1800000 },
    { id: 22, title: 'Infinity Loop', description: 'Never ending', url: 'https://www.youtube.com/watch?v=Jp9BsyBZJz4', uploadDate: '2025-04-01', viewCount: 700000 },
]

// Lane configuration
const LANE_CONFIG = {
    CHRONOLOGICAL: { x: 6, label: 'BY DATE' },
    POPULAR: { x: -6, label: 'MOST POPULAR' },
    CENTER: { x: 0 },
    BILLBOARD_Y: 4.5,
    BILLBOARD_Z_START: -25,
    BILLBOARD_Z_SPACING: 28,
    POPULAR_THRESHOLD: 1000000, // 1M views
}

// Process videos into lanes with positions
const processVideosIntoLanes = () => {
    // Sort by date for chronological lane (oldest first)
    const chronological = [...VIDEOS]
        .sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate))
        .map((video, index) => ({
            ...video,
            color: NEON_COLORS[index % NEON_COLORS.length],
            lane: 'chronological',
            position: [
                LANE_CONFIG.CHRONOLOGICAL.x,
                LANE_CONFIG.BILLBOARD_Y,
                LANE_CONFIG.BILLBOARD_Z_START - (index * LANE_CONFIG.BILLBOARD_Z_SPACING)
            ]
        }))

    // Filter and sort by views for popular lane (highest first)
    const popular = [...VIDEOS]
        .filter(v => v.viewCount >= LANE_CONFIG.POPULAR_THRESHOLD)
        .sort((a, b) => b.viewCount - a.viewCount)
        .map((video, index) => ({
            ...video,
            color: NEON_COLORS[(index + 3) % NEON_COLORS.length], // Offset colors
            lane: 'popular',
            position: [
                LANE_CONFIG.POPULAR.x,
                LANE_CONFIG.BILLBOARD_Y,
                LANE_CONFIG.BILLBOARD_Z_START - (index * LANE_CONFIG.BILLBOARD_Z_SPACING)
            ],
            laneId: `popular-${video.id}` // Unique ID for this lane instance
        }))

    return { chronological, popular, all: [...chronological, ...popular] }
}

const LANES = processVideosIntoLanes()
const PROJECTS = LANES.all // Backward compatibility

// Calculate total distance based on longest lane
const TOTAL_DISTANCE = Math.max(LANES.chronological.length, LANES.popular.length) * LANE_CONFIG.BILLBOARD_Z_SPACING + 50
const SCROLL_PAGES = Math.ceil(TOTAL_DISTANCE / 100) // Dynamic page count
const ACTIVE_RANGE = 30 // Slightly increased for dual lanes

// Audio tuning for active billboard
const AUDIO_SILENCE_DISTANCE = 35
const AUDIO_MAX_VOLUME = 80
const AUDIO_UPDATE_INTERVAL = 0.1
const AUDIO_VOLUME_EPSILON = 1
// Higher quality rendering settings
const CANVAS_GL_OPTIONS = {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false
}
const CANVAS_DPR = [1.5, 2] // Higher DPR for sharper visuals

// Lane switching animation
const LANE_SWITCH_SPEED = 0.08

const getVolumeFromDistance = (distance) => {
    if (!Number.isFinite(distance)) return 0
    const clamped = Math.min(distance, AUDIO_SILENCE_DISTANCE)
    const t = 1 - clamped / AUDIO_SILENCE_DISTANCE
    const eased = t * t
    return Math.round(eased * AUDIO_MAX_VOLUME)
}

// ============================================
// 3D BILLBOARD FRAME (With YouTube thumbnail)
// ============================================
const BillboardFrame = ({ project, isActive }) => {
    const { title, description, position, color, url } = project

    // Extract video ID for thumbnail URL
    const videoId = useMemo(() => {
        const idPart = url.split('v=')[1]
        if (!idPart) return url
        return idPart.split('&')[0]
    }, [url])

    // YouTube thumbnail URL (hqdefault is always available)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

    // Load YouTube thumbnail as texture
    const texture = useMemo(() => {
        const loader = new THREE.TextureLoader()
        const tex = loader.load(thumbnailUrl)
        tex.colorSpace = THREE.SRGBColorSpace
        return tex
    }, [thumbnailUrl])

    return (
        <group position={position}>
            {/* Support Poles */}
            <mesh position={[-2.2, -2.5, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 5, 16]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[2.2, -2.5, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 5, 16]} />
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Billboard Frame */}
            <mesh position={[0, 0, -0.1]}>
                <boxGeometry args={[5.8, 3.4, 0.2]} />
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Screen with YouTube thumbnail */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[5.4, 3.0]} />
                <meshBasicMaterial
                    map={texture}
                    toneMapped={false}
                />
            </mesh>

            {/* Dark overlay when not active */}
            <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[5.4, 3.0]} />
                <meshBasicMaterial
                    color="#000"
                    transparent
                    opacity={isActive ? 0 : 0.5}
                />
            </mesh>

            {/* Highway-style title on screen */}
            <Text
                position={[0, -0.8, 0.03]}
                fontSize={0.55}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                maxWidth={5}
                outlineWidth={0.03}
                outlineColor="#000000"
            >
                {title}
            </Text>

            {/* Description below title */}
            <Text
                position={[0, -1.2, 0.03]}
                fontSize={0.25}
                color={color}
                anchorX="center"
                anchorY="middle"
                maxWidth={5}
            >
                {description}
            </Text>

            {/* Neon Border Glow Effect */}
            <mesh position={[0, 1.55, 0.02]}>
                <boxGeometry args={[5.6, 0.1, 0.02]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[0, -1.55, 0.02]}>
                <boxGeometry args={[5.6, 0.1, 0.02]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[-2.75, 0, 0.02]}>
                <boxGeometry args={[0.1, 3.1, 0.02]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[2.75, 0, 0.02]}>
                <boxGeometry args={[0.1, 3.1, 0.02]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Track label above billboard */}
            <Text
                position={[0, 2.2, 0]}
                fontSize={0.35}
                color={color}
                anchorX="center"
                anchorY="middle"
                maxWidth={5}
            >
                {title}
            </Text>

            {/* Glow light only when active - saves GPU */}
            {isActive && <pointLight position={[0, 0, 2]} color={color} intensity={1.5} distance={6} />}
        </group>
    )
}


// ============================================
// CAMERA RIG - Moves with scroll + lane switching
// ============================================
const CameraRig = ({ children, currentLane, onLaneChange }) => {
    const scroll = useScroll()
    const rigRef = useRef()
    const targetXRef = useRef(LANE_CONFIG.CHRONOLOGICAL.x * 0.5) // Start slightly toward chrono lane

    // Handle keyboard lane switching
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                onLaneChange('popular')
            } else if (e.key === 'ArrowRight') {
                onLaneChange('chronological')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onLaneChange])

    // Update target X based on current lane
    useEffect(() => {
        if (currentLane === 'popular') {
            targetXRef.current = LANE_CONFIG.POPULAR.x * 0.6
        } else if (currentLane === 'chronological') {
            targetXRef.current = LANE_CONFIG.CHRONOLOGICAL.x * 0.6
        } else {
            targetXRef.current = 0
        }
    }, [currentLane])

    useFrame(() => {
        if (rigRef.current) {
            // Move camera forward based on scroll (negative Z is forward)
            const targetZ = -scroll.offset * TOTAL_DISTANCE
            rigRef.current.position.z = THREE.MathUtils.lerp(
                rigRef.current.position.z,
                targetZ,
                0.1
            )
            // Smooth lateral movement for lane switching
            rigRef.current.position.x = THREE.MathUtils.lerp(
                rigRef.current.position.x,
                targetXRef.current,
                LANE_SWITCH_SPEED
            )
        }
    })

    return (
        <group ref={rigRef}>
            {children}
        </group>
    )
}

// ============================================
// PROXIMITY TRACKER - Determines closest billboard (lane-aware)
// ============================================
const ProximityTracker = ({ onActiveChange, onActiveUpdate, currentLane }) => {
    const scroll = useScroll()
    const lastActiveRef = useRef(null)

    useFrame(() => {
        // Calculate current camera Z position
        const cameraZ = -scroll.offset * TOTAL_DISTANCE

        // Get billboards in current lane only
        const laneBillboards = currentLane === 'popular'
            ? LANES.popular
            : LANES.chronological

        // Find the closest billboard within range
        let closestProject = null
        let minDist = Infinity

        laneBillboards.forEach(project => {
            const billboardZ = project.position[2]
            const dist = Math.abs(billboardZ - cameraZ)

            // Only consider billboards within range
            if (dist < ACTIVE_RANGE && dist < minDist) {
                minDist = dist
                closestProject = project
            }
        })

        const closestId = closestProject?.laneId || closestProject?.id || null

        // Only update if changed (prevents unnecessary re-renders)
        if (closestId !== lastActiveRef.current) {
            lastActiveRef.current = closestId
            onActiveChange(closestProject)
        }

        if (onActiveUpdate) {
            onActiveUpdate({
                activeProject: closestProject,
                distance: minDist
            })
        }
    })

    return null
}

// ============================================
// SYNTHWAVE ROAD - Enhanced with dual lane markers
// ============================================
const SynthwaveRoad = () => {
    const gridRef = useRef()

    useFrame((_, delta) => {
        if (gridRef.current) {
            gridRef.current.position.z += delta * 5
            if (gridRef.current.position.z > 10) {
                gridRef.current.position.z -= 20
            }
        }
    })

    const gridLines = useMemo(() => {
        const positions = []
        const gridSize = 800
        const divisions = 160
        const step = gridSize / divisions

        for (let i = 0; i <= divisions; i++) {
            const z = -gridSize / 2 + i * step
            positions.push(-gridSize / 2, 0.01, z)
            positions.push(gridSize / 2, 0.01, z)
        }
        for (let i = 0; i <= divisions; i++) {
            const x = -gridSize / 2 + i * step
            positions.push(x, 0.01, -gridSize / 2)
            positions.push(x, 0.01, gridSize / 2)
        }
        return new Float32Array(positions)
    }, [])

    // Dashed lane divider markers
    const laneMarkers = useMemo(() => {
        const markers = []
        for (let z = 0; z > -700; z -= 15) {
            markers.push(z)
        }
        return markers
    }, [])

    return (
        <group>
            {/* Ground plane - extended */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -300]} receiveShadow>
                <planeGeometry args={[800, 800]} />
                <meshStandardMaterial color="#030308" roughness={0.95} />
            </mesh>

            {/* Animated grid */}
            <group ref={gridRef}>
                <lineSegments>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={gridLines.length / 3}
                            array={gridLines}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#ff2a6d" transparent opacity={0.2} />
                </lineSegments>
            </group>

            {/* Center divider - EMISSIVE for proper glow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -300]}>
                <planeGeometry args={[0.3, 800]} />
                <meshStandardMaterial
                    color="#05d9e8"
                    emissive="#05d9e8"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Dashed lane markers for Popular lane (left) */}
            {laneMarkers.map((z, i) => (
                <mesh key={`left-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[LANE_CONFIG.POPULAR.x, 0.025, z]}>
                    <planeGeometry args={[0.15, 8]} />
                    <meshBasicMaterial color="#7700ff" transparent opacity={0.7} />
                </mesh>
            ))}

            {/* Dashed lane markers for Chronological lane (right) */}
            {laneMarkers.map((z, i) => (
                <mesh key={`right-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[LANE_CONFIG.CHRONOLOGICAL.x, 0.025, z]}>
                    <planeGeometry args={[0.15, 8]} />
                    <meshBasicMaterial color="#ff6b35" transparent opacity={0.7} />
                </mesh>
            ))}

            {/* Outer edge lines - EMISSIVE neon pink */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.02, -300]}>
                <planeGeometry args={[0.5, 800]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={2.5}
                    toneMapped={false}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, 0.02, -300]}>
                <planeGeometry args={[0.5, 800]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={2.5}
                    toneMapped={false}
                />
            </mesh>

            {/* Lane labels on ground (subtle) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LANE_CONFIG.POPULAR.x, 0.02, -10]}>
                <planeGeometry args={[4, 1]} />
                <meshBasicMaterial color="#7700ff" transparent opacity={0.15} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[LANE_CONFIG.CHRONOLOGICAL.x, 0.02, -10]}>
                <planeGeometry args={[4, 1]} />
                <meshBasicMaterial color="#ff6b35" transparent opacity={0.15} />
            </mesh>
        </group>
    )
}

// ============================================
// STAR FIELD - Optimized static stars (no per-frame updates)
// ============================================
const StarField = () => {
    const count = 400 // Reduced from 2000

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

    // No useFrame - stars are static for performance
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

// ============================================
// CN TOWER - Toronto landmark (optimized geometry)
// ============================================
const CNTower = ({ position = [0, 0, 0] }) => {
    return (
        <group position={position}>
            {/* Main shaft */}
            <mesh position={[0, 15, 0]}>
                <cylinderGeometry args={[0.8, 1.5, 30, 6]} />
                <meshBasicMaterial color="#1a1a2e" />
            </mesh>
            {/* Pod (observation deck) */}
            <mesh position={[0, 28, 0]}>
                <cylinderGeometry args={[3, 2.5, 4, 12]} />
                <meshBasicMaterial color="#0a0a15" />
            </mesh>
            {/* Pod windows glow - EMISSIVE */}
            <mesh position={[0, 28, 0]}>
                <cylinderGeometry args={[3.1, 2.6, 1.5, 12]} />
                <meshStandardMaterial
                    color="#05d9e8"
                    emissive="#05d9e8"
                    emissiveIntensity={3}
                    transparent
                    opacity={0.9}
                    toneMapped={false}
                />
            </mesh>
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
            {/* Beacon - EMISSIVE pulsing beacon */}
            <mesh position={[0, 58, 0]}>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>
        </group>
    )
}

// ============================================
// CITYSCAPE - Toronto-inspired skyline (Optimized)
// ============================================
const Cityscape = ({ cnTowerZ = -280 }) => {
    // Pre-computed buildings with fixed window positions (no random in render)
    const buildings = useMemo(() => {
        const result = []
        const baseZ = -200
        const spread = 600

        // Reduced to 20 buildings per side (40 total instead of 80)
        for (let i = 0; i < 20; i++) {
            const height = 8 + Math.random() * 30
            const width = 3 + Math.random() * 5
            result.push({
                position: [-22 - Math.random() * 25, height / 2, baseZ + i * (spread / 20)],
                size: [width, height, 3],
                // Pre-generate window positions
                windows: Math.random() > 0.5 ? [...Array(3)].map(() => ({
                    x: (Math.random() - 0.5) * width * 0.5,
                    y: (Math.random() - 0.5) * height * 0.6,
                    color: Math.random() > 0.5 ? '#ffcc00' : '#05d9e8'
                })) : []
            })
        }

        for (let i = 0; i < 20; i++) {
            const height = 8 + Math.random() * 30
            const width = 3 + Math.random() * 5
            result.push({
                position: [22 + Math.random() * 25, height / 2, baseZ + i * (spread / 20)],
                size: [width, height, 3],
                windows: Math.random() > 0.5 ? [...Array(3)].map(() => ({
                    x: (Math.random() - 0.5) * width * 0.5,
                    y: (Math.random() - 0.5) * height * 0.6,
                    color: Math.random() > 0.5 ? '#ffcc00' : '#05d9e8'
                })) : []
            })
        }

        return result
    }, [])

    // Shared materials for better batching
    const buildingMaterial = useMemo(() => (
        <meshBasicMaterial color="#0a0a15" />
    ), [])

    return (
        <group>
            <CNTower position={[0, 0, cnTowerZ]} />

            {buildings.map((building, i) => (
                <group key={i} position={building.position}>
                    <mesh>
                        <boxGeometry args={building.size} />
                        {buildingMaterial}
                    </mesh>
                    {building.windows.map((win, j) => (
                        <mesh key={j} position={[win.x, win.y, building.size[2] / 2 + 0.01]}>
                            <planeGeometry args={[0.4, 0.5]} />
                            <meshBasicMaterial color={win.color} transparent opacity={0.6} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    )
}

// ============================================
// NEBULA CLOUDS - Static cosmic background (no per-frame updates)
// ============================================
const NebulaClouds = () => {
    return (
        <group position={[0, 50, -200]}>
            <mesh position={[-40, 20, -50]} rotation={[0, 0.3, 0]}>
                <planeGeometry args={[80, 50]} />
                <meshBasicMaterial color="#7700ff" transparent opacity={0.1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[30, 30, -80]} rotation={[0, -0.2, 0.1]}>
                <planeGeometry args={[60, 40]} />
                <meshBasicMaterial color="#ff2a6d" transparent opacity={0.08} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 40, -100]} rotation={[0.1, 0, 0]}>
                <planeGeometry args={[100, 60]} />
                <meshBasicMaterial color="#05d9e8" transparent opacity={0.05} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

// ============================================
// SYNTHWAVE SUN - Positioned at end of journey
// ============================================
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

// ============================================
// VEHICLE OPTIONS
// ============================================
const VEHICLES = {
    tron: 'TRON Light Cycle',
    delorean: 'DeLorean',
    cyberbike: 'Cyber Bike'
}

// ============================================
// TRON LIGHT CYCLE - Iconic design
// ============================================
const TronLightCycle = ({ color = '#05d9e8' }) => {
    return (
        <group position={[0, 0.6, -5]} rotation={[0, 0, 0]}>
            {/* Main body - sleek angular shape */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.4, 0.3, 2.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Front fairing - angular nose */}
            <mesh position={[0, 0.2, -1.2]} rotation={[-0.3, 0, 0]}>
                <boxGeometry args={[0.35, 0.25, 0.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Windscreen */}
            <mesh position={[0, 0.4, -0.8]} rotation={[-0.5, 0, 0]}>
                <planeGeometry args={[0.3, 0.4]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.6}
                    toneMapped={false}
                />
            </mesh>

            {/* Front wheel - solid disc */}
            <mesh position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.15, 24]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Front wheel glow ring */}
            <mesh position={[0, 0, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.4, 0.03, 8, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>

            {/* Rear wheel - solid disc */}
            <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.45, 0.45, 0.2, 24]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Rear wheel glow ring */}
            <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.45, 0.04, 8, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>

            {/* Light strips along body */}
            <mesh position={[0.21, 0.1, 0]}>
                <boxGeometry args={[0.02, 0.1, 2.5]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[-0.21, 0.1, 0]}>
                <boxGeometry args={[0.02, 0.1, 2.5]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    toneMapped={false}
                />
            </mesh>

            {/* Tail light bar */}
            <mesh position={[0, 0.2, 1.4]}>
                <boxGeometry args={[0.35, 0.08, 0.02]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>

            {/* Light trail effect (static representation) */}
            <mesh position={[0, 0.05, 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.08, 3]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.4}
                    toneMapped={false}
                />
            </mesh>

            {/* Headlight */}
            <pointLight position={[0, 0.2, -1.8]} color="#ffffff" intensity={3} distance={20} />
        </group>
    )
}

// ============================================
// DELOREAN - Back to the Future style
// ============================================
const DeLorean = ({ color = '#05d9e8' }) => {
    return (
        <group position={[0, 0.5, -6]}>
            {/* Main body */}
            <mesh>
                <boxGeometry args={[2, 0.5, 4]} />
                <meshStandardMaterial color="#888" metalness={0.95} roughness={0.05} />
            </mesh>
            {/* Cabin */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.8, 0.5, 2]} />
                <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Flux capacitor glow */}
            <mesh position={[0, 0.3, 0.5]}>
                <boxGeometry args={[0.3, 0.3, 0.1]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>
            {/* Time circuits */}
            <mesh position={[0, 0.8, -0.2]}>
                <boxGeometry args={[0.8, 0.15, 0.4]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>
            {/* Underglow */}
            <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.2, 4.2]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.5}
                    transparent
                    opacity={0.4}
                    toneMapped={false}
                />
            </mesh>
            <pointLight position={[0, 0.2, -2.5]} color="#ffffff" intensity={2} distance={15} />
        </group>
    )
}

// ============================================
// CYBER BIKE - Futuristic motorcycle
// ============================================
const CyberBike = ({ color = '#ff2a6d' }) => {
    return (
        <group position={[0, 0.5, -5]}>
            {/* Frame */}
            <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}>
                <boxGeometry args={[0.3, 0.4, 2.2]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Tank */}
            <mesh position={[0, 0.5, -0.3]}>
                <boxGeometry args={[0.5, 0.3, 0.8]} />
                <meshStandardMaterial color="#0a0a15" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Front wheel */}
            <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.35, 0.08, 8, 24]} />
                <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Rear wheel */}
            <mesh position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.4, 0.1, 8, 24]} />
                <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Neon strips */}
            <mesh position={[0.2, 0.3, 0]}>
                <boxGeometry args={[0.02, 0.5, 1.8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>
            <mesh position={[-0.2, 0.3, 0]}>
                <boxGeometry args={[0.02, 0.5, 1.8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    toneMapped={false}
                />
            </mesh>
            {/* Tail light */}
            <mesh position={[0, 0.35, 1.1]}>
                <boxGeometry args={[0.25, 0.1, 0.02]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>
            <pointLight position={[0, 0.3, -1.5]} color="#ffffff" intensity={2} distance={15} />
        </group>
    )
}

// ============================================
// VEHICLE COMPONENT - Renders selected vehicle
// ============================================
const Vehicle = ({ type = 'tron', color }) => {
    switch (type) {
        case 'delorean':
            return <DeLorean color={color} />
        case 'cyberbike':
            return <CyberBike color={color} />
        case 'tron':
        default:
            return <TronLightCycle color={color} />
    }
}

// ============================================
// MAIN SCENE
// ============================================
const Scene = ({ onActiveChange, currentLane, onLaneChange, vehicleType }) => {
    const [activeProject, setActiveProject] = useState(null)

    const handleActiveChange = useCallback((project) => {
        setActiveProject(project)
        onActiveChange(project)
    }, [onActiveChange])

    // Get unique key for active state
    const getActiveKey = (project) => project.laneId || `${project.lane}-${project.id}`

    return (
        <>
            {/* Deep space background */}
            <color attach="background" args={['#030308']} />
            {/* Atmospheric fog - closer start for more depth */}
            <fog attach="fog" args={['#0d0221', 40, 280]} />

            {/* Enhanced Lighting Setup */}
            <ambientLight intensity={0.15} color="#1a0a2e" />
            {/* Hemisphere: sky purple, ground pink - synthwave colors */}
            <hemisphereLight
                skyColor="#7700ff"
                groundColor="#ff2a6d"
                intensity={0.3}
            />
            {/* Warm backlight from sun */}
            <directionalLight position={[0, 30, -150]} intensity={0.8} color="#ff6600" />
            {/* Cool rim light from front */}
            <directionalLight position={[0, 10, 50]} intensity={0.2} color="#05d9e8" />

            {/* Cosmic background elements */}
            <StarField />
            <NebulaClouds />

            {/* Sun at the END of the journey, behind CN Tower */}
            <SynthwaveSun zPosition={-TOTAL_DISTANCE - 30} />

            {/* Toronto cityscape - CN Tower at END of scroll */}
            <Cityscape cnTowerZ={-TOTAL_DISTANCE - 20} />

            {/* Road stays in place */}
            <SynthwaveRoad />

            {/* Camera rig that moves with scroll + lane switching */}
            <CameraRig currentLane={currentLane} onLaneChange={onLaneChange}>
                <PerspectiveCamera makeDefault position={[0, 3.5, 0]} fov={75} />
                <Vehicle type={vehicleType} />
            </CameraRig>

            {/* Proximity tracker to determine active billboard (lane-aware) */}
            <ProximityTracker
                onActiveChange={handleActiveChange}
                currentLane={currentLane}
            />

            {/* Chronological lane billboards (right side) */}
            {LANES.chronological.map((project) => (
                <BillboardFrame
                    key={`chrono-${project.id}`}
                    project={project}
                    isActive={activeProject && getActiveKey(activeProject) === getActiveKey(project)}
                />
            ))}

            {/* Popular lane billboards (left side) */}
            {LANES.popular.map((project) => (
                <BillboardFrame
                    key={`popular-${project.id}`}
                    project={project}
                    isActive={activeProject && getActiveKey(activeProject) === getActiveKey(project)}
                />
            ))}

            {/* Enhanced Post-Processing for Synthwave Aesthetic */}
            <EffectComposer disableNormalPass multisampling={4}>
                <Bloom
                    luminanceThreshold={0.2}
                    luminanceSmoothing={0.9}
                    intensity={1.2}
                    mipmapBlur
                    radius={0.8}
                />
                <ChromaticAberration
                    offset={[0.0008, 0.0008]}
                    radialModulation={true}
                    modulationOffset={0.5}
                />
                <Vignette
                    offset={0.3}
                    darkness={0.7}
                    blendFunction={BlendFunction.NORMAL}
                />
                <Noise
                    premultiply
                    blendFunction={BlendFunction.SOFT_LIGHT}
                    opacity={0.15}
                />
                <Scanline
                    blendFunction={BlendFunction.OVERLAY}
                    density={1.2}
                    opacity={0.08}
                />
            </EffectComposer>
        </>
    )
}

// ============================================
// VIDEO OVERLAY (Fixed HTML - Never floats!)
// ============================================
const VideoOverlay = ({ activeProject, audioEnabled }) => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (activeProject) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }, [activeProject])

    if (!activeProject) return null

    const videoId = activeProject.url.split('v=')[1]?.split('&')[0] || activeProject.url

    return (
        <div className={`video-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="video-frame" style={{ borderColor: activeProject.color }}>
                <div className="video-title" style={{ color: activeProject.color }}>
                    {activeProject.title}
                </div>
                <div className="video-container">
                    <iframe
                        key={videoId}
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${audioEnabled ? 0 : 1}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                        style={{ border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={activeProject.title}
                    />
                    {/* CRT Scanline Overlay */}
                    <div className="crt-overlay" />
                </div>
                <div className="video-description">{activeProject.description}</div>
            </div>
        </div>
    )
}

// ============================================
// LANE INDICATOR
// ============================================
const LaneIndicator = ({ currentLane, onLaneChange }) => {
    return (
        <div className="lane-indicator">
            <button
                type="button"
                className={`lane-btn ${currentLane === 'popular' ? 'active' : ''}`}
                onClick={() => onLaneChange('popular')}
            >
                <span className="lane-icon">★</span>
                <span className="lane-label">POPULAR</span>
                <span className="lane-hint">←</span>
            </button>
            <div className="lane-divider">│</div>
            <button
                type="button"
                className={`lane-btn ${currentLane === 'chronological' ? 'active' : ''}`}
                onClick={() => onLaneChange('chronological')}
            >
                <span className="lane-hint">→</span>
                <span className="lane-label">BY DATE</span>
                <span className="lane-icon">◷</span>
            </button>
        </div>
    )
}

// ============================================
// VEHICLE SELECTOR
// ============================================
const VehicleSelector = ({ currentVehicle, onVehicleChange }) => {
    const vehicles = [
        { id: 'tron', label: 'TRON', icon: '⚡' },
        { id: 'delorean', label: 'DELOREAN', icon: '🚗' },
        { id: 'cyberbike', label: 'CYBER', icon: '🏍️' }
    ]

    return (
        <div className="vehicle-selector">
            {vehicles.map((v) => (
                <button
                    key={v.id}
                    type="button"
                    className={`vehicle-btn ${currentVehicle === v.id ? 'active' : ''}`}
                    onClick={() => onVehicleChange(v.id)}
                >
                    <span className="vehicle-icon">{v.icon}</span>
                    <span className="vehicle-label">{v.label}</span>
                </button>
            ))}
        </div>
    )
}

// ============================================
// UI OVERLAY
// ============================================
const UIOverlay = ({ audioEnabled, onToggleAudio, currentLane, onLaneChange, currentVehicle, onVehicleChange }) => {
    return (
        <>
            <div className="title-container">
                <h1 className="title">INFINITE DRIVE</h1>
                <p className="subtitle">CREATIVE PORTFOLIO</p>
            </div>
            <div className="controls-hint">
                <p>↓ SCROLL TO DRIVE ↓</p>
                <p className="lane-hint-text">← → SWITCH LANES</p>
            </div>
            <div className="speed-indicator">
                <div className="speed-label">VELOCITY</div>
                <div className="speed-value">∞</div>
            </div>

            {/* Lane Indicator */}
            <LaneIndicator currentLane={currentLane} onLaneChange={onLaneChange} />

            {/* Vehicle Selector */}
            <VehicleSelector currentVehicle={currentVehicle} onVehicleChange={onVehicleChange} />

            {/* Audio Enable Prompt */}
            {!audioEnabled && (
                <button
                    type="button"
                    className="audio-prompt"
                    onClick={onToggleAudio}
                >
                    CLICK TO ENABLE AUDIO
                </button>
            )}

            <button
                type="button"
                className={`audio-toggle ${audioEnabled ? 'on' : 'off'}`}
                onClick={onToggleAudio}
                aria-pressed={audioEnabled}
            >
                {audioEnabled ? 'AUDIO ON' : 'AUDIO OFF'}
            </button>
        </>
    )
}

// ============================================
// LOADING SCREEN
// ============================================
const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-text">INITIALIZING ENGINE</div>
            <div className="loading-bar">
                <div className="loading-progress"></div>
            </div>
        </div>
    )
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [activeProject, setActiveProject] = useState(null)
    const [currentLane, setCurrentLane] = useState('chronological')
    const [vehicleType, setVehicleType] = useState('tron') // tron, delorean, cyberbike

    const handleToggleAudio = useCallback(() => {
        setAudioEnabled((prev) => !prev)
    }, [])

    const handleLaneChange = useCallback((lane) => {
        setCurrentLane(lane)
    }, [])

    const handleActiveChange = useCallback((project) => {
        setActiveProject(project)
    }, [])

    const handleVehicleChange = useCallback((type) => {
        setVehicleType(type)
    }, [])

    return (
        <>
            <div className="canvas-container">
                <Canvas
                    shadows
                    gl={CANVAS_GL_OPTIONS}
                    dpr={CANVAS_DPR}
                >
                    <Suspense fallback={null}>
                        <ScrollControls pages={SCROLL_PAGES} damping={0.2}>
                            <Scene
                                onActiveChange={handleActiveChange}
                                currentLane={currentLane}
                                onLaneChange={handleLaneChange}
                                vehicleType={vehicleType}
                            />
                        </ScrollControls>
                    </Suspense>
                </Canvas>
            </div>
            {/* Video overlay - Fixed HTML, never floats! */}
            <VideoOverlay activeProject={activeProject} audioEnabled={audioEnabled} />
            <UIOverlay
                audioEnabled={audioEnabled}
                onToggleAudio={handleToggleAudio}
                currentLane={currentLane}
                onLaneChange={handleLaneChange}
                currentVehicle={vehicleType}
                onVehicleChange={handleVehicleChange}
            />
            <Suspense fallback={<LoadingScreen />}>
                <div style={{ display: 'none' }}>Loaded</div>
            </Suspense>
        </>
    )
}
