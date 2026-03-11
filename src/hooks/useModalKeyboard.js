import { useEffect } from 'react'

/**
 * Keyboard handler for modal/overlay components.
 * Binds Escape → onClose, ArrowLeft → onPrev, ArrowRight → onNext.
 *
 * All callbacks are optional — pass only what applies:
 *   useModalKeyboard({ onClose })                         // escape-only
 *   useModalKeyboard({ onClose, onPrev, onNext })         // full nav
 *   useModalKeyboard({ onClose }, isOpen)                  // gated
 *
 * @param {Object}  handlers
 * @param {Function} [handlers.onClose] — called on Escape
 * @param {Function} [handlers.onPrev]  — called on ArrowLeft
 * @param {Function} [handlers.onNext]  — called on ArrowRight
 * @param {boolean}  [active=true] — set false to suspend the listener
 */
export default function useModalKeyboard({ onClose, onPrev, onNext } = {}, active = true) {
  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose?.()
          break
        case 'ArrowLeft':
          onPrev?.()
          break
        case 'ArrowRight':
          onNext?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext, active])
}
