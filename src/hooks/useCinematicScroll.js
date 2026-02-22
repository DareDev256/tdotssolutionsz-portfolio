import { useState, useEffect, useCallback } from 'react'

/**
 * useCinematicScroll — Tracks continuous scroll progress for an element.
 *
 * Returns a float 0→1 representing how far the element has traveled
 * from the bottom of the viewport (0 = just entering) to fully visible (1).
 * Only activates the scroll listener when the element is near the viewport
 * (IntersectionObserver with rootMargin) to avoid unnecessary work.
 *
 * Respects prefers-reduced-motion — returns 1 immediately (fully revealed).
 *
 * @param {React.RefObject} ref - Element ref to observe
 * @returns {number} scrollProgress 0–1
 */
export default function useCinematicScroll(ref) {
  const [progress, setProgress] = useState(0)
  const [isNear, setIsNear] = useState(false)

  // Gate: only attach scroll listener when element is near viewport
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setProgress(1)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsNear(entry.isIntersecting),
      { rootMargin: '100px 0px 100px 0px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  const calcProgress = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const windowH = window.innerHeight
    // 0 when bottom edge enters viewport, 1 when top edge reaches center
    const raw = 1 - (rect.top / (windowH * 0.8))
    setProgress(Math.max(0, Math.min(1, raw)))
  }, [ref])

  useEffect(() => {
    if (!isNear) return
    calcProgress() // initial calc
    window.addEventListener('scroll', calcProgress, { passive: true })
    return () => window.removeEventListener('scroll', calcProgress)
  }, [isNear, calcProgress])

  return progress
}
