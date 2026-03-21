import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useAtmosphereScroll — Returns the dominant section's mood {color, intensity}
 * as the user scrolls through HubPage. Respects prefers-reduced-motion.
 * @returns {{ name: string, color: string, intensity: number }}
 */
const SECTION_MOODS = [
  { selector: '.hub-header',     color: '119, 0, 255',   name: 'origins' },
  { selector: '.impact-numbers', color: '211, 0, 197',   name: 'impact' },
  { selector: '.film-strip',     color: '255, 42, 109',  name: 'filmstrip' },
  { selector: '.artist-showcase',color: '255, 0, 128',   name: 'artists' },
  { selector: '.now-playing',    color: '5, 217, 232',   name: 'spotlight' },
  { selector: '.top-hits',       color: '255, 107, 53',  name: 'tophits' },
  { selector: '.era-timeline',   color: '0, 255, 136',   name: 'eras' },
  { selector: '.hub-footer',     color: '119, 0, 255',   name: 'footer' },
]

export default function useAtmosphereScroll() {
  const [mood, setMood] = useState({ name: 'origins', color: '119, 0, 255', intensity: 0.15 })
  const rafRef = useRef(null)
  const lastMoodRef = useRef('origins')

  const calcMood = useCallback(() => {
    const viewportCenter = window.innerHeight / 2

    let closestDist = Infinity
    let closestMood = SECTION_MOODS[0]

    for (const section of SECTION_MOODS) {
      const el = document.querySelector(section.selector)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const elCenter = rect.top + rect.height / 2
      const dist = Math.abs(elCenter - viewportCenter)

      if (dist < closestDist) {
        closestDist = dist
        closestMood = section
      }
    }

    // Only update if mood changed to avoid re-renders
    if (closestMood.name !== lastMoodRef.current) {
      lastMoodRef.current = closestMood.name
      // Intensity based on how centered the section is (closer = stronger)
      const maxDist = window.innerHeight
      const intensity = Math.max(0.08, 0.18 - (closestDist / maxDist) * 0.1)
      setMood({ name: closestMood.name, color: closestMood.color, intensity })
    }
  }, [])

  useEffect(() => {
    // Respect reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(calcMood)
    }

    calcMood()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [calcMood])

  return mood
}
