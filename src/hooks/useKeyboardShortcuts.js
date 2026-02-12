import { useEffect } from 'react'

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA'])

/**
 * Register multiple keyboard shortcuts with a single listener.
 * Shortcuts are ignored when focus is on form inputs.
 *
 * @param {Record<string, () => void>} keyMap - Map of keys to handler functions.
 *   Keys are case-insensitive single characters (e.g. 'f', 's', '?').
 * @param {Array} deps - Extra dependency array merged with handlers.
 */
export default function useKeyboardShortcuts(keyMap, deps = []) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (INPUT_TAGS.has(e.target.tagName)) return

            const handler = keyMap[e.key] || keyMap[e.key.toLowerCase()]
            if (handler) handler(e)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
}
