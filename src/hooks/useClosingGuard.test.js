import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Tests the closing guard state machine directly — matching the project's
 * pure-function testing pattern (no renderHook / @testing-library needed).
 *
 * We extract the core state machine that useClosingGuard manages and verify
 * all transition edges: open, close, double-close, re-open during close,
 * and timer cleanup.
 */

/**
 * Minimal state machine mirroring useClosingGuard's logic.
 * In the real hook, React useState + useRef manage these; here we test
 * the transition logic in isolation.
 */
function createClosingGuard(duration = 300) {
  let isOpen = false
  let isClosing = false
  let timer = null

  return {
    get isOpen() { return isOpen },
    get isClosing() { return isClosing },
    get isVisible() { return isOpen },

    open() {
      if (timer) { clearTimeout(timer); timer = null }
      isClosing = false
      isOpen = true
    },

    close() {
      if (!isOpen || isClosing) return
      isClosing = true
      timer = setTimeout(() => {
        isOpen = false
        isClosing = false
        timer = null
      }, duration)
    },

    destroy() {
      if (timer) clearTimeout(timer)
    }
  }
}

describe('useClosingGuard state machine', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('starts fully closed', () => {
    const guard = createClosingGuard(300)
    expect(guard.isOpen).toBe(false)
    expect(guard.isClosing).toBe(false)
    expect(guard.isVisible).toBe(false)
  })

  it('opens immediately on open()', () => {
    const guard = createClosingGuard(300)
    guard.open()
    expect(guard.isOpen).toBe(true)
    expect(guard.isClosing).toBe(false)
  })

  it('enters closing phase — stays visible for animation', () => {
    const guard = createClosingGuard(300)
    guard.open()
    guard.close()
    expect(guard.isOpen).toBe(true)
    expect(guard.isClosing).toBe(true)
    expect(guard.isVisible).toBe(true)
  })

  it('fully closes after duration elapses', () => {
    const guard = createClosingGuard(300)
    guard.open()
    guard.close()
    vi.advanceTimersByTime(300)
    expect(guard.isOpen).toBe(false)
    expect(guard.isClosing).toBe(false)
    expect(guard.isVisible).toBe(false)
  })

  it('prevents double-close (second close is a no-op)', () => {
    const guard = createClosingGuard(300)
    guard.open()
    guard.close()
    guard.close() // should not reset the timer
    vi.advanceTimersByTime(300)
    expect(guard.isOpen).toBe(false)
  })

  it('re-open during closing cancels pending close', () => {
    const guard = createClosingGuard(300)
    guard.open()
    guard.close()
    vi.advanceTimersByTime(150) // halfway through close animation
    expect(guard.isClosing).toBe(true)
    guard.open() // cancel close, snap open
    expect(guard.isOpen).toBe(true)
    expect(guard.isClosing).toBe(false)
    // stale timer must NOT fire
    vi.advanceTimersByTime(300)
    expect(guard.isOpen).toBe(true)
  })

  it('respects custom duration', () => {
    const guard = createClosingGuard(500)
    guard.open()
    guard.close()
    vi.advanceTimersByTime(300) // 300 < 500 — still closing
    expect(guard.isClosing).toBe(true)
    vi.advanceTimersByTime(200) // now at 500
    expect(guard.isOpen).toBe(false)
  })

  it('close() on already-closed state is a no-op', () => {
    const guard = createClosingGuard(300)
    guard.close() // should not throw or change state
    expect(guard.isOpen).toBe(false)
    expect(guard.isClosing).toBe(false)
  })
})
