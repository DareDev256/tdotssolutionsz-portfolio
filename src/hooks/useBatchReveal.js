import { useState, useEffect } from 'react'

/**
 * useBatchReveal — Triggers CSS reveal animations as elements with `[data-vid]`
 * enter the viewport. Unlike the single-ref `useScrollReveal`, this hook
 * batch-observes ALL matching elements in the DOM at once.
 *
 * Uses IntersectionObserver on all `[data-vid]` elements. The `deps` parameter
 * controls when to re-scan the DOM for new cards (e.g., after tab switch).
 * Passing `null` skips observation entirely — used during initial render before
 * card elements exist in the DOM.
 *
 * The `requestAnimationFrame` wrapper ensures we query the DOM *after* React
 * has committed the new elements from the latest render, avoiding a race
 * condition where querySelectorAll runs before cards are painted.
 *
 * @param {*} deps - Dependency value that triggers re-observation. Pass null to skip.
 * @returns {Set<string>} Set of video IDs that have been revealed
 */
export default function useBatchReveal(deps) {
    const [revealed, setRevealed] = useState(new Set())
    useEffect(() => {
        if (deps === null) return // Still loading — skip until DOM has cards

        // Defer to next frame so React has committed new [data-vid] elements
        const raf = requestAnimationFrame(() => {
            const elements = document.querySelectorAll('[data-vid]')
            if (elements.length === 0) return

            const observer = new IntersectionObserver(
                (entries) => {
                    const newIds = []
                    entries.forEach(e => {
                        if (e.isIntersecting && e.target.dataset.vid) newIds.push(e.target.dataset.vid)
                    })
                    if (newIds.length) setRevealed(prev => {
                        const next = new Set(prev)
                        newIds.forEach(id => next.add(id))
                        return next
                    })
                },
                { threshold: 0.1, rootMargin: '50px' }
            )
            elements.forEach(el => observer.observe(el))

            // Store for cleanup
            cleanup.observer = observer
            cleanup.elements = elements
        })

        const cleanup = { observer: null, elements: null }
        return () => {
            cancelAnimationFrame(raf)
            if (cleanup.observer) {
                cleanup.elements?.forEach(el => cleanup.observer.unobserve(el))
                cleanup.observer.disconnect()
            }
        }
    }, [deps])
    return revealed
}
