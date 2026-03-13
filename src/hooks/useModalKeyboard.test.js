import { describe, it, expect, vi } from 'vitest'

/**
 * useModalKeyboard test suite — validates the shared keyboard handler
 * extracted in v3.33.0 that powers TheaterMode, ArtistPanel, PhotoGallery
 * Lightbox, and SearchBar.
 *
 * Follows the project's pure-function extraction pattern: we replicate
 * the hook's keydown dispatch logic and test every decision edge without jsdom.
 */

/**
 * Replicates useModalKeyboard's internal keydown handler logic.
 * The real hook wires this to window via useEffect — here we test
 * the dispatch decisions in isolation.
 */
function createKeyboardHandler({ onClose, onPrev, onNext } = {}, active = true) {
  const dispatch = active
    ? (key) => {
        switch (key) {
          case 'Escape':    onClose?.(); break
          case 'ArrowLeft': onPrev?.();  break
          case 'ArrowRight': onNext?.(); break
        }
      }
    : null

  return {
    press(key) { dispatch?.(key) },
    get isListening() { return dispatch !== null },
  }
}

describe('useModalKeyboard keyboard dispatch', () => {
  it('dispatches Escape to onClose', () => {
    const onClose = vi.fn()
    const kb = createKeyboardHandler({ onClose })
    kb.press('Escape')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('dispatches ArrowLeft to onPrev', () => {
    const onPrev = vi.fn()
    const kb = createKeyboardHandler({ onPrev })
    kb.press('ArrowLeft')
    expect(onPrev).toHaveBeenCalledOnce()
  })

  it('dispatches ArrowRight to onNext', () => {
    const onNext = vi.fn()
    const kb = createKeyboardHandler({ onNext })
    kb.press('ArrowRight')
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('ignores unrecognized keys — no callbacks fired', () => {
    const onClose = vi.fn()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const kb = createKeyboardHandler({ onClose, onPrev, onNext })
    kb.press('Enter')
    kb.press('Tab')
    kb.press('a')
    kb.press(' ')
    expect(onClose).not.toHaveBeenCalled()
    expect(onPrev).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('tolerates missing onPrev/onNext — Escape-only usage (ArtistPanel pattern)', () => {
    const onClose = vi.fn()
    const kb = createKeyboardHandler({ onClose })
    expect(() => kb.press('ArrowLeft')).not.toThrow()
    expect(() => kb.press('ArrowRight')).not.toThrow()
    kb.press('Escape')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('tolerates missing onClose — nav-only usage', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const kb = createKeyboardHandler({ onPrev, onNext })
    expect(() => kb.press('Escape')).not.toThrow()
    expect(onPrev).not.toHaveBeenCalled()
  })

  it('tolerates empty handlers object', () => {
    const kb = createKeyboardHandler({})
    expect(() => {
      kb.press('Escape')
      kb.press('ArrowLeft')
      kb.press('ArrowRight')
    }).not.toThrow()
  })

  it('tolerates no arguments — default params', () => {
    const kb = createKeyboardHandler()
    expect(kb.isListening).toBe(true)
    expect(() => kb.press('Escape')).not.toThrow()
  })

  it('does NOT dispatch when active is false', () => {
    const onClose = vi.fn()
    const kb = createKeyboardHandler({ onClose }, false)
    kb.press('Escape')
    expect(onClose).not.toHaveBeenCalled()
    expect(kb.isListening).toBe(false)
  })

  it('handles rapid sequential presses with correct counts', () => {
    const onClose = vi.fn()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const kb = createKeyboardHandler({ onClose, onPrev, onNext })
    kb.press('ArrowLeft')
    kb.press('ArrowLeft')
    kb.press('ArrowRight')
    kb.press('Escape')
    kb.press('ArrowLeft')
    expect(onPrev).toHaveBeenCalledTimes(3)
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('each key maps to exactly one callback — no cross-triggering', () => {
    const onClose = vi.fn()
    const onPrev = vi.fn()
    const onNext = vi.fn()
    const kb = createKeyboardHandler({ onClose, onPrev, onNext })
    kb.press('Escape')
    expect(onClose).toHaveBeenCalledOnce()
    expect(onPrev).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })
})
