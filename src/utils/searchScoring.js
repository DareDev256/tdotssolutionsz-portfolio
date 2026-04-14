import { VIDEOS, ALL_ARTISTS, ARTIST_STATS } from './videoData'
import { CONTROL_CHAR_UNICODE_RE } from './securityConstants.js'

/**
 * Epsilon for floating-point score comparisons. Scores within this threshold
 * are treated as equal, allowing the popularity tiebreaker to activate.
 * Without this, IEEE 754 rounding means nearly-identical scores (e.g.
 * 0.90 + 3/7*0.10 vs 0.90 + 5/12*0.10) can differ by ~1e-16, causing
 * the sort to treat them as meaningfully different and skip the tiebreaker.
 */
export const SCORE_EPSILON = 1e-9

// ── Scoring constants ─────────────────────────────────────────────
// Exported so tests verify behaviour against the same constants
// rather than duplicating magic numbers in every assertion.
/** Base score for a prefix substring match (query starts the text). */
export const PREFIX_BASE = 0.90
/** Base score for a mid-string substring match (query found, not at start). */
export const MID_BASE = 0.80
/** Coverage multiplier applied on top of PREFIX_BASE / MID_BASE. */
export const SUBSTRING_COVERAGE_WEIGHT = 0.10
/** Base floor for subsequence-only matches (chars in order, not contiguous). */
export const SUBSEQUENCE_BASE = 0.30
/** Weight of query/text length coverage in subsequence scoring. */
export const COVERAGE_WEIGHT = 0.35
/** Weight of longest consecutive char run in subsequence scoring. */
export const CONSECUTIVE_WEIGHT = 0.35
/** Penalty applied to artist-field matches so title hits rank higher. */
export const ARTIST_MATCH_PENALTY = 0.8
/** Maximum video results returned by searchAll for UI clarity. */
export const VIDEO_RESULTS_CAP = 8

/**
 * Lightweight fuzzy substring matching — scores how well `query` matches `text`.
 * Returns 0 (no match) to 1 (perfect match). Handles typos by checking if
 * all query chars appear in order within the text (subsequence match).
 */
export function fuzzyScore(query, text) {
    if (!query || !text) return 0
    const q = query.toLowerCase()
    const t = text.toLowerCase()

    // Exact match → perfect score
    if (q === t) return 1

    // Substring match → score by position and coverage
    // Prefix matches rank higher than mid-string matches;
    // higher coverage (query fills more of the text) ranks higher too.
    const subIdx = t.indexOf(q)
    if (subIdx !== -1) {
        const coverage = q.length / t.length
        // prefix: PREFIX_BASE–1.0  |  mid-string: MID_BASE–PREFIX_BASE
        const base = subIdx === 0 ? PREFIX_BASE : MID_BASE
        return base + coverage * SUBSTRING_COVERAGE_WEIGHT
    }

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
    const raw = SUBSEQUENCE_BASE + (coverage * COVERAGE_WEIGHT) + (consecutiveBonus * CONSECUTIVE_WEIGHT)
    // Cap subsequence scores below MID_BASE to preserve the ranking hierarchy:
    // exact (1.0) > prefix (≥0.90) > mid-string (≥0.80) > subsequence (<0.80)
    // Without this cap, high-coverage + high-consecutive subsequences (e.g.
    // "abcd" in "aXbcd" = 0.8425) can outrank legitimate substring matches.
    return Math.min(raw, MID_BASE - SCORE_EPSILON)
}

/** Hard cap on query length to prevent performance abuse via long fuzzy inputs */
export const MAX_QUERY_LENGTH = 100

/**
 * Strip control characters (C0/C1), zero-width Unicode, and null bytes from
 * search input. These characters can bypass fuzzy matching, cause display
 * corruption in rendered results, or exploit text-processing edge cases.
 * Preserves all printable Unicode (letters, numbers, punctuation, emoji).
 */
export function sanitizeSearchInput(raw) {
    if (!raw || typeof raw !== 'string') return ''
    return raw.replace(CONTROL_CHAR_UNICODE_RE, '').slice(0, MAX_QUERY_LENGTH)
}

/**
 * Build an epsilon-bucketed sort comparator. Scores within SCORE_EPSILON
 * are treated as equal, falling through to the `tiebreaker` function.
 * This prevents IEEE 754 rounding noise (~1e-16) from overriding
 * meaningful popularity-based ordering.
 * @param {(a: T, b: T) => number} tiebreaker  Secondary sort when scores tie
 * @returns {(a: {score:number}, b: {score:number}) => number}
 */
export function epsilonSortBy(tiebreaker) {
    return (a, b) => {
        const diff = b.score - a.score
        return Math.abs(diff) > SCORE_EPSILON ? diff : tiebreaker(a, b)
    }
}

/** Artist popularity tiebreaker — higher total views first */
const artistTiebreaker = (a, b) =>
    (ARTIST_STATS[b.artist]?.totalViews || 0) - (ARTIST_STATS[a.artist]?.totalViews || 0)

/** Video popularity tiebreaker — higher view count first */
const videoTiebreaker = (a, b) => b.video.viewCount - a.video.viewCount

/**
 * Generic score → rank → extract pipeline. Scores every item, discards
 * non-matches, sorts with epsilon-bucketed tiebreaking, optionally caps
 * the result count, then extracts the final value via `extract`.
 *
 * Both artist and video search branches were duplicating this exact
 * sequence. Centralising it means adding a new searchable field (e.g.
 * tags, album names) is a single `scoredRank()` call instead of
 * another copy-pasted map→filter→sort→slice→map chain.
 *
 * @template T, R
 * @param {T[]}              items       Source collection
 * @param {(item: T) => {scored: object, score: number}} scorer  Produce a scored wrapper
 * @param {(a: any, b: any) => number} tiebreaker  Secondary sort
 * @param {(wrapper: any) => R}         extract     Unwrap the final value
 * @param {number}           [limit]     Optional result cap
 * @returns {R[]}
 */
export function scoredRank(items, scorer, tiebreaker, extract, limit) {
    const ranked = items
        .map(scorer)
        .filter(r => r.score > 0)
        .sort(epsilonSortBy(tiebreaker))
    return (limit != null ? ranked.slice(0, limit) : ranked).map(extract)
}

/**
 * Search across artists and video titles with fuzzy matching.
 * Returns { artists: [...], videos: [...] } ranked by relevance.
 * Sanitizes control characters and truncates beyond MAX_QUERY_LENGTH.
 */
export function searchAll(rawQuery) {
    const query = sanitizeSearchInput(rawQuery)
    if (!query || query.length < 2) return { artists: [], videos: [] }

    const artists = scoredRank(
        ALL_ARTISTS,
        artist => ({ artist, score: fuzzyScore(query, artist) }),
        artistTiebreaker,
        r => r.artist,
    )

    const videos = scoredRank(
        VIDEOS,
        video => {
            const titleScore = fuzzyScore(query, video.title)
            const artistScore = fuzzyScore(query, video.artist) * ARTIST_MATCH_PENALTY
            return { video, score: Math.max(titleScore, artistScore) }
        },
        videoTiebreaker,
        r => r.video,
        VIDEO_RESULTS_CAP,
    )

    return { artists, videos }
}
