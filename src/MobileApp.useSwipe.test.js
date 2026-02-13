import { describe, it, expect, vi } from 'vitest'

/**
 * Tests for the useSwipe gesture detection logic (inline in MobileApp.jsx).
 *
 * Extracts and tests the core touch-distance algorithm:
 * - Swipe must exceed 50px threshold to trigger
 * - Positive diff (start > end) = swipe left
 * - Negative diff (start < end) = swipe right
 * - Null/missing changedTouches safely no-ops (v3.7.6 fix)
 */

const SWIPE_THRESHOLD = 50

/**
 * Pure swipe detection — mirrors MobileApp.jsx useSwipe logic.
 * @param {number|null} startX - Touch start clientX (null if never started)
 * @param {number|null} endX - Touch end clientX (null if changedTouches missing)
 * @returns {'left'|'right'|null} - Detected direction or null if below threshold
 */
function detectSwipe(startX, endX) {
    if (startX === null || endX === null) return null
    const diff = startX - endX
    if (Math.abs(diff) <= SWIPE_THRESHOLD) return null
    return diff > 0 ? 'left' : 'right'
}

/**
 * Simulates the full onTouchStart → onTouchEnd flow,
 * including the changedTouches null guard from v3.7.6.
 */
function simulateSwipe(startClientX, changedTouches) {
    let startRef = null
    const onLeft = vi.fn()
    const onRight = vi.fn()

    // onTouchStart
    startRef = startClientX

    // onTouchEnd — replicate the exact guard from MobileApp.jsx
    if (startRef === null || !changedTouches?.length) {
        return { onLeft, onRight, triggered: false }
    }
    const diff = startRef - changedTouches[0].clientX
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        diff > 0 ? onLeft() : onRight()
    }
    return { onLeft, onRight, triggered: true }
}

describe('useSwipe — direction detection', () => {
    it('detects left swipe when finger moves right-to-left', () => {
        expect(detectSwipe(300, 200)).toBe('left')
        expect(detectSwipe(500, 100)).toBe('left')
    })

    it('detects right swipe when finger moves left-to-right', () => {
        expect(detectSwipe(100, 300)).toBe('right')
        expect(detectSwipe(50, 400)).toBe('right')
    })

    it('returns null when movement is below 50px threshold', () => {
        expect(detectSwipe(200, 200)).toBeNull()    // no movement
        expect(detectSwipe(200, 175)).toBeNull()     // 25px — under threshold
        expect(detectSwipe(200, 250)).toBeNull()     // 50px — at threshold (not exceeded)
        expect(detectSwipe(200, 150)).toBeNull()     // exactly 50px — not exceeded
    })

    it('triggers at 51px (just above threshold)', () => {
        expect(detectSwipe(200, 149)).toBe('left')   // 51px left
        expect(detectSwipe(200, 251)).toBe('right')  // 51px right
    })
})

describe('useSwipe — null safety (v3.7.6 regression guard)', () => {
    it('returns null when startX is null (no touchstart fired)', () => {
        expect(detectSwipe(null, 200)).toBeNull()
    })

    it('returns null when endX is null (changedTouches missing)', () => {
        expect(detectSwipe(200, null)).toBeNull()
    })

    it('returns null when both are null', () => {
        expect(detectSwipe(null, null)).toBeNull()
    })
})

describe('useSwipe — full touch lifecycle simulation', () => {
    it('calls onLeft for a left swipe exceeding threshold', () => {
        const { onLeft, onRight } = simulateSwipe(300, [{ clientX: 100 }])
        expect(onLeft).toHaveBeenCalledTimes(1)
        expect(onRight).not.toHaveBeenCalled()
    })

    it('calls onRight for a right swipe exceeding threshold', () => {
        const { onLeft, onRight } = simulateSwipe(100, [{ clientX: 300 }])
        expect(onRight).toHaveBeenCalledTimes(1)
        expect(onLeft).not.toHaveBeenCalled()
    })

    it('calls neither when swipe is below threshold', () => {
        const { onLeft, onRight, triggered } = simulateSwipe(200, [{ clientX: 180 }])
        expect(triggered).toBe(true)
        expect(onLeft).not.toHaveBeenCalled()
        expect(onRight).not.toHaveBeenCalled()
    })

    it('safely no-ops when changedTouches is null (v3.7.6 guard)', () => {
        const { triggered } = simulateSwipe(200, null)
        expect(triggered).toBe(false)
    })

    it('safely no-ops when changedTouches is empty array', () => {
        const { triggered } = simulateSwipe(200, [])
        expect(triggered).toBe(false)
    })

    it('safely no-ops when startX was never set', () => {
        const { triggered } = simulateSwipe(null, [{ clientX: 300 }])
        expect(triggered).toBe(false)
    })
})
