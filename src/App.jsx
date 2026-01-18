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

// Phase 1 visual upgrade components
import { SoftParticles } from './components/particles'
import { GroundFog, DistanceHaze } from './components/atmosphere'

// ============================================
// PROJECT DATA (Loaded from JSON)
// ============================================
import videoData from './data/videos.json'

const NEON_COLORS = ['#ff2a6d', '#05d9e8', '#d300c5', '#7700ff', '#ff6b35', '#ffcc00', '#00ff88', '#ff00ff']

// Transform JSON data to include full YouTube URLs
const VIDEOS = videoData.videos.map(video => ({
    ...video,
    url: `https://www.youtube.com/watch?v=${video.youtubeId}`
}))

// Lane configuration
const LANE_CONFIG = {
    CHRONOLOGICAL: { x: 6, label: 'BY DATE' },
    POPULAR: { x: -6, label: 'MOST POPULAR' },
    CENTER: { x: 0 },
    BILLBOARD_Y: 4.5,
    BILLBOARD_Z_START: -25,
    BILLBOARD_Z_SPACING: 28,
    POPULAR_THRESHOLD: videoData.settings?.popularThreshold || 500000, // 500K views (from settings)
}

// Process videos into lanes with positions
const processVideosIntoLanes = () => {
    // Sort by date for chronological lane (newest first)
    const chronological = [...VIDEOS]
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
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
const CANVAS_DPR_DESKTOP = [1.5, 2] // Higher DPR for sharper visuals
const CANVAS_DPR_TABLET = [1, 1.5] // Lower DPR for better tablet performance

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

            {/* Ground Reflections - Inverted neon border glow */}
            <group position={[0, -position[1] * 2 - 0.5, 0]} scale={[1, -0.4, 1]}>
                {/* Top border reflection */}
                <mesh position={[0, 1.55, 0.02]}>
                    <boxGeometry args={[5.6, 0.1, 0.02]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.15}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
                {/* Bottom border reflection */}
                <mesh position={[0, -1.55, 0.02]}>
                    <boxGeometry args={[5.6, 0.1, 0.02]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.15}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
                {/* Side border reflections */}
                <mesh position={[-2.75, 0, 0.02]}>
                    <boxGeometry args={[0.1, 3.1, 0.02]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.12}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
                <mesh position={[2.75, 0, 0.02]}>
                    <boxGeometry args={[0.1, 3.1, 0.02]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.12}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            </group>

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
                0.15 // Snappier response for better 60fps feel
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
// SPEED LINES - Motion blur effect when scrolling fast
// ============================================
const SpeedLines = ({ reducedEffects }) => {
    const scroll = useScroll()
    const groupRef = useRef()
    const lastOffsetRef = useRef(0)
    const velocityRef = useRef(0)
    const lineCount = reducedEffects ? 12 : 20

    // Pre-generate line positions (spread on left and right sides)
    const lineData = useMemo(() => {
        const data = []
        for (let i = 0; i < lineCount; i++) {
            const side = i % 2 === 0 ? -1 : 1 // Alternate left/right
            const spreadY = (Math.random() - 0.5) * 4 + 2 // Vertical spread
            const spreadX = 2 + Math.random() * 2 // Distance from center
            const length = 3 + Math.random() * 5 // Line length variation
            data.push({
                side,
                x: side * spreadX,
                y: spreadY,
                z: -2 - Math.random() * 4,
                length,
                color: i % 3 === 0 ? '#05d9e8' : i % 3 === 1 ? '#ff2a6d' : '#ffffff'
            })
        }
        return data
    }, [lineCount])

    useFrame(() => {
        if (!groupRef.current) return

        // Calculate velocity from scroll offset change
        const currentOffset = scroll.offset
        const delta = Math.abs(currentOffset - lastOffsetRef.current)
        lastOffsetRef.current = currentOffset

        // Smooth velocity with lerp (decay when not scrolling)
        const targetVelocity = delta * 1000 // Scale for visibility
        velocityRef.current = THREE.MathUtils.lerp(velocityRef.current, targetVelocity, 0.1)

        // Velocity threshold for showing lines
        const velocityThreshold = 0.5
        const maxVelocity = 8
        const normalizedVelocity = Math.min((velocityRef.current - velocityThreshold) / maxVelocity, 1)
        const showLines = velocityRef.current > velocityThreshold

        // Update line opacities and scales
        groupRef.current.children.forEach((line, i) => {
            if (showLines && normalizedVelocity > 0) {
                line.material.opacity = normalizedVelocity * (0.3 + Math.random() * 0.2)
                line.scale.z = 1 + normalizedVelocity * 2 // Stretch lines based on velocity
            } else {
                line.material.opacity = THREE.MathUtils.lerp(line.material.opacity, 0, 0.15)
            }
        })
    })

    return (
        <group ref={groupRef} position={[0, 0, 0]}>
            {lineData.map((line, i) => (
                <mesh
                    key={i}
                    position={[line.x, line.y, line.z]}
                    rotation={[0, 0, line.side * 0.1]} // Slight angle
                >
                    <planeGeometry args={[0.03, line.length]} />
                    <meshBasicMaterial
                        color={line.color}
                        transparent
                        opacity={0}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    )
}

// ============================================
// PROXIMITY TRACKER - Determines closest billboard (lane-aware)
// ============================================
const ProximityTracker = ({ onActiveChange, onActiveUpdate, currentLane }) => {
    const scroll = useScroll()
    const lastActiveRef = useRef(null)
    const frameCountRef = useRef(0)

    useFrame(() => {
        // Throttle to check every 2nd frame for performance
        frameCountRef.current++
        if (frameCountRef.current % 2 !== 0) return

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
            {/* Ground plane - extended with wet/reflective surface */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -300]} receiveShadow>
                <planeGeometry args={[800, 800]} />
                <meshStandardMaterial
                    color="#030308"
                    roughness={0.3}
                    metalness={0.6}
                    envMapIntensity={0.5}
                />
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
// FLOATING NEON PARTICLES - Ambient atmosphere
// ============================================
const FloatingParticles = () => {
    const particlesRef = useRef()
    const count = 100 // Reduced from 150 for better performance

    const [positions, velocities, colors] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const velocities = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)

        const neonColors = [
            [1.0, 0.16, 0.43],   // pink
            [0.02, 0.85, 0.91],  // cyan
            [0.47, 0, 1.0],      // purple
            [1.0, 0.42, 0.21],   // orange
        ]

        for (let i = 0; i < count; i++) {
            // Spread particles around the driving path
            positions[i * 3] = (Math.random() - 0.5) * 40
            positions[i * 3 + 1] = Math.random() * 15 + 2
            positions[i * 3 + 2] = Math.random() * -600

            // Random slow velocities for drifting
            velocities[i * 3] = (Math.random() - 0.5) * 0.02
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01

            // Random neon color
            const color = neonColors[Math.floor(Math.random() * neonColors.length)]
            colors[i * 3] = color[0]
            colors[i * 3 + 1] = color[1]
            colors[i * 3 + 2] = color[2]
        }
        return [positions, velocities, colors]
    }, [])

    useFrame((state) => {
        if (!particlesRef.current) return
        const posArray = particlesRef.current.geometry.attributes.position.array
        const time = state.clock.elapsedTime

        for (let i = 0; i < count; i++) {
            // Gentle floating motion
            posArray[i * 3] += velocities[i * 3] + Math.sin(time * 0.5 + i) * 0.005
            posArray[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.5) * 0.01
            posArray[i * 3 + 2] += velocities[i * 3 + 2]

            // Reset particles that drift too far
            if (posArray[i * 3 + 1] > 20) posArray[i * 3 + 1] = 2
            if (posArray[i * 3 + 1] < 1) posArray[i * 3 + 1] = 15
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.3}
                vertexColors
                transparent
                opacity={0.8}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    )
}

// ============================================
// LASER BEAM SWEEPS - Classic synthwave spotlights
// ============================================
const LaserBeams = () => {
    const beamsRef = useRef()

    useFrame((state) => {
        if (!beamsRef.current) return
        const time = state.clock.elapsedTime

        // Animate beam rotations
        beamsRef.current.children.forEach((beam, i) => {
            const baseAngle = (i / beamsRef.current.children.length) * Math.PI * 2
            beam.rotation.z = Math.sin(time * 0.3 + baseAngle) * 0.5 + baseAngle
            beam.rotation.x = Math.sin(time * 0.2 + i) * 0.3 - 0.2
        })
    })

    const beamCount = 4 // Reduced from 6 for better performance

    return (
        <group ref={beamsRef} position={[0, 0, -400]}>
            {[...Array(beamCount)].map((_, i) => (
                <mesh
                    key={i}
                    position={[
                        Math.sin((i / beamCount) * Math.PI * 2) * 50,
                        0,
                        Math.cos((i / beamCount) * Math.PI * 2) * 50
                    ]}
                    rotation={[0, 0, (i / beamCount) * Math.PI * 2]}
                >
                    <coneGeometry args={[8, 150, 4, 1, true]} />
                    <meshBasicMaterial
                        color={i % 2 === 0 ? '#ff2a6d' : '#05d9e8'}
                        transparent
                        opacity={0.15}
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
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
// CN TOWER - Toronto landmark (with pulsing beacon)
// ============================================
const CNTower = ({ position = [0, 0, 0] }) => {
    const beaconRef = useRef()
    const glowRef = useRef()
    const podGlowRef = useRef()

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
    })

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
            {/* Pod windows glow - EMISSIVE with pulse */}
            <mesh ref={podGlowRef} position={[0, 28, 0]}>
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
            {/* Beacon outer glow */}
            <mesh ref={glowRef} position={[0, 58, 0]}>
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshBasicMaterial
                    color="#ff2a6d"
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Beacon - EMISSIVE pulsing beacon */}
            <mesh ref={beaconRef} position={[0, 58, 0]}>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={5}
                    toneMapped={false}
                />
            </mesh>
            {/* Beacon point light */}
            <pointLight position={[0, 58, 0]} color="#ff2a6d" intensity={50} distance={100} />
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

            {/* Enhanced light trail effect - multiple layers for depth */}
            <mesh position={[0, 0.05, 4]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.12, 8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={3}
                    transparent
                    opacity={0.6}
                    toneMapped={false}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Outer glow trail */}
            <mesh position={[0, 0.04, 5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.4, 12]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
            {/* Trail particles (simulated) */}
            <mesh position={[0, 0.06, 6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.06, 15]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={4}
                    transparent
                    opacity={0.3}
                    toneMapped={false}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
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
const Scene = ({ onActiveChange, currentLane, onLaneChange, vehicleType, reducedEffects = false }) => {
    const [activeProject, setActiveProject] = useState(null)
    const scroll = useScroll()

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

            {/* Cosmic background elements - reduced on tablets */}
            {!reducedEffects && <StarField />}
            {!reducedEffects && <NebulaClouds />}

            {/* Ambient neon particles - Phase 1 upgrade */}
            <SoftParticles
                count={100}
                spread={60}
                height={18}
                baseY={1}
                scrollOffset={scroll.offset}
            />

            {/* Sweeping laser beams in the distance */}
            {!reducedEffects && <LaserBeams />}

            {/* Sun at the END of the journey, behind CN Tower */}
            <SynthwaveSun zPosition={-TOTAL_DISTANCE - 30} />

            {/* Toronto cityscape - CN Tower at END of scroll */}
            <Cityscape cnTowerZ={-TOTAL_DISTANCE - 20} />

            {/* Road stays in place */}
            <SynthwaveRoad />

            {/* Atmospheric fog - Phase 1 upgrade */}
            <GroundFog
                width={120}
                length={600}
                height={4}
                color="#0d0221"
                secondaryColor="#ff2a6d"
                opacity={0.35}
                scrollOffset={scroll.offset}
            />
            <DistanceHaze
                color="#0d0221"
                intensity={0.5}
            />

            {/* Camera rig that moves with scroll + lane switching */}
            <CameraRig currentLane={currentLane} onLaneChange={onLaneChange}>
                <PerspectiveCamera makeDefault position={[0, 3.5, 0]} fov={75} />
                <Vehicle type={vehicleType} />
                {/* Speed lines appear when scrolling fast */}
                <SpeedLines reducedEffects={reducedEffects} />
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

            {/* Post-Processing - reduced on tablets for performance */}
            <EffectComposer disableNormalPass multisampling={reducedEffects ? 0 : 4}>
                <Bloom
                    luminanceThreshold={0.2}
                    luminanceSmoothing={0.9}
                    intensity={reducedEffects ? 0.8 : 1.2}
                    mipmapBlur
                    radius={reducedEffects ? 0.4 : 0.8}
                />
                {!reducedEffects && (
                    <ChromaticAberration
                        offset={[0.0008, 0.0008]}
                        radialModulation={true}
                        modulationOffset={0.5}
                    />
                )}
                <Vignette
                    offset={0.3}
                    darkness={reducedEffects ? 0.5 : 0.7}
                    blendFunction={BlendFunction.NORMAL}
                />
                {!reducedEffects && (
                    <Noise
                        premultiply
                        blendFunction={BlendFunction.SOFT_LIGHT}
                        opacity={0.15}
                    />
                )}
                {!reducedEffects && (
                    <Scanline
                        blendFunction={BlendFunction.OVERLAY}
                        density={1.2}
                        opacity={0.08}
                    />
                )}
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
export default function App({ reducedEffects = false }) {
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
                    dpr={reducedEffects ? CANVAS_DPR_TABLET : CANVAS_DPR_DESKTOP}
                >
                    <Suspense fallback={null}>
                        <ScrollControls pages={SCROLL_PAGES} damping={0.2}>
                            <Scene
                                onActiveChange={handleActiveChange}
                                currentLane={currentLane}
                                onLaneChange={handleLaneChange}
                                vehicleType={vehicleType}
                                reducedEffects={reducedEffects}
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
