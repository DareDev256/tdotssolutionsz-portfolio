import { useEffect } from 'react'

/**
 * useStaggerReveal — Batch-observes child elements within a container ref
 * and adds a CSS class when each enters the viewport.
 *
 * Replaces the duplicated IntersectionObserver pattern found across
 * TopHits, EraTimeline, and similar scroll-triggered reveal sections.
 *
 * @param {React.RefObject} containerRef - Ref to the parent container element
 * @param {string} childSelector - CSS selector for children to observe (e.g. '.era-card')
 * @param {string} visibleClass - Class to add on intersection (e.g. 'era-card--visible')
 * @param {object} [options] - Configuration
 * @param {number} [options.threshold=0.15] - IntersectionObserver threshold (0-1)
 * @param {string} [options.rootMargin='0px 0px -40px 0px'] - Observer root margin
 * @param {boolean} [options.once=true] - Unobserve after first intersection (fire-once)
 * @param {*} [options.deps=null] - Extra dependency to trigger re-observation
 */
export default function useStaggerReveal(
  containerRef,
  childSelector,
  visibleClass,
  {
    threshold = 0.15,
    rootMargin = '0px 0px -40px 0px',
    once = true,
    deps = null,
  } = {}
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const children = container.querySelectorAll(childSelector)
    if (!children.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(visibleClass)
            if (once) observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin }
    )

    children.forEach((child) => observer.observe(child))

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, childSelector, visibleClass, threshold, rootMargin, once, deps])
}
