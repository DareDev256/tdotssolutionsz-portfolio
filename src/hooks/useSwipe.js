import { useRef } from 'react'

/**
 * useSwipe — Lightweight horizontal swipe gesture detection for mobile navigation.
 *
 * Returns `onTouchStart` and `onTouchEnd` handlers to spread onto a container.
 * A swipe is registered when the horizontal distance exceeds 50px — this
 * threshold prevents accidental triggers from vertical scrolling or taps while
 * still being reachable with a deliberate thumb swipe.
 *
 * @param {function} onLeft - Called on left swipe (finger moves right-to-left)
 * @param {function} onRight - Called on right swipe (finger moves left-to-right)
 * @returns {{ onTouchStart: function, onTouchEnd: function }}
 */
export default function useSwipe(onLeft, onRight) {
    const start = useRef(null)
    return {
        onTouchStart: (e) => { start.current = e.touches[0].clientX },
        onTouchEnd: (e) => {
            if (start.current === null || !e.changedTouches?.length) return
            const diff = start.current - e.changedTouches[0].clientX
            // 50px threshold — wide enough to avoid false positives from scroll jitter
            if (Math.abs(diff) > 50) diff > 0 ? onLeft?.() : onRight?.()
            start.current = null
        }
    }
}
