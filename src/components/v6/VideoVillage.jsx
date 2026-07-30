/**
 * VideoVillage.jsx — the premise layer.
 *
 * Every TdotsSolutionsz site is built on a named world rather than a layout:
 * KMONEY is The Vault, 100BandPlan is a classified Mission File, SAVV4X is
 * Problem Child, Syren Effect is a TV channel. Each one names the world, makes
 * you cross a threshold to enter it, and treats sound as a real control.
 *
 * The studio's world is the **video village** — the monitor the director
 * watches playback on. It is the only premise that carries both halves of the
 * business honestly: camera language on one side, live technical readout on the
 * other. That gives us:
 *
 *   Threshold  — you ROLL to enter; the reel is armed, not already running.
 *   Slate      — a running head with a real timecode, REC state, and camera ID.
 *   Frame      — corner framing brackets and safe-area guides over the viewport.
 *   Scope      — an audio meter that is genuinely driven by the playing clip.
 *   Sound      — a persistent SOUND ON control, because muted video is a
 *                browser constraint, not a design choice.
 *
 * Hue is sodium amber. Green, cyan, red and purple are each already claimed by
 * a client site; the studio gets its own.
 *
 * @module components/v6/VideoVillage
 */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'

/**
 * @typedef {Object} VillageApi
 * @property {boolean} entered   — has the viewer crossed the threshold
 * @property {boolean} sound     — is audio armed
 * @property {() => void} enter
 * @property {() => void} toggleSound
 * @property {(el: HTMLVideoElement|null) => void} claimScope — hand the scope a
 *           playing element to meter; pass null to release it
 */

const VillageContext = createContext(/** @type {VillageApi|null} */ (null))

/** @returns {VillageApi} */
export function useVillage() {
    const ctx = useContext(VillageContext)
    if (!ctx) throw new Error('useVillage must be used inside <VillageProvider>')
    return ctx
}

/** Frames per second the on-screen timecode counts in. Matches the clip encode. */
const TC_FPS = 24

/**
 * Format elapsed milliseconds as broadcast timecode HH:MM:SS:FF.
 * @param {number} ms
 */
function timecode(ms) {
    const totalFrames = Math.floor((ms / 1000) * TC_FPS)
    const f = totalFrames % TC_FPS
    const totalSeconds = Math.floor(totalFrames / TC_FPS)
    const s = totalSeconds % 60
    const m = Math.floor(totalSeconds / 60) % 60
    const h = Math.floor(totalSeconds / 3600) % 24
    const pad = (n, w = 2) => String(n).padStart(w, '0')
    return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`
}

/**
 * Provider — owns threshold state, the sound arm, and the single shared
 * WebAudio analyser the scope reads from.
 *
 * One AudioContext for the whole page, and each <video> is connected exactly
 * once: `createMediaElementSource` throws if called twice on the same element,
 * and connecting six of them independently would fight over the output.
 */
export function VillageProvider({ children }) {
    const [entered, setEntered] = useState(false)
    const [sound, setSound] = useState(false)

    const audioCtxRef = useRef(null)
    const analyserRef = useRef(null)
    const sourcesRef = useRef(new WeakMap())
    const [scopeEl, setScopeEl] = useState(null)

    const ensureGraph = useCallback(() => {
        if (audioCtxRef.current) return audioCtxRef.current
        const Ctor = window.AudioContext || window.webkitAudioContext
        if (!Ctor) return null
        const ctx = new Ctor()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.75
        analyser.connect(ctx.destination)
        audioCtxRef.current = ctx
        analyserRef.current = analyser
        return ctx
    }, [])

    /** Route a video element through the shared analyser, once. */
    const connect = useCallback(
        (el) => {
            if (!el) return
            const ctx = ensureGraph()
            if (!ctx || sourcesRef.current.has(el)) return
            try {
                const src = ctx.createMediaElementSource(el)
                src.connect(analyserRef.current)
                sourcesRef.current.set(el, src)
            } catch {
                // Element already routed, or the browser refused. The scope
                // falls back to its idle animation; playback is unaffected.
            }
        },
        [ensureGraph]
    )

    const claimScope = useCallback(
        (el) => {
            if (el) connect(el)
            setScopeEl(el)
        },
        [connect]
    )

    const enter = useCallback(() => setEntered(true), [])

    const toggleSound = useCallback(() => {
        setSound((on) => {
            const next = !on
            if (next) {
                const ctx = ensureGraph()
                // Autoplay policy parks the context until a user gesture.
                if (ctx?.state === 'suspended') ctx.resume().catch(() => {})
            }
            return next
        })
    }, [ensureGraph])

    const value = useMemo(
        () => ({ entered, sound, enter, toggleSound, claimScope, analyserRef, scopeEl }),
        [entered, sound, enter, toggleSound, claimScope, scopeEl]
    )

    return <VillageContext.Provider value={value}>{children}</VillageContext.Provider>
}

/**
 * Slate — the running head. Real timecode from page load, REC state that arms
 * when the viewer enters, camera ID, and the sound control.
 */
export function Slate({ reelCount, views }) {
    const { entered, sound, toggleSound } = useVillage()
    const [tc, setTc] = useState('00:00:00:00')
    const startRef = useRef(null)

    useEffect(() => {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        if (reduced) {
            setTc('01:23:07:14')
            return
        }
        startRef.current = performance.now()
        let raf
        let last = 0
        const tick = (now) => {
            // The display only advances at frame rate; no point repainting at 120Hz.
            if (now - last > 1000 / TC_FPS) {
                setTc(timecode(now - startRef.current))
                last = now
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])

    return (
        <div className={`vv-slate ${entered ? 'is-rolling' : ''}`}>
            <span className="vv-slate__id">TDS//VIDEO-VILLAGE</span>
            <span className={`vv-slate__rec ${entered ? 'is-on' : ''}`}>
                <i aria-hidden="true" />
                {entered ? 'REC' : 'STBY'}
            </span>
            <span className="vv-slate__tc" aria-label="Timecode">{tc}</span>
            <span className="vv-slate__cam">A-CAM</span>
            <span className="vv-slate__meta">
                {reelCount} ROLLS · {views} VIEWS
            </span>
            <button
                type="button"
                className={`vv-sound ${sound ? 'is-on' : ''}`}
                onClick={toggleSound}
                aria-pressed={sound}
            >
                <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" fill="currentColor">
                    <path d="M7 2 3.6 5H1v6h2.6L7 14V2Z" />
                    {sound ? (
                        <>
                            <path d="M10 5.2a3.6 3.6 0 0 1 0 5.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
                            <path d="M12 3.4a6.2 6.2 0 0 1 0 9.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
                        </>
                    ) : (
                        <path d="M10.4 6 14 9.6M14 6l-3.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
                    )}
                </svg>
                {sound ? 'SOUND ON' : 'SOUND OFF'}
            </button>
        </div>
    )
}

/**
 * Frame — corner framing brackets and safe-area guides, drawn over the whole
 * viewport. Same geometry as the studio mark, which is itself a viewfinder.
 * Purely decorative and non-interactive.
 */
export function Frame() {
    const { entered } = useVillage()
    return (
        <div className={`vv-frame ${entered ? 'is-live' : ''}`} aria-hidden="true">
            <span className="vv-frame__c vv-frame__c--tl" />
            <span className="vv-frame__c vv-frame__c--tr" />
            <span className="vv-frame__c vv-frame__c--bl" />
            <span className="vv-frame__c vv-frame__c--br" />
            <span className="vv-frame__safe" />
        </div>
    )
}

/**
 * Scope — a 24-bar level meter.
 *
 * When a clip is playing with sound armed it reads real FFT data from the
 * shared analyser. Otherwise it runs a slow idle sweep so the meter never sits
 * dead, which would read as broken rather than as quiet.
 */
export function Scope({ className = '' }) {
    const { sound, analyserRef, scopeEl } = useVillage()
    const barsRef = useRef([])
    const rafRef = useRef(null)

    useEffect(() => {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        if (reduced) return

        const N = 24
        const data = new Uint8Array(128)
        let t = 0

        const paint = () => {
            const analyser = analyserRef?.current
            const live = sound && scopeEl && analyser
            if (live) analyser.getByteFrequencyData(data)

            for (let i = 0; i < N; i++) {
                const bar = barsRef.current[i]
                if (!bar) continue
                let v
                if (live) {
                    v = data[Math.floor((i / N) * 96)] / 255
                } else {
                    // Idle sweep: a low travelling swell, never flat, never busy.
                    v = 0.1 + 0.16 * (Math.sin(t / 22 + i * 0.5) * 0.5 + 0.5)
                }
                bar.style.transform = `scaleY(${Math.max(0.06, Math.min(1, v))})`
            }
            t += 1
            rafRef.current = requestAnimationFrame(paint)
        }
        rafRef.current = requestAnimationFrame(paint)
        return () => cancelAnimationFrame(rafRef.current)
    }, [sound, scopeEl, analyserRef])

    return (
        <span className={`vv-scope ${sound ? 'is-live' : ''} ${className}`} aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => (
                <i key={i} ref={(el) => { barsRef.current[i] = el }} />
            ))}
        </span>
    )
}
