/**
 * VideoTunnelApp — /videos route Stage 2 (clean white-space card field).
 *
 * 100+ video cards line the inside of a rectangular prism. The camera flies
 * forward in -Z as the user scrolls; cards on the four walls (top/bottom/left/right)
 * scroll past the camera. Click a card → existing TheaterMode opens.
 *
 * Aesthetic: white infinite space, monochrome card frames, thumbnails carry
 * all the color. No synthwave palette, no nostalgia landmarks. Clean, professional,
 * gallery-grade. Linear fog fades cards into white horizon.
 *
 * Mobile: 2 walls (left + right) instead of 4 — same DNA, lower density.
 *
 * Pattern source: ~/.claude/skills/webgl-card-field/SKILL.md (Architecture 1: Tunnel)
 */
import { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ScrollControls, useScroll, Text } from '@react-three/drei'
import * as THREE from 'three'

import { VIDEOS } from '../utils/videoData'
import { extractVideoId, getThumbnailUrl } from '../utils/youtube'
import { TheaterMode, VideoOverlay } from './ui'
import useClosingGuard from '../hooks/useClosingGuard'
import useVideoDeepLink from '../hooks/useVideoDeepLink'
import { useDeviceType } from '../hooks/useDeviceType'
import IntroLetters from './IntroLetters'

// ── Tunnel geometry ──────────────────────────────────────────────────
const CARD_W = 3.6
const CARD_H = 5.4   // 9:16 portrait (matches video preview aspect)
// Spacing must exceed CARD_W * MAX_SCALE for clean separation along Z so cards
// don't punch through each other.  6.0 leaves a comfortable gap even at the
// largest scale the jitter assigns.
const CARD_SPACING_Z = 6.0
// 4 walls × 60 = 240 slots. With 114 unique videos that's ~2.1× catalog —
// scroll feels long without endless slop.
const CARDS_PER_WALL_DESKTOP = 60
const CARDS_PER_WALL_MOBILE  = 110  // 2 × 110 = 220 slots, ~1.9× catalog
const TUNNEL_HALF_W_DESKTOP  = 6.5
const TUNNEL_HALF_H_DESKTOP  = 5
const TUNNEL_HALF_W_MOBILE   = 4
const TUNNEL_LENGTH = CARDS_PER_WALL_DESKTOP * CARD_SPACING_Z + 80

// Wall config: `pos` is the wall's offset in world space.
// `inward` is the unit vector from wall toward tunnel center (used for standoff).
// `tangent` is the unit vector along the wall surface (perpendicular to forward
// and to inward) — used for lateral jitter so cards drift along the wall, not through it.
// `faceRot` rotates each card so its face normal points inward toward the camera.
const WALLS_DESKTOP = [
    { name: 'right',  pos: [+TUNNEL_HALF_W_DESKTOP, 0, 0], inward: [-1, 0, 0], tangent: [0, 1, 0], faceRot: [0, -Math.PI / 2, 0] },
    { name: 'left',   pos: [-TUNNEL_HALF_W_DESKTOP, 0, 0], inward: [+1, 0, 0], tangent: [0, 1, 0], faceRot: [0, +Math.PI / 2, 0] },
    { name: 'top',    pos: [0, +TUNNEL_HALF_H_DESKTOP, 0], inward: [0, -1, 0], tangent: [1, 0, 0], faceRot: [+Math.PI / 2, 0, 0] },
    { name: 'bottom', pos: [0, -TUNNEL_HALF_H_DESKTOP, 0], inward: [0, +1, 0], tangent: [1, 0, 0], faceRot: [-Math.PI / 2, 0, 0] },
]
const WALLS_MOBILE = [
    { name: 'right', pos: [+TUNNEL_HALF_W_MOBILE, 0, 0], inward: [-1, 0, 0], tangent: [0, 1, 0], faceRot: [0, -Math.PI / 2, 0] },
    { name: 'left',  pos: [-TUNNEL_HALF_W_MOBILE, 0, 0], inward: [+1, 0, 0], tangent: [0, 1, 0], faceRot: [0, +Math.PI / 2, 0] },
]

// Scroll runway — sized to the slot count.  240 slots ÷ 12 pages = 20 cards per
// viewport revealed.  Long enough to feel substantial, short enough to feel finite.
const SCROLL_PAGES = 12
// Camera Z lerp factor (matches App.jsx CameraRig for consistent feel)
const CAMERA_LERP = 0.15

// Aesthetic constants — clean white space
const BG_COLOR = '#f5f5f3'    // warm off-white, easier on the eyes than pure #fff
const FOG_NEAR = 22
const FOG_FAR = TUNNEL_LENGTH * 0.85
const FRAME_COLOR = '#1a1a1a' // near-black thin frame around each card

// ── VideoCard ────────────────────────────────────────────────────────

function VideoCard({ video, isActive, onClick }) {
    const videoId = useMemo(() => extractVideoId(video.url), [video.url])
    const thumbnailUrl = getThumbnailUrl(videoId)

    // Lazy texture load — non-mipmapped to save GPU memory at scale (100+ cards)
    const texture = useMemo(() => {
        const loader = new THREE.TextureLoader()
        const tex = loader.load(thumbnailUrl)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.generateMipmaps = false
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        return tex
    }, [thumbnailUrl])

    const handleClick = useCallback((e) => {
        e.stopPropagation()
        onClick(video)
    }, [onClick, video])

    // Active = darker frame to register hover/selection without color
    const frameColor = isActive ? '#000000' : FRAME_COLOR
    const frameOpacity = isActive ? 1.0 : 0.85

    return (
        <group onClick={handleClick}>
            {/* Outer frame — thin dark border, gallery-style matte */}
            <mesh position={[0, 0, -0.04]}>
                <planeGeometry args={[CARD_W + 0.18, CARD_H + 0.18]} />
                <meshBasicMaterial color={frameColor} transparent opacity={frameOpacity} />
            </mesh>
            {/* Thumbnail */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[CARD_W, CARD_H]} />
                <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            {/* Title — black serif text below card, matches editorial palette */}
            <Text
                position={[0, -CARD_H / 2 - 0.55, 0.02]}
                fontSize={0.28}
                color="#0a0a0a"
                anchorX="center"
                anchorY="middle"
                maxWidth={CARD_W + 0.4}
                letterSpacing={-0.01}
            >
                {video.title}
            </Text>
        </group>
    )
}

// ── TunnelWall ───────────────────────────────────────────────────────

/**
 * Deterministic pseudo-random based on (video id, salt) — same input always
 * yields same output, so card jitter is stable across re-renders.
 * Returns a value in [-1, 1].
 */
function jitter(seed, salt) {
    const n = Math.sin((seed + 1) * 12.9898 + salt * 78.233) * 43758.5453
    return (n - Math.floor(n)) * 2 - 1
}

function TunnelWall({ wall, slots, onCardClick, activeId }) {
    return (
        <group position={wall.pos}>
            {slots.map((slot, i) => {
                const { video, slotSeed } = slot
                const seed = slotSeed
                // Lateral drift along the wall surface — moderate so cards stay on
                // their wall but feel placed, not gridded.
                const lateralAmt = jitter(seed, 1) * 1.4
                const lat = wall.tangent
                // Standoff: small variation only — keep cards on their wall so
                // they don't poke into the adjacent wall's space.
                const standoffAmt = (jitter(seed, 2) * 0.5 + 0.5) * 0.9  // 0..0.9
                const inw = wall.inward
                // Z jitter — small relative to spacing so neighbours stay separated.
                const zJitter = jitter(seed, 3) * 1.2
                // Per-card rotation — gentle tilt for character.
                const tiltZ = jitter(seed, 4) * 0.09    // ±~5.2°
                const tiltY = jitter(seed, 5) * 0.07    // ±~4.0° (yaw)
                const tiltX = jitter(seed, 6) * 0.04    // ±~2.3° (pitch)
                // Scale variation — Delphi-style hierarchy without overlap. Range
                // 0.75x..1.25x: max card width = 3.6 × 1.25 = 4.5 < CARD_SPACING_Z = 6.0,
                // so adjacent cards never punch through each other.
                const scaleRand = jitter(seed, 7) * 0.5 + 0.5  // 0..1
                const cardScale = 0.75 + scaleRand * 0.50      // 0.75..1.25

                const px = lat[0] * lateralAmt + inw[0] * standoffAmt
                const py = lat[1] * lateralAmt + inw[1] * standoffAmt
                const pz = -i * CARD_SPACING_Z - 8 + zJitter

                return (
                    <group
                        key={`${wall.name}-${i}`}
                        position={[px, py, pz]}
                        rotation={[
                            wall.faceRot[0] + tiltX,
                            wall.faceRot[1] + tiltY,
                            wall.faceRot[2] + tiltZ,
                        ]}
                        scale={cardScale}
                    >
                        <VideoCard
                            video={video}
                            isActive={activeId === video.youtubeId}
                            onClick={onCardClick}
                        />
                    </group>
                )
            })}
        </group>
    )
}

// ── CameraRig ────────────────────────────────────────────────────────

function CameraRig({ progressRef }) {
    const scroll = useScroll()

    useFrame(({ camera }) => {
        const offset = scroll.offset
        if (progressRef) progressRef.current = offset
        const targetZ = -offset * TUNNEL_LENGTH
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, CAMERA_LERP)
        camera.lookAt(0, 0, camera.position.z - 10)
    })

    return null
}

// ── TunnelScene ──────────────────────────────────────────────────────

function TunnelScene({ videos, walls, slotsPerWall, onCardClick, activeId, progressRef }) {
    // Slot mapping: front-rung-first.  At depth slot `i`, every wall picks the
    // next `walls.length` videos in sorted order, so the closest 4 cards (one
    // per wall, smallest i) are always the top 4 most-popular-and-recent
    // videos.  After the catalog runs out, it wraps so deep slots show the
    // same content again — but at smaller scale, fading into white fog.
    const slotsByWall = useMemo(() => {
        return walls.map((_, wallIdx) => {
            const slots = []
            for (let i = 0; i < slotsPerWall; i++) {
                const rungIdx = i * walls.length + wallIdx
                const video = videos[rungIdx % videos.length]
                slots.push({
                    video,
                    slotSeed: (wallIdx * slotsPerWall + i) * 7919 + 13,  // unique per slot
                })
            }
            return slots
        })
    }, [videos, walls, slotsPerWall])

    return (
        <>
            <color attach="background" args={[BG_COLOR]} />
            <fog attach="fog" args={[BG_COLOR, FOG_NEAR, FOG_FAR]} />

            <CameraRig progressRef={progressRef} />

            <ambientLight intensity={1} />

            {walls.map((wall, i) => (
                <TunnelWall
                    key={wall.name}
                    wall={wall}
                    slots={slotsByWall[i] || []}
                    onCardClick={onCardClick}
                    activeId={activeId}
                />
            ))}
        </>
    )
}

// ── VideoTunnelApp (default export) ─────────────────────────────────

export default function VideoTunnelApp() {
    const deviceType = useDeviceType()
    const isMobile = deviceType === 'phone'
    const walls = isMobile ? WALLS_MOBILE : WALLS_DESKTOP
    const slotsPerWall = isMobile ? CARDS_PER_WALL_MOBILE : CARDS_PER_WALL_DESKTOP

    const [activeProject, setActiveProject] = useState(null)
    const theaterGuard = useClosingGuard(300)
    const theaterMode = theaterGuard.isOpen
    const progressRef = useRef(0)

    // Body class for /videos route (matches existing VideosRoute behavior)
    useEffect(() => {
        document.body.classList.add(isMobile ? 'mobile-mode' : 'desktop-mode')
        document.body.classList.add('tunnel-mode')
        return () => {
            document.body.classList.remove('mobile-mode', 'desktop-mode', 'tunnel-mode')
        }
    }, [isMobile])

    // Enrich + sort videos so the strongest content (most-viewed AND most-recent)
    // is placed in the front of the tunnel. Combined rank = avg(viewRank, dateRank),
    // lower rank = closer to camera. This is robust to different scales — 200K-view
    // outliers don't dominate, and an old popular video still beats a new flop.
    const enrichedVideos = useMemo(() => {
        const byViews = [...VIDEOS]
            .map((v, i) => ({ id: v.youtubeId, rank: i }))
            .sort((a, b) => {
                const va = VIDEOS.find(x => x.youtubeId === a.id).viewCount
                const vb = VIDEOS.find(x => x.youtubeId === b.id).viewCount
                return vb - va
            })
        const byDate = [...VIDEOS].sort((a, b) =>
            new Date(b.uploadDate) - new Date(a.uploadDate)
        )

        const viewRank = new Map()
        byViews.forEach((entry, idx) => viewRank.set(entry.id, idx))
        const dateRank = new Map()
        byDate.forEach((v, idx) => dateRank.set(v.youtubeId, idx))

        return [...VIDEOS]
            .map(v => ({
                ...v,
                color: '#1a1a1a',
                _frontScore: (viewRank.get(v.youtubeId) + dateRank.get(v.youtubeId)) / 2,
            }))
            .sort((a, b) => a._frontScore - b._frontScore)
    }, [])

    const handleCardClick = useCallback((video) => {
        setActiveProject(video)
        theaterGuard.open()
    }, [theaterGuard])

    const handleCloseTheater = useCallback(() => {
        theaterGuard.close()
    }, [theaterGuard])

    const activeIndex = useMemo(() => {
        if (!activeProject) return -1
        return enrichedVideos.findIndex(v => v.youtubeId === activeProject.youtubeId)
    }, [activeProject, enrichedVideos])

    const handleTheaterNext = useCallback(() => {
        if (activeIndex < 0) return
        setActiveProject(enrichedVideos[(activeIndex + 1) % enrichedVideos.length])
    }, [activeIndex, enrichedVideos])

    const handleTheaterPrev = useCallback(() => {
        if (activeIndex < 0) return
        setActiveProject(enrichedVideos[(activeIndex - 1 + enrichedVideos.length) % enrichedVideos.length])
    }, [activeIndex, enrichedVideos])

    const handleOpenTheater = useCallback(() => {
        if (activeProject) theaterGuard.open()
    }, [activeProject, theaterGuard])

    // Deep-link: ?v=<youtubeId> → open theater (matches App.jsx pattern)
    useVideoDeepLink(activeProject, (found) => {
        const enriched = {
            ...found,
            url: `https://www.youtube.com/watch?v=${found.youtubeId}`,
            color: '#1a1a1a',
        }
        setActiveProject(enriched)
        theaterGuard.open()
    }, theaterMode && !!activeProject)

    return (
        <>
            <div className="canvas-container">
                <Canvas
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: 'high-performance',
                        stencil: false,
                    }}
                    dpr={isMobile ? [1, 1] : [1, 1.5]}
                    camera={{ fov: 75, position: [0, 0, 0], near: 0.1, far: TUNNEL_LENGTH * 1.5 }}
                    style={{ background: BG_COLOR }}
                >
                    <Suspense fallback={null}>
                        <ScrollControls pages={SCROLL_PAGES} damping={0.2}>
                            <TunnelScene
                                videos={enrichedVideos}
                                walls={walls}
                                slotsPerWall={slotsPerWall}
                                onCardClick={handleCardClick}
                                activeId={activeProject?.youtubeId}
                                progressRef={progressRef}
                            />
                        </ScrollControls>
                    </Suspense>
                </Canvas>
            </div>

            {/* Letter-assembly intro overlay (entrance + scatter on scroll) */}
            <IntroLetters progressRef={progressRef} />

            {/* Selected video — overlay metadata + theater entry */}
            <VideoOverlay
                activeProject={activeProject}
                audioEnabled={false}
                onOpenTheater={handleOpenTheater}
                onArtistClick={() => { /* no artist panel in tunnel v1 */ }}
            />

            {/* Full-viewport video player */}
            <TheaterMode
                project={activeProject}
                audioEnabled={false}
                isOpen={theaterMode}
                isClosing={theaterGuard.isClosing}
                onClose={handleCloseTheater}
                onNext={handleTheaterNext}
                onPrev={handleTheaterPrev}
                hasNext={enrichedVideos.length > 1}
                hasPrev={enrichedVideos.length > 1}
                queuePosition={activeIndex >= 0 ? activeIndex + 1 : null}
                queueTotal={enrichedVideos.length}
                nextVideoTitle={
                    activeIndex >= 0 && enrichedVideos.length > 1
                        ? enrichedVideos[(activeIndex + 1) % enrichedVideos.length]?.title
                        : null
                }
            />

            {/* Hidden DOM mirror for SEO + screen readers */}
            <ul
                aria-label="Music videos catalog"
                style={{
                    position: 'absolute',
                    left: '-9999px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                    clip: 'rect(0,0,0,0)',
                }}
            >
                {enrichedVideos.map(v => (
                    <li key={v.youtubeId}>
                        <a href={`/video/${v.youtubeId}`}>{v.title} — {v.artist}</a>
                    </li>
                ))}
            </ul>
        </>
    )
}
