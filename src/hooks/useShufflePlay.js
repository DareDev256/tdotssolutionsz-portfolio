import { useState, useCallback, useRef } from 'react'
import { VIDEOS } from '../utils/videoData'

/**
 * Shuffle-play hook — picks a random video from the catalog, avoiding
 * recent repeats using a sliding window (last N plays are excluded).
 *
 * Uses Fisher-Yates–style random selection with a history buffer to
 * ensure users discover new content rather than seeing the same videos.
 *
 * @param {number} [historySize=10] - How many recent picks to exclude
 * @returns {{ shufflePlay: () => Object, lastShuffle: Object|null }}
 */
export default function useShufflePlay(historySize = 10) {
    const [lastShuffle, setLastShuffle] = useState(null)
    const historyRef = useRef([])

    const shufflePlay = useCallback(() => {
        if (VIDEOS.length === 0) return null

        const history = historyRef.current
        const historySet = new Set(history)
        const candidates = VIDEOS.filter(v => !historySet.has(v.id))

        // If all videos exhausted, reset history but keep current
        const pool = candidates.length > 0 ? candidates : VIDEOS
        const pick = pool[Math.floor(Math.random() * pool.length)]

        // Maintain sliding window
        history.push(pick.id)
        if (history.length > Math.min(historySize, VIDEOS.length - 1)) {
            history.shift()
        }

        setLastShuffle(pick)
        return pick
    }, [historySize])

    return { shufflePlay, lastShuffle }
}
