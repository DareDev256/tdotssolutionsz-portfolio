import { VIDEOS, ALL_ARTISTS, ARTIST_STATS } from './videoData'

/**
 * Lightweight fuzzy substring matching — scores how well `query` matches `text`.
 * Returns 0 (no match) to 1 (perfect match). Handles typos by checking if
 * all query chars appear in order within the text (subsequence match).
 */
export function fuzzyScore(query, text) {
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

    // Scoring formula breakdown:
    //   0.30 = base floor — any subsequence match gets at least 0.3 (ensures it
    //          ranks above 0 but well below exact substring matches which score 1.0)
    //   0.35 × coverage — rewards shorter texts (query "drake" in "Drake" = 1.0
    //          coverage vs in "Drake ft. Future" = 0.33 coverage)
    //   0.35 × consecutiveBonus — rewards matches where query chars appear in runs
    //          (typing "dra" matching "Dra-ke" consecutively scores higher than
    //          "D...r...a" scattered across the text)
    // Max possible: 0.3 + 0.35 + 0.35 = 1.0 (but only exact substrings hit 1.0)
    const coverage = q.length / t.length
    const consecutiveBonus = maxConsecutive / q.length
    return 0.3 + (coverage * 0.35) + (consecutiveBonus * 0.35)
}

/** Hard cap on query length to prevent performance abuse via long fuzzy inputs */
export const MAX_QUERY_LENGTH = 100

/**
 * Strip control characters (C0/C1), zero-width Unicode, and null bytes from
 * search input. These characters can bypass fuzzy matching, cause display
 * corruption in rendered results, or exploit text-processing edge cases.
 * Preserves all printable Unicode (letters, numbers, punctuation, emoji).
 */
export const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\uFEFF\uFFF0-\uFFFF]/g

export function sanitizeSearchInput(raw) {
    if (!raw || typeof raw !== 'string') return ''
    return raw.replace(CONTROL_CHAR_RE, '').slice(0, MAX_QUERY_LENGTH)
}

/**
 * Search across artists and video titles with fuzzy matching.
 * Returns { artists: [...], videos: [...] } ranked by relevance.
 * Sanitizes control characters and truncates beyond MAX_QUERY_LENGTH.
 */
export function searchAll(rawQuery) {
    const query = sanitizeSearchInput(rawQuery)
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
