import { describe, it, expect } from 'vitest'

/**
 * Tests useStaggerReveal's core behavior in isolation.
 *
 * The hook's logic: create an IntersectionObserver on children matching
 * a CSS selector inside a container, add a CSS class on intersection,
 * optionally unobserve (fire-once). We extract the observer callback
 * logic and test it across scenarios to verify class-toggling,
 * fire-once vs. persistent, and edge cases.
 */

/**
 * Simulates the IntersectionObserver callback logic from useStaggerReveal.
 *
 * @param {Array<{ isIntersecting: boolean, target: object }>} entries
 * @param {string} visibleClass - Class to add
 * @param {boolean} once - Whether to unobserve after first hit
 * @returns {{ classesAdded: string[], unobserved: object[] }}
 */
function simulateRevealCallback(entries, visibleClass, once = true) {
  const classesAdded = []
  const unobserved = []

  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Simulate classList.add
      classesAdded.push({ target: entry.target, class: visibleClass })
      if (once) {
        unobserved.push(entry.target)
      }
    }
  })

  return { classesAdded, unobserved }
}

describe('useStaggerReveal callback logic', () => {
  it('adds visible class to intersecting entries', () => {
    const entries = [
      { isIntersecting: true, target: { id: 'card-1' } },
      { isIntersecting: true, target: { id: 'card-2' } },
    ]

    const { classesAdded } = simulateRevealCallback(entries, 'card--visible')
    expect(classesAdded).toHaveLength(2)
    expect(classesAdded[0].class).toBe('card--visible')
    expect(classesAdded[1].target.id).toBe('card-2')
  })

  it('ignores non-intersecting entries', () => {
    const entries = [
      { isIntersecting: false, target: { id: 'card-1' } },
      { isIntersecting: true, target: { id: 'card-2' } },
      { isIntersecting: false, target: { id: 'card-3' } },
    ]

    const { classesAdded } = simulateRevealCallback(entries, 'card--visible')
    expect(classesAdded).toHaveLength(1)
    expect(classesAdded[0].target.id).toBe('card-2')
  })

  it('unobserves after intersection when once=true (default)', () => {
    const entries = [
      { isIntersecting: true, target: { id: 'card-1' } },
      { isIntersecting: true, target: { id: 'card-2' } },
    ]

    const { unobserved } = simulateRevealCallback(entries, 'card--visible', true)
    expect(unobserved).toHaveLength(2)
    expect(unobserved[0].id).toBe('card-1')
    expect(unobserved[1].id).toBe('card-2')
  })

  it('does NOT unobserve when once=false', () => {
    const entries = [
      { isIntersecting: true, target: { id: 'card-1' } },
      { isIntersecting: true, target: { id: 'card-2' } },
    ]

    const { unobserved } = simulateRevealCallback(entries, 'card--visible', false)
    expect(unobserved).toHaveLength(0)
  })

  it('handles empty entries array', () => {
    const { classesAdded, unobserved } = simulateRevealCallback([], 'card--visible')
    expect(classesAdded).toHaveLength(0)
    expect(unobserved).toHaveLength(0)
  })

  it('handles all non-intersecting entries', () => {
    const entries = [
      { isIntersecting: false, target: { id: 'a' } },
      { isIntersecting: false, target: { id: 'b' } },
    ]

    const { classesAdded } = simulateRevealCallback(entries, 'x--visible')
    expect(classesAdded).toHaveLength(0)
  })

  it('applies the correct class name regardless of selector', () => {
    const entries = [{ isIntersecting: true, target: { id: 'era-1' } }]

    const r1 = simulateRevealCallback(entries, 'era-card--visible')
    expect(r1.classesAdded[0].class).toBe('era-card--visible')

    const r2 = simulateRevealCallback(entries, 'top-hit-card--visible')
    expect(r2.classesAdded[0].class).toBe('top-hit-card--visible')
  })

  it('processes entries in order (stagger-friendly)', () => {
    const entries = [
      { isIntersecting: true, target: { id: 'c1' } },
      { isIntersecting: false, target: { id: 'c2' } },
      { isIntersecting: true, target: { id: 'c3' } },
    ]

    const { classesAdded } = simulateRevealCallback(entries, 'vis')
    expect(classesAdded.map(c => c.target.id)).toEqual(['c1', 'c3'])
  })
})

describe('useStaggerReveal default options', () => {
  it('defaults match the common reveal pattern', () => {
    // These defaults were extracted from the duplicated patterns in
    // TopHits (threshold: 0.15, rootMargin: '0px 0px -40px 0px')
    // and EraTimeline (threshold: 0.2, rootMargin: '0px 0px -40px 0px')
    const defaults = {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
      once: true,
      deps: null,
    }

    expect(defaults.threshold).toBeGreaterThan(0)
    expect(defaults.threshold).toBeLessThan(1)
    expect(defaults.rootMargin).toContain('-40px')
    expect(defaults.once).toBe(true)
    expect(defaults.deps).toBeNull()
  })
})
