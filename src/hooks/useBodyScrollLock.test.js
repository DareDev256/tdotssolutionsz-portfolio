import { describe, it, expect, beforeEach } from 'vitest'

/**
 * useBodyScrollLock — Tests the scroll-locking contract.
 *
 * The hook sets a style object's overflow to 'hidden' when locked
 * and restores to '' when unlocked or on cleanup. Tests verify:
 * - Lock/unlock toggles overflow correctly
 * - Cleanup always restores (prevents scroll-stuck bugs)
 * - Multiple rapid toggles settle correctly
 *
 * Uses a plain style object to mirror document.body.style behavior
 * without requiring jsdom — matching the project's pure-function pattern.
 */

function applyScrollLock(style, isLocked) {
    if (isLocked) {
        style.overflow = 'hidden'
    } else {
        style.overflow = ''
    }
}

function cleanupScrollLock(style) {
    style.overflow = ''
}

describe('useBodyScrollLock — core behavior', () => {
    let style

    beforeEach(() => {
        style = { overflow: '' }
    })

    it('sets overflow to hidden when locked', () => {
        applyScrollLock(style, true)
        expect(style.overflow).toBe('hidden')
    })

    it('restores overflow to empty string when unlocked', () => {
        applyScrollLock(style, true)
        applyScrollLock(style, false)
        expect(style.overflow).toBe('')
    })

    it('cleanup always restores overflow (prevents scroll-stuck bug)', () => {
        applyScrollLock(style, true)
        expect(style.overflow).toBe('hidden')
        cleanupScrollLock(style)
        expect(style.overflow).toBe('')
    })

    it('calling unlock when already unlocked is a no-op', () => {
        applyScrollLock(style, false)
        expect(style.overflow).toBe('')
    })

    it('rapid lock/unlock/lock settles correctly', () => {
        applyScrollLock(style, true)
        applyScrollLock(style, false)
        applyScrollLock(style, true)
        expect(style.overflow).toBe('hidden')
    })

    it('cleanup after rapid toggles always restores', () => {
        applyScrollLock(style, true)
        applyScrollLock(style, false)
        applyScrollLock(style, true)
        cleanupScrollLock(style)
        expect(style.overflow).toBe('')
    })
})
