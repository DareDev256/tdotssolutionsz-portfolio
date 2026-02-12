import { useState, useMemo, useCallback } from 'react'
import { VIDEOS, ALL_ARTISTS, ARTIST_STATS } from '../utils/videoData'

/**
 * Lightweight fuzzy substring matching — scores how well `query` matches `text`.
 * Returns 0 (no match) to 1 (perfect match). Handles typos by checking if
 * all query chars appear in order within the text (subsequence match).
 */
function fuzzyScore(query, text) {
    if (!query || !text) return 0
    const q = query.toLowerCase()
    const t = text.toLowerCase()

    // Exact substring → highest score
    if (t.includes(q)) return 1

    // Subsequence match: every char of query appears in order in text
    let qi = 0
    let consecutive = 0
    let maxConsecutive = 0
    let prevIdx = -2

    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            consecutive = (ti === prevIdx + 1) ? consecutive + 1 : 1
            maxConsecutive = Math.max(maxConsecutive, consecutive)
            prevIdx = ti
            qi++
        }
    }

    if (qi < q.length) return 0 // not all chars matched

    // Score based on: coverage (query length / text length) + consecutive bonus
    const coverage = q.length / t.length
    const consecutiveBonus = maxConsecutive / q.length
    return 0.3 + (coverage * 0.35) + (consecutiveBonus * 0.35)
}

/**
 * Search across artists and video titles with fuzzy matching.
 * Returns { artists: [...], videos: [...] } ranked by relevance.
 */
function searchAll(query) {
    if (!query || query.length < 2) return { artists: [], videos: [] }

    const artistResults = ALL_ARTISTS
        .map(artist => ({ artist, score: fuzzyScore(query, artist) }))
        .filter(r => r.score > 0)
        .sort((a, b) => {
            // Primary: score, secondary: total views (popular artists first)
            if (b.score !== a.score) return b.score - a.score
            return (ARTIST_STATS[b.artist]?.totalViews || 0) - (ARTIST_STATS[a.artist]?.totalViews || 0)
        })
        .map(r => r.artist)

    const videoResults = VIDEOS
        .map(video => {
            const titleScore = fuzzyScore(query, video.title)
            const artistScore = fuzzyScore(query, video.artist) * 0.8 // slight penalty so title matches rank higher
            return { video, score: Math.max(titleScore, artistScore) }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score
            return b.video.viewCount - a.video.viewCount
        })
        .slice(0, 8) // cap video results for UI clarity
        .map(r => r.video)

    return { artists: artistResults, videos: videoResults }
}

/**
 * Hook for unified fuzzy search across artists and video titles.
 * Returns query state + memoized results split into { artists, videos }.
 */
export default function useSearch() {
    const [query, setQuery] = useState('')

    const results = useMemo(() => searchAll(query), [query])

    const clear = useCallback(() => setQuery(''), [])

    const hasResults = results.artists.length > 0 || results.videos.length > 0

    return { query, setQuery, results, clear, hasResults }
}

export { fuzzyScore, searchAll }
