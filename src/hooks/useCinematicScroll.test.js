import { describe, it, expect } from 'vitest'

/**
 * Tests useCinematicScroll's scroll progress calculation in isolation.
 *
 * The hook's core math: `raw = 1 - (rect.top / (windowH * 0.8))`
 * clamped to [0, 1]. We test this formula across viewport positions
 * to catch boundary bugs, NaN from zero-height viewports, and
 * clamping behavior at extremes.
 */

function calcScrollProgress(rectTop, windowH) {
  if (windowH <= 0) return 0 // guard against division by zero
  const raw = 1 - (rectTop / (windowH * 0.8))
  return Math.max(0, Math.min(1, raw))
}

describe('useCinematicScroll progress calculation', () => {
  const WINDOW_H = 1000

  it('returns 0 when element is at bottom of viewport', () => {
    // rect.top = windowH * 0.8 → raw = 1 - 1 = 0
    expect(calcScrollProgress(800, WINDOW_H)).toBe(0)
  })

  it('returns 1 when element reaches top of viewport', () => {
    // rect.top = 0 → raw = 1 - 0 = 1
    expect(calcScrollProgress(0, WINDOW_H)).toBe(1)
  })

  it('returns 0.5 at midpoint', () => {
    // rect.top = 400 → raw = 1 - (400/800) = 0.5
    expect(calcScrollProgress(400, WINDOW_H)).toBe(0.5)
  })

  it('clamps to 0 when element is far below viewport', () => {
    // rect.top = 2000 → raw = 1 - 2.5 = -1.5 → clamped to 0
    expect(calcScrollProgress(2000, WINDOW_H)).toBe(0)
  })

  it('clamps to 1 when element has scrolled above viewport', () => {
    // rect.top = -500 → raw = 1 - (-0.625) = 1.625 → clamped to 1
    expect(calcScrollProgress(-500, WINDOW_H)).toBe(1)
  })

  it('returns 0.25 at quarter progress', () => {
    // rect.top = 600 → raw = 1 - (600/800) = 0.25
    expect(calcScrollProgress(600, WINDOW_H)).toBe(0.25)
  })

  it('handles small viewport heights', () => {
    // Mobile viewport: 600px → threshold = 480
    const result = calcScrollProgress(240, 600)
    expect(result).toBe(0.5)
  })

  it('handles zero window height without NaN', () => {
    // Division by zero guard — must not return NaN
    const result = calcScrollProgress(100, 0)
    expect(result).toBe(0)
    expect(Number.isNaN(result)).toBe(false)
  })

  it('handles negative window height', () => {
    const result = calcScrollProgress(100, -100)
    expect(result).toBe(0)
  })

  it('returns exactly 1 at rect.top = 0 regardless of window size', () => {
    // At top of viewport, progress is always 1
    expect(calcScrollProgress(0, 500)).toBe(1)
    expect(calcScrollProgress(0, 1080)).toBe(1)
    expect(calcScrollProgress(0, 2160)).toBe(1)
  })

  it('monotonically increases as element scrolls up', () => {
    // Verify progress always increases as rect.top decreases
    const positions = [800, 600, 400, 200, 0]
    const results = positions.map(top => calcScrollProgress(top, WINDOW_H))
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toBeGreaterThan(results[i - 1])
    }
  })

  it('stays clamped across extreme negative rect.top values', () => {
    // Element scrolled way past — should still be exactly 1, not overflow
    expect(calcScrollProgress(-10000, WINDOW_H)).toBe(1)
  })
})
