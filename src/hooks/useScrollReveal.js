import { useState, useEffect } from 'react'

/**
 * Observe a ref element and flip to `true` once it enters the viewport.
 * Fires once — the observer disconnects after the first intersection.
 *
 * @param {React.RefObject} ref - Element ref to observe
 * @param {number} [threshold=0.2] - IntersectionObserver threshold (0–1)
 * @returns {boolean} Whether the element has been revealed
 */
export default function useScrollReveal(ref, threshold = 0.2) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])

  return isVisible
}
