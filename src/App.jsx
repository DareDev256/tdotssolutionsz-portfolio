/**
 * App.jsx — Desktop 3D "Infinite Drive" Experience
 *
 * The main desktop view: a scroll-driven Three.js scene where the user rides
 * down a synthwave highway, passing billboard-style video frames arranged in
 * two lanes (Popular / Chronological). Scrolling moves the camera forward along
 * the Z-axis; arrow keys switch lanes laterally.
 *
 * Architecture overview:
 * - ScrollControls (drei) → CameraRig → ProximityTracker + Scene
 * - ProximityTracker detects the nearest billboard every 2nd frame and fires
 *   onActiveChange, which surfaces the video to the HTML UI layer (VideoOverlay).
 * - FilterContext provides the current artist filter to all 3D children without
 *   prop-drilling through the R3F scene graph.
 * - Cityscape generates a procedural skyline using a seeded PRNG so building
 *   placement is deterministic across renders (no layout shift on hot-reload).
 *
 * @see /docs/ARCHITECTURE.md for full system design
 * @see /src/MobileApp.jsx for the mobile-responsive counterpart
 */
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
import { EnhancedStarField } from './components/atmosphere'
import { TheaterMode, ArtistPanel, KeyboardGuide, SearchBar, PortfolioStats, VideoOverlay } from './components/ui'
import { Vehicle } from './components/3d/vehicles'
import { StarField, SynthwaveSun } from './components/3d/effects'

// Shared data & utilities (single source of truth with MobileApp)
import { NEON_COLORS, LANE_CONFIG, processVideosIntoLanes, isDeceasedArtist } from './utils/videoData'
import { extractVideoId, getThumbnailUrl } from './utils/youtube'
import useVideoDeepLink from './hooks/useVideoDeepLink'
import useVideoNavigation from './hooks/useVideoNavigation'
import useShufflePlay from './hooks/useShufflePlay'
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts'

const LANES = processVideosIntoLanes()

/**
 * FilterContext — Shares the active artist filter with all 3D scene children.
 * Using Context (not props) because R3F scene graphs can be deeply nested and
 * passing filterArtist through every 3D component would be unwieldy.
 * @type {React.Context<string|null>}
 */
const FilterContext = createContext(null)

// --- Scene geometry constants ---
// Total scrollable distance = (longest lane × spacing between billboards) + 50 unit buffer
const TOTAL_DISTANCE = Math.max(LANES.chronological.length, LANES.popular.length) * LANE_CONFIG.BILLBOARD_Z_SPACING + 50
// ScrollControls "pages" ≈ how many viewport-heights the scroll range spans.
// Dividing by 100 gives ~1 page per 100 world units — tuned for comfortable scroll speed.
const SCROLL_PAGES = Math.ceil(TOTAL_DISTANCE / 100)
// How far (in world units) a billboard can be from the camera and still be considered "active".
// 30 is wide enough to cover both lanes when the camera is centered between them.
const ACTIVE_RANGE = 30

// --- Audio distance attenuation ---
// Volume fades quadratically from AUDIO_MAX_VOLUME (at distance 0) to 0 (at SILENCE_DISTANCE).
// Quadratic easing (t²) makes the fade feel natural — rapid dropoff near silence, gentle near source.
const AUDIO_SILENCE_DISTANCE = 35   // World units — beyond this, volume is 0
const AUDIO_MAX_VOLUME = 80         // YouTube volume (0-100). 80 avoids clipping on loud tracks
const AUDIO_UPDATE_INTERVAL = 0.1   // Seconds between volume updates (avoids hammering YT API)
const AUDIO_VOLUME_EPSILON = 1      // Minimum change to trigger a YT setVolume call

// --- Rendering quality ---
const CANVAS_GL_OPTIONS = {
    antialias: true,
    alpha: false,               // Opaque background — saves compositing cost
    powerPreference: 'high-performance',
    stencil: false              // No stencil buffer needed — saves GPU memory
}
const CANVAS_DPR_DESKTOP = [1, 1.5] // Cap at 1.5× to balance quality vs GPU load on HiDPI
const CANVAS_DPR_TABLET = [1, 1]    // Fixed 1× on tablets — postprocessing is heavy at 2×

// Lane switching lerp factor — lower = smoother but slower. 0.08 gives ~12 frames to settle.
const LANE_SWITCH_SPEED = 0.08

/**
 * Maps camera-to-billboard distance → YouTube volume (0–80).
 * Uses quadratic easing (t²) for a natural audio falloff curve.
 * @param {number} distance - World-space distance between camera and billboard
 * @returns {number} Integer volume 0–AUDIO_MAX_VOLUME
 */
const getVolumeFromDistance = (distance) => {
    if (!Number.isFinite(distance)) return 0
    const clamped = Math.min(distance, AUDIO_SILENCE_DISTANCE)
    const t = 1 - clamped / AUDIO_SILENCE_DISTANCE
    const eased = t * t
    return Math.round(eased * AUDIO_MAX_VOLUME)
}

/**
 * BillboardFrame — A 3D video billboard placed along the highway.
 * Renders a YouTube thumbnail as a textured plane with neon border,
 * title/description text, and optional golden halo for deceased artists.
 * Dimmed to 85% opacity when an artist filter is active and this billboard
 * doesn't match, creating a visual focus effect.
 *
 * @param {Object} props.project - Video data (title, description, position, color, url, artist)
 * @param {boolean} props.isActive - Whether this is the closest billboard to the camera
 */
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


/**
 * CameraRig — Scroll-driven camera movement with smooth lane switching.
 *
 * Z-axis (forward): driven by drei's ScrollControls offset, lerped at 0.15
 * for a snappy-but-smooth feel at 60fps.
 * X-axis (lateral): lerped toward the target lane position at LANE_SWITCH_SPEED.
 * Uses a ref (not state) for targetX because it updates every frame in useFrame
 * and triggering a React re-render each frame would kill performance.
 *
 * @param {React.ReactNode} props.children - Scene contents that move with the camera
 * @param {'popular'|'chronological'} props.currentLane - Active lane
 * @param {function} props.onLaneChange - Callback when user presses ←/→ arrow keys
 */
const CameraRig = ({ children, currentLane, onLaneChange }) => {
    const scroll = useScroll()
    const rigRef = useRef()
    // Start slightly toward chrono lane so user sees both lanes on load
    const targetXRef = useRef(LANE_CONFIG.CHRONOLOGICAL.x * 0.5)

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

/**
 * ProximityTracker — Finds the nearest billboard in the active lane each frame.
 *
 * Runs inside useFrame (the R3F render loop) but throttled to every 2nd frame
 * to halve the cost of iterating all billboards. At 60fps this still updates
 * proximity 30×/sec which is imperceptible to the user.
 *
 * Fires onActiveChange when a different billboard becomes closest, and
 * onActiveUpdate with the distance for volume attenuation.
 *
 * @param {function} props.onActiveChange - Called with (project, distance) when active billboard changes
 * @param {function} props.onActiveUpdate - Called with (distance) every check for volume updates
 * @param {'popular'|'chronological'} props.currentLane - Which lane to scan
 */
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
/**
 * Cityscape — Procedurally generated synthwave skyline flanking the highway.
 *
 * Uses a seeded PRNG (not Math.random) so the city layout is identical across
 * renders and hot-reloads — preventing jarring building position shifts.
 * Building count scales with TOTAL_DISTANCE so the skyline always fills the
 * full scrollable road length. Also places HighwayArch and DataStream elements
 * at regular intervals for visual rhythm.
 *
 * @param {number} [props.cnTowerZ=-280] - Z position for the CN Tower landmark
 */
const Cityscape = ({ cnTowerZ = -280 }) => {
    const cityData = useMemo(() => {
        // Deterministic PRNG — sin-hash trick (from GPU shader tradition).
        // The magic constants (127.1, 43758.5453) produce a well-distributed
        // pseudo-random sequence when fed sequential integers as seeds.
        // Using this instead of Math.random() ensures identical city layout
        // across renders without needing to save/restore random state.
        const seed = (n) => {
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
const UIOverlay = ({ audioEnabled, onToggleAudio, currentLane, onLaneChange, currentVehicle, onVehicleChange, onOpenStats, onShuffle }) => {
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

            <button
                type="button"
                className="shuffle-btn"
                onClick={onShuffle}
                aria-label="Shuffle — play a random video"
            >
                SHUFFLE
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
// MAIN APP
// ============================================
export default function App({ reducedEffects = false }) {
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [activeProject, setActiveProject] = useState(null)
    const [currentLane, setCurrentLane] = useState('chronological')
    const [vehicleType, setVehicleType] = useState('tron') // tron, delorean, cyberbike
    const [theaterMode, setTheaterMode] = useState(false)
    const theaterModeRef = useRef(theaterMode)
    useEffect(() => { theaterModeRef.current = theaterMode }, [theaterMode])
    const [filterArtist, setFilterArtist] = useState(null)
    const [statsOpen, setStatsOpen] = useState(false)
    const [kbdGuideOpen, setKbdGuideOpen] = useState(false)
    const [artistPanel, setArtistPanel] = useState(null)
    const { shufflePlay } = useShufflePlay()

    const handleShuffle = useCallback(() => {
        const pick = shufflePlay()
        if (pick) {
            const enriched = { ...pick, url: `https://www.youtube.com/watch?v=${pick.youtubeId}`, color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)] }
            setActiveProject(enriched)
            setTheaterMode(true)
        }
    }, [shufflePlay])

    const handleToggleAudio = useCallback(() => {
        setAudioEnabled((prev) => !prev)
    }, [])

    const handleLaneChange = useCallback((lane) => {
        setCurrentLane(lane)
    }, [])

    // Use ref for instant read — prevents stale closure in useFrame-based ProximityTracker
    const handleActiveChange = useCallback((project) => {
        if (theaterModeRef.current) return
        setActiveProject(project)
    }, [])

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

    // Keyboard shortcuts — consolidated into a single listener
    useKeyboardShortcuts({
        f: () => {
            if (theaterMode) setTheaterMode(false)
            else if (activeProject) setTheaterMode(true)
        },
        '?': () => setKbdGuideOpen(prev => !prev),
        s: () => handleShuffle(),
    }, [theaterMode, activeProject, handleShuffle])

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
                onShuffle={handleShuffle}
            />
            <PortfolioStats isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
            <KeyboardGuide isOpen={kbdGuideOpen} onClose={() => setKbdGuideOpen(false)} />
            <Suspense fallback={<LoadingScreen />}>
                <div style={{ display: 'none' }}>Loaded</div>
            </Suspense>
        </>
    )
}
