import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect, createContext, useContext } from 'react'
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
import { GroundFog, DistanceHaze, EnhancedStarField, ProceduralNebula } from './components/atmosphere'
import { TheaterMode, ArtistPanel } from './components/ui'

// Shared data & utilities (single source of truth with MobileApp)
import { VIDEOS, NEON_COLORS, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS, LANE_CONFIG, processVideosIntoLanes, isDeceasedArtist } from './utils/videoData'
import { isValidYouTubeId, extractVideoId, getThumbnailUrl } from './utils/youtube'
import { formatViews } from './utils/formatters'
import { searchAll } from './hooks/useSearch'
import useVideoDeepLink from './hooks/useVideoDeepLink'
import useVideoNavigation from './hooks/useVideoNavigation'
import useCopyLink from './hooks/useCopyLink'

const LANES = processVideosIntoLanes()
const PROJECTS = LANES.all // Backward compatibility

// Filter context — lets nested 3D components read the current filter without prop drilling
const FilterContext = createContext(null)

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
const CANVAS_DPR_DESKTOP = [1, 1.5] // Capped for performance
const CANVAS_DPR_TABLET = [1, 1] // Fixed 1x for tablets

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
    const filterArtist = useContext(FilterContext)
    const isDeceased = isDeceasedArtist(project.artist)
    const GOLD = '#FFD700'
    const borderColor = isDeceased ? GOLD : color

    // Extract video ID for thumbnail URL
    const videoId = useMemo(() => extractVideoId(url), [url])

    // YouTube thumbnail URL (hqdefault is always available)
    const thumbnailUrl = getThumbnailUrl(videoId)

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

            {/* Dark overlay when not active or filtered out */}
            <mesh position={[0, 0, 0.02]}>
                <planeGeometry args={[5.4, 3.0]} />
                <meshBasicMaterial
                    color="#000"
                    transparent
                    opacity={filterArtist && project.artist !== filterArtist ? 0.85 : (isActive ? 0 : 0.5)}
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
                <meshBasicMaterial color={borderColor} />
            </mesh>
            <mesh position={[0, -1.55, 0.02]}>
                <boxGeometry args={[5.6, 0.1, 0.02]} />
                <meshBasicMaterial color={borderColor} />
            </mesh>
            <mesh position={[-2.75, 0, 0.02]}>
                <boxGeometry args={[0.1, 3.1, 0.02]} />
                <meshBasicMaterial color={borderColor} />
            </mesh>
            <mesh position={[2.75, 0, 0.02]}>
                <boxGeometry args={[0.1, 3.1, 0.02]} />
                <meshBasicMaterial color={borderColor} />
            </mesh>

            {/* Golden angel halo for deceased artists */}
            {isDeceased && (
                <>
                    <mesh position={[0, 3.2, 0]} rotation={[Math.PI * 0.15, 0, 0]}>
                        <torusGeometry args={[1.8, 0.08, 16, 48]} />
                        <meshBasicMaterial color={GOLD} toneMapped={false} />
                    </mesh>
                    <mesh position={[0, 3.2, 0]} rotation={[Math.PI * 0.15, 0, 0]}>
                        <torusGeometry args={[1.8, 0.2, 16, 48]} />
                        <meshBasicMaterial color={GOLD} transparent opacity={0.15} toneMapped={false} />
                    </mesh>
                    <pointLight position={[0, 2.5, 1.5]} color={GOLD} intensity={0.8} distance={8} />
                </>
            )}

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
    const filterArtist = useContext(FilterContext)

    useFrame(() => {
        // Throttle to check every 2nd frame for performance
        frameCountRef.current++
        if (frameCountRef.current % 2 !== 0) return

        // Calculate current camera Z position
        const cameraZ = -scroll.offset * TOTAL_DISTANCE

        // Get billboards in current lane only, respecting artist filter
        let laneBillboards = currentLane === 'popular'
            ? LANES.popular
            : LANES.chronological
        if (filterArtist) {
            laneBillboards = laneBillboards.filter(p => p.artist === filterArtist)
        }

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
    // Road length scales to cover the full journey + padding
    const roadLength = TOTAL_DISTANCE + 200
    const roadCenter = -roadLength / 2

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
        const gridWidth = 60
        const gridDepth = roadLength
        const divisionsX = 40
        const divisionsZ = Math.floor(roadLength / 13)
        const stepX = gridWidth / divisionsX
        const stepZ = gridDepth / divisionsZ

        // Horizontal lines (across road)
        for (let i = 0; i <= divisionsZ; i++) {
            const z = -gridDepth / 2 + i * stepZ
            positions.push(-gridWidth / 2, 0.01, z)
            positions.push(gridWidth / 2, 0.01, z)
        }
        // Vertical lines (along road)
        for (let i = 0; i <= divisionsX; i++) {
            const x = -gridWidth / 2 + i * stepX
            positions.push(x, 0.01, -gridDepth / 2)
            positions.push(x, 0.01, gridDepth / 2)
        }
        return new Float32Array(positions)
    }, [roadLength])

    // Dashed lane divider markers — full road length
    const laneMarkers = useMemo(() => {
        const markers = []
        for (let z = 0; z > -roadLength; z -= 60) {
            markers.push(z)
        }
        return markers
    }, [roadLength])

    return (
        <group>
            {/* Ground plane — scales to full journey */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, roadCenter]} receiveShadow>
                <planeGeometry args={[200, roadLength]} />
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

            {/* Center divider */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, roadCenter]}>
                <planeGeometry args={[0.3, roadLength]} />
                <meshStandardMaterial
                    color="#05d9e8"
                    emissive="#05d9e8"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Dashed lane markers — Popular (left) */}
            {laneMarkers.map((z, i) => (
                <mesh key={`left-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[LANE_CONFIG.POPULAR.x, 0.025, z]}>
                    <planeGeometry args={[0.12, 3]} />
                    <meshStandardMaterial
                        color="#9933ff"
                        emissive="#9933ff"
                        emissiveIntensity={0.6}
                        transparent
                        opacity={0.35}
                    />
                </mesh>
            ))}

            {/* Dashed lane markers — Chronological (right) */}
            {laneMarkers.map((z, i) => (
                <mesh key={`right-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[LANE_CONFIG.CHRONOLOGICAL.x, 0.025, z]}>
                    <planeGeometry args={[0.12, 3]} />
                    <meshStandardMaterial
                        color="#ffaa44"
                        emissive="#ffaa44"
                        emissiveIntensity={0.6}
                        transparent
                        opacity={0.35}
                    />
                </mesh>
            ))}

            {/* Outer edge lines */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.02, roadCenter]}>
                <planeGeometry args={[0.5, roadLength]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={2.5}
                    toneMapped={false}
                />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[15, 0.02, roadCenter]}>
                <planeGeometry args={[0.5, roadLength]} />
                <meshStandardMaterial
                    color="#ff2a6d"
                    emissive="#ff2a6d"
                    emissiveIntensity={2.5}
                    toneMapped={false}
                />
            </mesh>

            {/* Lane labels on ground */}
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
    const count = 40 // Reduced for performance

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
// ============================================
// CN TOWER - Tron Energy Spire with orbiting rings
// ============================================
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

// ============================================
// TRON BUILDING - Procedural neon-edged structure
// ============================================
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

// ============================================
// HIGHWAY ARCH - Tron-style arch over the road
// ============================================
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

// ============================================
// DATA STREAM - Animated vertical light pillar
// ============================================
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

// ============================================
// CITYSCAPE - Tron-style metropolis
// ============================================
const Cityscape = ({ cnTowerZ = -280 }) => {
    const cityData = useMemo(() => {
        const seed = (n) => {
            // Simple seeded pseudo-random for deterministic generation
            let x = Math.sin(n * 127.1) * 43758.5453
            return x - Math.floor(x)
        }

        const buildings = []
        const arches = []
        const streams = []
        const baseZ = -30
        const spread = TOTAL_DISTANCE + 100
        const colors = ['#05d9e8', '#ff2a6d', '#7700ff', '#d300c5', '#00ff88']

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
                color: colors[Math.floor(s3 * colors.length)],
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
                color: colors[Math.floor(s3 * colors.length)],
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
                color: colors[Math.floor(s3 * colors.length)],
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
                color: colors[Math.floor(s3 * colors.length)],
                type: height > 35 ? 'tower' : 'mid'
            })
        }

        // Highway arches scale with distance
        const archCount = Math.max(8, Math.floor(TOTAL_DISTANCE / 80))
        for (let i = 0; i < archCount; i++) {
            const z = -60 - i * (TOTAL_DISTANCE / archCount)
            arches.push({
                zPos: z,
                color: i % 2 === 0 ? '#05d9e8' : '#ff2a6d'
            })
        }

        // Data stream pillars scale with distance
        const streamCount = Math.max(12, Math.floor(TOTAL_DISTANCE / 100))
        for (let i = 0; i < streamCount; i++) {
            const s = seed(i * 17.3 + 500)
            const s2 = seed(i * 19.7 + 500)
            const side = i % 2 === 0 ? -1 : 1
            streams.push({
                position: [side * (20 + s * 15), 0, -50 - i * (TOTAL_DISTANCE / streamCount)],
                height: 25 + s2 * 30,
                color: colors[Math.floor(s * colors.length)]
            })
        }

        return { buildings, arches, streams }
    }, [])

    return (
        <group>
            <CNTower position={[0, 0, cnTowerZ]} />

            {/* Tron Buildings - 64 total across 4 rows */}
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

            {/* Highway arches */}
            {cityData.arches.map((arch, i) => (
                <HighwayArch key={`arch-${i}`} zPos={arch.zPos} color={arch.color} />
            ))}

            {/* Data stream light pillars */}
            {cityData.streams.map((stream, i) => (
                <DataStream key={`stream-${i}`} position={stream.position} height={stream.height} color={stream.color} />
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
            {/* Atmospheric fog - extends with road */}
            <fog attach="fog" args={['#0d0221', 40, 350]} />

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

            {/* Cosmic background elements - Phase 2 enhanced versions */}
            {!reducedEffects && <EnhancedStarField count={800} radius={400} depth={600} />}
            {reducedEffects && <StarField />}

            {/* Ambient neon particles - reduced count */}
            <SoftParticles
                count={reducedEffects ? 30 : 50}
                spread={60}
                height={18}
                baseY={1}
                scrollOffset={scroll.offset}
            />

            {/* CN Tower at the START - welcome to Toronto */}
            <CNTower position={[0, 0, -100]} />

            {/* Sun at the END of the journey, behind CN Tower */}
            <SynthwaveSun zPosition={-TOTAL_DISTANCE - 30} />

            {/* Toronto cityscape - CN Tower at END of scroll */}
            <Cityscape cnTowerZ={-TOTAL_DISTANCE - 20} />

            {/* Road stays in place */}
            <SynthwaveRoad />

            {/* Use built-in fog instead of shader-based for performance */}

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
            <EffectComposer disableNormalPass multisampling={0}>
                <Bloom
                    luminanceThreshold={0.3}
                    luminanceSmoothing={0.9}
                    intensity={reducedEffects ? 0.6 : 0.9}
                    mipmapBlur
                    radius={0.4}
                />
                <Vignette
                    offset={0.3}
                    darkness={0.6}
                    blendFunction={BlendFunction.NORMAL}
                />
            </EffectComposer>
        </>
    )
}

// ============================================
// VIDEO OVERLAY (Fixed HTML - Never floats!)
// ============================================
const VideoOverlay = ({ activeProject, audioEnabled, onOpenTheater, onArtistClick }) => {
    const [isVisible, setIsVisible] = useState(false)
    const { copied, handleCopyLink } = useCopyLink(activeProject)

    useEffect(() => {
        setIsVisible(!!activeProject)
    }, [activeProject])

    if (!activeProject) return null

    const videoId = extractVideoId(activeProject.url)
    const validId = isValidYouTubeId(videoId)
    const stats = ARTIST_STATS[activeProject.artist]

    return (
        <div className={`video-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="video-frame" style={{ borderColor: activeProject.color }}>
                <div className="video-title" style={{ color: activeProject.color }}>
                    {activeProject.title}
                    <span style={{ display: 'flex', gap: '4px' }}>
                        {/* Copy Link button */}
                        <button
                            className="theater-mode-btn"
                            onClick={handleCopyLink}
                            title="Copy Link"
                            style={{ borderColor: activeProject.color }}
                        >
                            {copied ? '✓' : '🔗'}
                        </button>
                        {/* Fullscreen/Theater Mode button */}
                        <button
                            className="theater-mode-btn"
                            onClick={onOpenTheater}
                            title="Theater Mode (F)"
                            style={{ borderColor: activeProject.color }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                        </button>
                    </span>
                </div>
                <div className="video-container">
                    {validId && (
                        <iframe
                            key={videoId}
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${audioEnabled ? 0 : 1}&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`}
                            style={{ border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={activeProject.title}
                        />
                    )}
                    {/* CRT Scanline Overlay */}
                    <div className="crt-overlay" />
                </div>
                <div className="video-description">{activeProject.description}</div>
                {/* Artist spotlight stats */}
                {stats && (
                    <div className="artist-spotlight">
                        <button
                            className="spotlight-artist spotlight-artist--clickable"
                            onClick={() => onArtistClick(activeProject.artist)}
                        >
                            {activeProject.artist}
                        </button>
                        <span className="spotlight-stat">{stats.count} video{stats.count > 1 ? 's' : ''}</span>
                        <span className="spotlight-stat">{(stats.totalViews / 1000).toFixed(0)}K views</span>
                        <span className="spotlight-stat">{stats.earliest.slice(0, 4)}–{stats.latest.slice(0, 4)}</span>
                    </div>
                )}
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
const UIOverlay = ({ audioEnabled, onToggleAudio, currentLane, onLaneChange, currentVehicle, onVehicleChange, onOpenStats }) => {
    return (
        <>
            <div className="title-container">
                <img src="/logo.png" alt="TDots Solutionsz" className="site-logo" />
                <p className="subtitle">[ Music Video Portfolio ]</p>
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

            <button
                type="button"
                className="stats-toggle-btn"
                onClick={onOpenStats}
                aria-label="View portfolio stats"
            >
                STATS
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
            <div className="loading-text">♬ LOADING PORTFOLIO ♬</div>
            <div className="loading-bar">
                <div className="loading-progress"></div>
            </div>
        </div>
    )
}

// ============================================
// SEARCH BAR
// ============================================
const SearchBar = ({ filterArtist, onFilterChange, onVideoSelect }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')

    const { artists: filteredArtists, videos: matchedVideos } = useMemo(() => {
        if (!query || query.length < 2) return { artists: ALL_ARTISTS, videos: [] }
        const { artists, videos } = searchAll(query)
        return { artists: artists.length > 0 ? artists : ALL_ARTISTS.filter(a => a.toLowerCase().includes(query.toLowerCase())), videos }
    }, [query])

    const handleSelect = (artist) => {
        onFilterChange(artist)
        setOpen(false)
        setQuery('')
    }

    const handleVideoSelect = (video) => {
        onVideoSelect?.(video)
        setOpen(false)
        setQuery('')
    }

    const handleClear = () => {
        onFilterChange(null)
        setQuery('')
        setOpen(false)
    }

    return (
        <div className="search-bar-container">
            {filterArtist ? (
                <button className="search-active-filter" onClick={handleClear}>
                    {filterArtist} ✕
                </button>
            ) : (
                <button className="search-trigger" onClick={() => setOpen(!open)}>
                    🔍 SEARCH
                </button>
            )}
            {open && (
                <div className="search-dropdown">
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search artists & videos..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="search-results">
                        {matchedVideos.length > 0 && (
                            <>
                                <div className="search-section-label">VIDEOS</div>
                                {matchedVideos.map(video => (
                                    <button
                                        key={`v-${video.id}`}
                                        className="search-result-item search-result-video"
                                        onClick={() => handleVideoSelect(video)}
                                    >
                                        <span className="search-video-title">{video.title}</span>
                                        <span className="search-result-count">{video.artist}</span>
                                    </button>
                                ))}
                                <div className="search-section-label">ARTISTS</div>
                            </>
                        )}
                        {filteredArtists.map(artist => (
                            <button
                                key={artist}
                                className="search-result-item"
                                onClick={() => handleSelect(artist)}
                            >
                                {artist}
                                <span className="search-result-count">
                                    {ARTIST_STATS[artist]?.count || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================
// PORTFOLIO STATS OVERLAY
// ============================================
const PortfolioStats = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    const yearRange = `${PORTFOLIO_STATS.earliestDate.slice(0, 4)}–${PORTFOLIO_STATS.latestDate.slice(0, 4)}`

    return (
        <div className="portfolio-stats-overlay" onClick={onClose}>
            <div className="portfolio-stats-panel" onClick={e => e.stopPropagation()}>
                <button className="portfolio-stats-close" onClick={onClose} aria-label="Close stats">✕</button>
                <h2 className="portfolio-stats-title">PORTFOLIO STATS</h2>
                <div className="portfolio-stats-grid">
                    <div className="stat-card">
                        <span className="stat-value">{PORTFOLIO_STATS.totalVideos}</span>
                        <span className="stat-label">Music Videos</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{PORTFOLIO_STATS.totalArtists}</span>
                        <span className="stat-label">Artists</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{formatViews(PORTFOLIO_STATS.totalViews)}</span>
                        <span className="stat-label">Total Views</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{yearRange}</span>
                        <span className="stat-label">Year Range</span>
                    </div>
                </div>
                {PORTFOLIO_STATS.topArtist && (
                    <div className="portfolio-stats-top-artist">
                        <span className="top-artist-label">Top Artist by Views</span>
                        <span className="top-artist-name">{PORTFOLIO_STATS.topArtist.name}</span>
                        <span className="top-artist-meta">
                            {PORTFOLIO_STATS.topArtist.count} video{PORTFOLIO_STATS.topArtist.count > 1 ? 's' : ''}
                            {' · '}{formatViews(PORTFOLIO_STATS.topArtist.totalViews)} views
                        </span>
                    </div>
                )}
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
    const [theaterMode, setTheaterMode] = useState(false)
    const [filterArtist, setFilterArtist] = useState(null)
    const [statsOpen, setStatsOpen] = useState(false)
    const [artistPanel, setArtistPanel] = useState(null)

    const handleToggleAudio = useCallback(() => {
        setAudioEnabled((prev) => !prev)
    }, [])

    const handleLaneChange = useCallback((lane) => {
        setCurrentLane(lane)
    }, [])

    const handleActiveChange = useCallback((project) => {
        if (theaterMode) return // Don't let proximity tracker override theater mode selection
        setActiveProject(project)
    }, [theaterMode])

    const handleVehicleChange = useCallback((type) => {
        setVehicleType(type)
    }, [])

    const handleArtistClick = useCallback((artist) => {
        setArtistPanel(artist)
    }, [])

    const handleArtistPanelSelect = useCallback((video) => {
        setActiveProject(video)
    }, [])

    const handleOpenTheater = useCallback(() => {
        if (activeProject) {
            setTheaterMode(true)
        }
    }, [activeProject])

    const handleCloseTheater = useCallback(() => {
        setTheaterMode(false)
    }, [])

    // Theater mode: navigate to next/prev video in current lane
    const currentLaneVideos = useMemo(() => {
        return currentLane === 'popular' ? LANES.popular : LANES.chronological
    }, [currentLane])

    const { handleNext: handleTheaterNext, handlePrev: handleTheaterPrev, currentIndex: activeIndex } =
        useVideoNavigation(activeProject, currentLaneVideos, setActiveProject)

    // Keyboard shortcut: F to toggle theater mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'f' || e.key === 'F') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
                if (theaterMode) setTheaterMode(false)
                else if (activeProject) setTheaterMode(true)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [theaterMode, activeProject])

    // Deep link: read ?v= on mount + sync URL with theater state
    useVideoDeepLink(activeProject, (found) => {
        const enriched = { ...found, url: `https://www.youtube.com/watch?v=${found.youtubeId}`, color: NEON_COLORS[0] }
        setActiveProject(enriched)
        setTheaterMode(true)
    }, theaterMode && !!activeProject)

    return (
        <>
            <div className="canvas-container">
                <Canvas
                    gl={CANVAS_GL_OPTIONS}
                    dpr={reducedEffects ? CANVAS_DPR_TABLET : CANVAS_DPR_DESKTOP}
                >
                    <FilterContext.Provider value={filterArtist}>
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
                    </FilterContext.Provider>
                </Canvas>
            </div>
            {/* Video overlay - Fixed HTML, never floats! */}
            <VideoOverlay
                activeProject={activeProject}
                audioEnabled={audioEnabled}
                onOpenTheater={handleOpenTheater}
                onArtistClick={handleArtistClick}
            />
            {/* Theater mode - fullscreen video experience */}
            <TheaterMode
                project={activeProject}
                audioEnabled={audioEnabled}
                isOpen={theaterMode}
                onClose={handleCloseTheater}
                onNext={handleTheaterNext}
                onPrev={handleTheaterPrev}
                hasNext={currentLaneVideos.length > 1}
                hasPrev={currentLaneVideos.length > 1}
                queuePosition={activeIndex >= 0 ? activeIndex + 1 : null}
                queueTotal={currentLaneVideos.length}
                nextVideoTitle={activeIndex >= 0 && currentLaneVideos.length > 1 ? currentLaneVideos[(activeIndex + 1) % currentLaneVideos.length]?.title : null}
            />
            <ArtistPanel
                artist={artistPanel}
                activeVideoId={activeProject?.youtubeId}
                onSelectVideo={handleArtistPanelSelect}
                onClose={() => setArtistPanel(null)}
            />
            <SearchBar filterArtist={filterArtist} onFilterChange={setFilterArtist} onVideoSelect={setActiveProject} />
            <UIOverlay
                audioEnabled={audioEnabled}
                onToggleAudio={handleToggleAudio}
                currentLane={currentLane}
                onLaneChange={handleLaneChange}
                currentVehicle={vehicleType}
                onVehicleChange={handleVehicleChange}
                onOpenStats={() => setStatsOpen(true)}
            />
            <PortfolioStats isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
            <Suspense fallback={<LoadingScreen />}>
                <div style={{ display: 'none' }}>Loaded</div>
            </Suspense>
        </>
    )
}
