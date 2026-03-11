import { useEffect } from 'react'

/**
 * Calls `handler` when a click/tap lands outside the element referenced by `ref`.
 * Listens on `mousedown` (not `click`) so it fires before focus shifts,
 * matching native dropdown/popover behaviour.
 *
 * @param {React.RefObject} ref  — container element ref
 * @param {Function} handler     — called when an outside click is detected
 * @param {boolean}  [active=true] — set false to suspend the listener
 */
export default function useOutsideClick(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return

    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handler()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [ref, handler, active])
}
