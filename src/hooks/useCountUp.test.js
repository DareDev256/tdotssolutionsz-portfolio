import { describe, it, expect } from 'vitest'
import { easeOutExpo } from '../utils/easing'

/**
 * Tests the easeOutExpo counting algorithm directly — matching the project's
 * pure-function testing pattern (no renderHook / @testing-library needed).
 *
 * The hook wraps this core math in rAF; we test the math itself.
 */

function simulateCountUp(target, duration, elapsedMs) {
  const progress = Math.min(elapsedMs / duration, 1)
  const eased = easeOutExpo(progress)
  return Math.round(eased * target)
}

describe('useCountUp — easing algorithm', () => {
  it('returns 0 at elapsed = 0', () => {
    expect(simulateCountUp(100, 2000, 0)).toBe(0)
  })

  it('returns target value when elapsed >= duration', () => {
    expect(simulateCountUp(100, 2000, 2000)).toBe(100)
    expect(simulateCountUp(100, 2000, 3000)).toBe(100)
  })

  it('front-loads progress (>80% at halfway)', () => {
    const valueAtHalf = simulateCountUp(100, 2000, 1000)
    expect(valueAtHalf).toBeGreaterThan(80)
  })

  it('front-loads progress (>95% at 75% elapsed)', () => {
    const valueAt75 = simulateCountUp(100, 2000, 1500)
    expect(valueAt75).toBeGreaterThan(95)
  })

  it('works with large targets (view counts)', () => {
    const value = simulateCountUp(103, 2400, 2400)
    expect(value).toBe(103)
  })

  it('works with small targets (years)', () => {
    const value = simulateCountUp(14, 1600, 1600)
    expect(value).toBe(14)
  })

  it('produces monotonically increasing values', () => {
    const target = 100
    const duration = 2000
    let prev = 0
    for (let t = 0; t <= duration; t += 100) {
      const current = simulateCountUp(target, duration, t)
      expect(current).toBeGreaterThanOrEqual(prev)
      prev = current
    }
  })

  it('easeOutExpo curve is correct at known points', () => {
    expect(easeOutExpo(0)).toBeCloseTo(0, 2)
    expect(easeOutExpo(1)).toBe(1)
    // At t=0.5, easeOutExpo = 1 - 2^(-5) ≈ 0.969
    expect(easeOutExpo(0.5)).toBeCloseTo(0.969, 2)
  })
})
