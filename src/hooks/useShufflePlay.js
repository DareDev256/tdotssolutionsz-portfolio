import { useState, useCallback, useRef } from 'react'
import { VIDEOS } from '../utils/videoData'
import { diverseShuffle } from '../utils/diverseShuffle'

/**
 * Shuffle-play hook — picks a random video from the catalog, avoiding
 * recent repeats using a sliding window (last N plays are excluded).
 *
 * Delegates to the shared `diverseShuffle` utility for the core selection
 * algorithm, ensuring consistent shuffle behavior across all shuffle surfaces.
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
        const cappedSize = Math.min(historySize, VIDEOS.length - 1)
        const idx = diverseShuffle(VIDEOS, history, cappedSize, v => v.id)
        const pick = VIDEOS[idx]

        setLastShuffle(pick)
        return pick
    }, [historySize])

    return { shufflePlay, lastShuffle }
}
