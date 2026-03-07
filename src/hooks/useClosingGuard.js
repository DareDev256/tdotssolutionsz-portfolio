import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * useClosingGuard — Prevents race conditions between closing animations and user re-open actions.
 *
 * Problem: When a panel/modal has a CSS close animation (e.g. 300ms slide-out), the React state
 * flips to "closed" immediately, but the DOM element is still animating. If the user re-opens
 * during that gap, the new open fights with the pending close — causing visual glitches or
 * the panel being removed mid-display.
 *
 * Solution: Introduces a `closing` phase that blocks `open()` calls until the animation duration
 * elapses. Returns `isVisible` (render gate) and `isClosing` (CSS class gate) so the component
 * can play its exit animation before unmounting.
 *
 * @param {number} duration - Close animation duration in ms (match your CSS transition)
 * @returns {{ isOpen: boolean, isClosing: boolean, isVisible: boolean, open: () => void, close: () => void }}
 */
export default function useClosingGuard(duration = 300) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closingTimerRef = useRef(null)

  const open = useCallback(() => {
    // If currently closing, cancel the pending close and snap open
    if (closingTimerRef.current) {
      clearTimeout(closingTimerRef.current)
      closingTimerRef.current = null
    }
    setIsClosing(false)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    // Already closed or already closing — no-op (prevents double-close)
    if (!isOpen || isClosing) return

    setIsClosing(true)
    closingTimerRef.current = setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      closingTimerRef.current = null
    }, duration)
  }, [isOpen, isClosing, duration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current)
    }
  }, [])

  return {
    isOpen,
    isClosing,
    // isVisible = true during both open AND closing phases (so the DOM stays for the exit animation)
    isVisible: isOpen,
    open,
    close,
  }
}
