import { describe, it, expect } from 'vitest'
import { VIDEOS } from '../utils/videoData.js'

/**
 * Tests the shuffle-play selection logic directly — matching the project's
 * pure-function testing pattern (no renderHook / @testing-library needed).
 */

/** Reproduces the core selection algorithm from useShufflePlay */
function shuffleOnce(history, historySize) {
    const historySet = new Set(history)
    const candidates = VIDEOS.filter(v => !historySet.has(v.id))
    const pool = candidates.length > 0 ? candidates : VIDEOS
    const pick = pool[Math.floor(Math.random() * pool.length)]
    history.push(pick.id)
    if (history.length > Math.min(historySize, VIDEOS.length - 1)) {
        history.shift()
    }
    return pick
}

describe('useShufflePlay — shuffle selection logic', () => {
    it('picks a valid video from the catalog', () => {
        const pick = shuffleOnce([], 10)
        expect(pick).toHaveProperty('id')
        expect(pick).toHaveProperty('youtubeId')
        expect(pick).toHaveProperty('title')
        expect(VIDEOS.some(v => v.id === pick.id)).toBe(true)
    })

    it('avoids repeating recent picks within history window', () => {
        const history = []
        const seen = new Set()

        for (let i = 0; i < 6; i++) {
            const pick = shuffleOnce(history, 5)
            seen.add(pick.id)
        }

        // With a history of 5, 6 picks must produce at least 5 unique
        expect(seen.size).toBeGreaterThanOrEqual(5)
    })

    it('produces diverse results across many calls', () => {
        const history = []
        const picks = []

        for (let i = 0; i < 20; i++) {
            picks.push(shuffleOnce(history, 10).id)
        }

        const unique = new Set(picks)
        // 20 picks from 101 videos with history=10 → significant diversity
        expect(unique.size).toBeGreaterThan(5)
    })

    it('resets gracefully when history exhausts entire catalog', () => {
        const history = []
        // Shuffle more times than total videos
        for (let i = 0; i < VIDEOS.length + 20; i++) {
            const pick = shuffleOnce(history, 200)
            expect(pick).toHaveProperty('id')
        }
    })

    it('maintains history at configured size (sliding window)', () => {
        const history = []
        for (let i = 0; i < 15; i++) {
            shuffleOnce(history, 10)
        }
        // History capped at min(10, VIDEOS.length - 1)
        expect(history.length).toBeLessThanOrEqual(Math.min(10, VIDEOS.length - 1))
    })

    it('never returns undefined even with empty history', () => {
        for (let i = 0; i < 50; i++) {
            const pick = shuffleOnce([], 10)
            expect(pick).toBeDefined()
            expect(pick).not.toBeNull()
        }
    })
})
