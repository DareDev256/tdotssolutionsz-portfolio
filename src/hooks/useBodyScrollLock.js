import { useEffect } from 'react'

/**
 * Lock `document.body` scroll when a condition is true.
 * Restores overflow on unmount or when the condition flips to false.
 *
 * @param {boolean} isLocked - Whether to lock body scroll
 */
export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isLocked])
}
