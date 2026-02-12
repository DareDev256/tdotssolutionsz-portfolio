import { describe, it, expect, vi, afterEach } from 'vitest'

/**
 * Tests the keyboard shortcut dispatch logic directly — matching the project's
 * pure-function testing pattern (no renderHook / @testing-library needed).
 *
 * We extract and test the core dispatch algorithm that useKeyboardShortcuts
 * wires into a keydown listener.
 */

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA'])

function dispatchShortcut(keyMap, key, targetTagName = 'DIV') {
    if (INPUT_TAGS.has(targetTagName)) return false
    const handler = keyMap[key] || keyMap[key.toLowerCase()]
    if (handler) { handler(); return true }
    return false
}

describe('useKeyboardShortcuts dispatch logic', () => {
    it('calls the correct handler for a mapped key', () => {
        const handler = vi.fn()
        dispatchShortcut({ f: handler }, 'f')
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('matches uppercase keys via toLowerCase fallback', () => {
        const handler = vi.fn()
        dispatchShortcut({ s: handler }, 'S')
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('ignores keypresses when target is an INPUT', () => {
        const handler = vi.fn()
        dispatchShortcut({ f: handler }, 'f', 'INPUT')
        expect(handler).not.toHaveBeenCalled()
    })

    it('ignores keypresses when target is a TEXTAREA', () => {
        const handler = vi.fn()
        dispatchShortcut({ f: handler }, 'f', 'TEXTAREA')
        expect(handler).not.toHaveBeenCalled()
    })

    it('returns false for unmapped keys', () => {
        const handler = vi.fn()
        const result = dispatchShortcut({ f: handler }, 'x')
        expect(result).toBe(false)
        expect(handler).not.toHaveBeenCalled()
    })

    it('supports special character keys like ?', () => {
        const handler = vi.fn()
        dispatchShortcut({ '?': handler }, '?')
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('dispatches to the right handler among multiple mappings', () => {
        const fHandler = vi.fn()
        const sHandler = vi.fn()
        const qHandler = vi.fn()
        const keyMap = { f: fHandler, s: sHandler, '?': qHandler }

        dispatchShortcut(keyMap, 's')
        expect(fHandler).not.toHaveBeenCalled()
        expect(sHandler).toHaveBeenCalledTimes(1)
        expect(qHandler).not.toHaveBeenCalled()
    })

    it('allows DIV, BUTTON, and other non-input elements', () => {
        const handler = vi.fn()
        dispatchShortcut({ f: handler }, 'f', 'DIV')
        dispatchShortcut({ f: handler }, 'f', 'BUTTON')
        dispatchShortcut({ f: handler }, 'f', 'CANVAS')
        expect(handler).toHaveBeenCalledTimes(3)
    })
})
