import { useEffect, useRef } from 'react'
import './IntroLetters.css'

/**
 * IntroLetters — "MUSIC VIDEOS" letter-assembly overlay for the /videos tunnel.
 *
 * Reads a shared progress ref (driven by the R3F CameraRig from useScroll)
 * via its own rAF loop so it can update CSS transforms every frame without
 * re-rendering React. Wrapper has pointer-events: none so card clicks in the
 * tunnel below pass through (gotcha_scroll_cinema_pointer_events.md).
 *
 * Choreography:
 *   On mount        : letters scatter → assemble over ~1400ms (entrance reveal)
 *   0.00 - 0.05 scroll : hold fully assembled
 *   0.05 - 0.08 scroll : scatter back out + fade as user dives into tunnel
 *   0.08+ scroll    : fully hidden, GPU layer dropped
 */
const ENTRANCE_MS = 1400

export default function IntroLetters({ progressRef }) {
    const wrapperRef = useRef(null)

    useEffect(() => {
        const root = wrapperRef.current
        if (!root) return
        const chars = Array.from(root.querySelectorAll('.intro-char'))

        // Deterministic per-char scatter seeds so it looks intentional, not random
        const seeds = chars.map((_, i) => ({
            x: (((i * 37) % 199) - 99) * 7,    // ±~700px
            y: (((i * 71) % 137) - 68) * 6,    // ±~400px
            r: (((i * 53) % 181) - 90) * 1.6,  // ±~144deg
        }))

        const startTime = performance.now()
        let raf

        const tick = (now) => {
            const offset = (progressRef && progressRef.current) || 0
            const tEntrance = Math.min(1, (now - startTime) / ENTRANCE_MS)
            // Ease-out cubic for entrance assembly
            const easedEntrance = 1 - Math.pow(1 - tEntrance, 3)

            // Scroll-driven scatter: start scattering once user passes 5% scroll
            let scrollAssemble = 1
            if (offset < 0.05) {
                scrollAssemble = 1
            } else if (offset < 0.08) {
                scrollAssemble = 1 - (offset - 0.05) / 0.03
            } else {
                scrollAssemble = 0
            }

            const assemble = Math.min(easedEntrance, scrollAssemble)
            const alpha = assemble
            const scatter = 1 - assemble

            for (let i = 0; i < chars.length; i++) {
                const c = chars[i]
                const s = seeds[i]
                c.style.transform = `translate(${s.x * scatter}px, ${s.y * scatter}px) rotate(${s.r * scatter}deg)`
                c.style.opacity = alpha
            }
            root.style.visibility = alpha > 0.001 ? 'visible' : 'hidden'

            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [progressRef])

    return (
        <div ref={wrapperRef} className="intro-letters" aria-hidden="true">
            <div className="intro-row">
                {'MUSIC'.split('').map((c, i) => (
                    <span key={`m-${i}`} className="intro-char">{c}</span>
                ))}
            </div>
            <div className="intro-row">
                {'VIDEOS'.split('').map((c, i) => (
                    <span key={`v-${i}`} className="intro-char">{c}</span>
                ))}
            </div>
        </div>
    )
}
