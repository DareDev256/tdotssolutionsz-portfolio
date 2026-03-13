import { useState, useCallback, useRef } from 'react'

/**
 * Culture Canvas — cinematic spotlight focus for the video grid.
 *
 * On desktop: hover triggers spotlight (with 120ms entry delay to avoid flicker).
 * On mobile: long-press (400ms) triggers spotlight; tap still opens video.
 * Clearing focus has no delay — exits instantly for responsiveness.
 *
 * @returns {{ focusedId, gridProps, cardProps }}
 */
export default function useCinematicFocus() {
    const [focusedId, setFocusedId] = useState(null)
    const entryTimer = useRef(null)
    const pressTimer = useRef(null)

    const clearTimers = () => {
        clearTimeout(entryTimer.current)
        clearTimeout(pressTimer.current)
    }

    const cardProps = useCallback((videoId) => ({
        onMouseEnter: () => {
            clearTimers()
            entryTimer.current = setTimeout(() => setFocusedId(videoId), 120)
        },
        onMouseLeave: () => {
            clearTimers()
            setFocusedId(null)
        },
        onTouchStart: () => {
            clearTimers()
            pressTimer.current = setTimeout(() => setFocusedId(videoId), 400)
        },
        onTouchEnd: () => {
            clearTimers()
            // Don't clear focus on touch end — let tap-away or next press handle it
        },
        'data-canvas-id': videoId,
        'data-canvas-lit': focusedId === videoId ? '' : undefined,
    }), [focusedId])

    const gridProps = {
        className: focusedId != null ? ' canvas-active' : '',
        onMouseLeave: () => { clearTimers(); setFocusedId(null) },
        onTouchStart: (e) => {
            // Tap outside a card clears spotlight
            if (!e.target.closest('[data-canvas-id]')) {
                clearTimers()
                setFocusedId(null)
            }
        },
    }

    return { focusedId, gridProps, cardProps }
}
