import { describe, it, expect, vi } from 'vitest'

/**
 * useOutsideClick test suite — validates the click-outside-to-dismiss hook
 * extracted in v3.33.0, used by SearchBar and available to all overlays.
 *
 * Follows the project's pure-function extraction pattern: we replicate
 * the hook's contains-check logic and test every boundary without jsdom.
 */

/**
 * Replicates useOutsideClick's internal mousedown handler logic.
 * The real hook uses ref.current.contains(e.target) against real DOM —
 * here we simulate the contains() contract with a Set of "inside" targets.
 */
function createOutsideClickHandler(insideTargets, handler, active = true) {
  if (!active) return { click: () => {}, isListening: false }

  const insideSet = new Set(insideTargets)
  return {
    /** Simulate a mousedown on a target */
    click(target) {
      // Mirror the hook: ref.current && !ref.current.contains(e.target)
      // Here insideSet acts as the ref container's contains() result
      if (insideSet.size > 0 && !insideSet.has(target)) {
        handler()
      }
    },
    get isListening() { return true },
  }
}

/**
 * Higher-fidelity test: replicates the exact ref.current?.contains() guard
 * including the null-ref edge case.
 */
function createRefHandler(refCurrent, handler, active = true) {
  if (!active) return { click: () => {}, isListening: false }

  return {
    click(target, isContained) {
      if (refCurrent !== null && !isContained) {
        handler()
      }
    },
    get isListening() { return true },
  }
}

describe('useOutsideClick contains-check logic', () => {
  it('calls handler when target is outside the ref container', () => {
    const handler = vi.fn()
    const oc = createOutsideClickHandler(['panel', 'panel-child'], handler)
    oc.click('body') // not in the set = outside
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does NOT call handler when target is inside the ref container', () => {
    const handler = vi.fn()
    const oc = createOutsideClickHandler(['panel', 'panel-child'], handler)
    oc.click('panel')
    expect(handler).not.toHaveBeenCalled()
  })

  it('does NOT call handler when target is a child of the container', () => {
    const handler = vi.fn()
    const oc = createOutsideClickHandler(['panel', 'close-btn', 'label'], handler)
    oc.click('close-btn')
    expect(handler).not.toHaveBeenCalled()
    oc.click('label')
    expect(handler).not.toHaveBeenCalled()
  })

  it('does NOT attach when active is false', () => {
    const handler = vi.fn()
    const oc = createOutsideClickHandler(['panel'], handler, false)
    oc.click('body')
    expect(handler).not.toHaveBeenCalled()
    expect(oc.isListening).toBe(false)
  })

  it('distinguishes sibling elements correctly', () => {
    const handler = vi.fn()
    const oc = createOutsideClickHandler(['dropdown'], handler)
    oc.click('toolbar') // sibling = outside
    expect(handler).toHaveBeenCalledOnce()
  })

  it('multiple outside clicks each trigger the handler', () => {
    const handler = vi.fn()
    const oc = createOutsideClickHandler(['panel'], handler)
    oc.click('body')
    oc.click('header')
    oc.click('footer')
    expect(handler).toHaveBeenCalledTimes(3)
  })
})

describe('useOutsideClick null-ref guard', () => {
  it('does NOT call handler when ref.current is null (unmounted)', () => {
    const handler = vi.fn()
    const oc = createRefHandler(null, handler)
    oc.click('body', false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler when ref.current exists and target is outside', () => {
    const handler = vi.fn()
    const oc = createRefHandler('div#panel', handler)
    oc.click('body', false) // isContained = false → outside
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does NOT call handler when target is contained', () => {
    const handler = vi.fn()
    const oc = createRefHandler('div#panel', handler)
    oc.click('span.child', true) // isContained = true → inside
    expect(handler).not.toHaveBeenCalled()
  })
})
