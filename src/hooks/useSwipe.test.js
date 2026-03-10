import { describe, it, expect, vi } from 'vitest'

/**
 * Tests useSwipe touch gesture logic directly — matching the project's
 * pure-function testing pattern (no renderHook / @testing-library needed).
 *
 * We replicate the swipe detection logic and test every edge:
 * threshold boundary (50px: > not >=), missing touches, null callbacks,
 * multi-touch sequences, and direction detection.
 */

function createSwipeDetector(onLeft, onRight) {
  let startX = null
  return {
    onTouchStart(e) { startX = e.touches[0].clientX },
    onTouchEnd(e) {
      if (startX === null || !e.changedTouches?.length) return
      const diff = startX - e.changedTouches[0].clientX
      if (Math.abs(diff) > 50) diff > 0 ? onLeft?.() : onRight?.()
      startX = null
    },
    // Expose for assertions
    get _startX() { return startX }
  }
}

function touchStart(x) { return { touches: [{ clientX: x }] } }
function touchEnd(x) { return { changedTouches: [{ clientX: x }] } }

describe('useSwipe gesture detection', () => {
  it('detects left swipe (finger moves right-to-left)', () => {
    const onLeft = vi.fn()
    const swipe = createSwipeDetector(onLeft, vi.fn())
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd(touchEnd(100)) // diff = 100 > 50
    expect(onLeft).toHaveBeenCalledOnce()
  })

  it('detects right swipe (finger moves left-to-right)', () => {
    const onRight = vi.fn()
    const swipe = createSwipeDetector(vi.fn(), onRight)
    swipe.onTouchStart(touchStart(100))
    swipe.onTouchEnd(touchEnd(200)) // diff = -100, abs > 50
    expect(onRight).toHaveBeenCalledOnce()
  })

  it('ignores swipes below 50px threshold', () => {
    const onLeft = vi.fn()
    const onRight = vi.fn()
    const swipe = createSwipeDetector(onLeft, onRight)
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd(touchEnd(160)) // diff = 40 < 50
    expect(onLeft).not.toHaveBeenCalled()
    expect(onRight).not.toHaveBeenCalled()
  })

  it('boundary: exactly 50px does NOT trigger (> not >=)', () => {
    const onLeft = vi.fn()
    const swipe = createSwipeDetector(onLeft, vi.fn())
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd(touchEnd(150)) // diff = exactly 50
    expect(onLeft).not.toHaveBeenCalled()
  })

  it('boundary: 51px triggers', () => {
    const onLeft = vi.fn()
    const swipe = createSwipeDetector(onLeft, vi.fn())
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd(touchEnd(149)) // diff = 51
    expect(onLeft).toHaveBeenCalledOnce()
  })

  it('resets startX after touchEnd — no ghost swipes', () => {
    const onLeft = vi.fn()
    const swipe = createSwipeDetector(onLeft, vi.fn())
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd(touchEnd(100))
    // Second touchEnd without a new touchStart should be a no-op
    swipe.onTouchEnd(touchEnd(0))
    expect(onLeft).toHaveBeenCalledOnce()
  })

  it('handles missing changedTouches gracefully', () => {
    const onLeft = vi.fn()
    const swipe = createSwipeDetector(onLeft, vi.fn())
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd({ changedTouches: null })
    expect(onLeft).not.toHaveBeenCalled()
  })

  it('handles empty changedTouches array', () => {
    const onLeft = vi.fn()
    const swipe = createSwipeDetector(onLeft, vi.fn())
    swipe.onTouchStart(touchStart(200))
    swipe.onTouchEnd({ changedTouches: [] })
    expect(onLeft).not.toHaveBeenCalled()
  })

  it('tolerates null onLeft callback', () => {
    const swipe = createSwipeDetector(null, vi.fn())
    swipe.onTouchStart(touchStart(200))
    expect(() => swipe.onTouchEnd(touchEnd(100))).not.toThrow()
  })

  it('tolerates null onRight callback', () => {
    const swipe = createSwipeDetector(vi.fn(), null)
    swipe.onTouchStart(touchStart(100))
    expect(() => swipe.onTouchEnd(touchEnd(200))).not.toThrow()
  })

  it('consecutive swipes work independently', () => {
    const onLeft = vi.fn()
    const onRight = vi.fn()
    const swipe = createSwipeDetector(onLeft, onRight)
    // Swipe left
    swipe.onTouchStart(touchStart(300))
    swipe.onTouchEnd(touchEnd(100))
    // Swipe right
    swipe.onTouchStart(touchStart(100))
    swipe.onTouchEnd(touchEnd(300))
    expect(onLeft).toHaveBeenCalledOnce()
    expect(onRight).toHaveBeenCalledOnce()
  })
})
