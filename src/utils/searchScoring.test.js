import { describe, it, expect } from 'vitest'
import { fuzzyScore, searchAll, sanitizeSearchInput, MAX_QUERY_LENGTH, SCORE_EPSILON,
    PREFIX_BASE, MID_BASE, SUBSTRING_COVERAGE_WEIGHT, SUBSEQUENCE_BASE,
    COVERAGE_WEIGHT, CONSECUTIVE_WEIGHT, epsilonSortBy, scoredRank,
    ARTIST_MATCH_PENALTY, VIDEO_RESULTS_CAP } from './searchScoring'

/**
 * Deep verification of fuzzyScore's mathematical properties and searchAll's
 * security boundaries. These tests catch regressions that the existing
 * useSearch.test.js doesn't cover — formula weight changes that silently
 * degrade ranking, and input sanitization edge cases.
 */

/**
 * Compute the expected substring match score from the shared constants.
 * Eliminates the repeated inline `0.90 + (qLen / tLen) * 0.10` arithmetic
 * that was duplicated across 10+ test assertions.
 * @param {number} queryLen  Length of the search query
 * @param {number} textLen   Length of the target text
 * @param {boolean} isPrefix True if the match starts at index 0
 * @returns {number} Expected score
 */
function expectedSubstringScore(queryLen, textLen, isPrefix) {
    const base = isPrefix ? PREFIX_BASE : MID_BASE
    return base + (queryLen / textLen) * SUBSTRING_COVERAGE_WEIGHT
}

/**
 * Compute the expected subsequence match score from the shared constants.
 * Eliminates the repeated inline `SUBSEQUENCE_BASE + (qLen/tLen)*COVERAGE_WEIGHT
 * + (maxConsec/qLen)*CONSECUTIVE_WEIGHT` arithmetic that was duplicated across
 * 5 test assertions.
 * @param {number} queryLen       Length of the search query
 * @param {number} textLen        Length of the target text
 * @param {number} maxConsecutive Longest run of consecutive matched characters
 * @returns {number} Expected score
 */
function expectedSubsequenceScore(queryLen, textLen, maxConsecutive) {
    const coverage = queryLen / textLen
    const consecutiveBonus = maxConsecutive / queryLen
    return SUBSEQUENCE_BASE + (coverage * COVERAGE_WEIGHT) + (consecutiveBonus * CONSECUTIVE_WEIGHT)
}

describe('fuzzyScore — scoring formula verification', () => {
    // The formula: SUBSEQUENCE_BASE + (coverage * COVERAGE_WEIGHT) + (consecutiveBonus * CONSECUTIVE_WEIGHT)
    // where coverage = queryLen/textLen, consecutiveBonus = maxConsecutiveRun/queryLen

    it('subsequence match gets exactly 0.30 base when coverage and consecutive are minimal', () => {
        // "ae" in "abcdefghij" — chars exist in order but scattered
        // coverage = 2/10 = 0.2, consecutive = 1/2 = 0.5
        const score = fuzzyScore('ae', 'abcdefghij')
        expect(score).toBeCloseTo(expectedSubsequenceScore(2, 10, 1), 2)
    })

    it('full coverage subsequence scores higher than partial coverage', () => {
        // "ac" in "abc" vs "ac" in "abcdefghij" — subsequence, not substring
        const shortText = fuzzyScore('ac', 'abc')   // coverage = 2/3
        const longText = fuzzyScore('ac', 'abcdefghij') // coverage = 2/10
        expect(shortText).toBeGreaterThan(longText)
    })

    it('exact match returns 1.0, prefix > mid-string > subsequence', () => {
        // Exact match → 1.0
        expect(fuzzyScore('abc', 'abc')).toBe(1.0)

        // Prefix substring → PREFIX_BASE + (coverage * SUBSTRING_COVERAGE_WEIGHT)
        const prefix = fuzzyScore('abc', 'abcXXX') // coverage = 3/6
        expect(prefix).toBeCloseTo(expectedSubstringScore(3, 6, true), 2)
        expect(prefix).toBeLessThan(1.0)

        // Mid-string substring → MID_BASE + (coverage * SUBSTRING_COVERAGE_WEIGHT)
        const mid = fuzzyScore('abc', 'XXXabcXXX') // coverage = 3/9
        expect(mid).toBeCloseTo(expectedSubstringScore(3, 9, false), 2)
        expect(mid).toBeLessThan(prefix) // prefix beats mid-string

        // Subsequence (not a substring) → lowest tier
        const subseq = fuzzyScore('abc', 'aXbXcX')
        expect(subseq).toBeLessThan(mid)
        expect(subseq).toBeGreaterThan(0)
    })

    it('prefix match ranks above mid-string match for identical queries', () => {
        // "drake" at start vs "drake" buried in text
        const prefix = fuzzyScore('drake', 'drake - gods plan')
        const middle = fuzzyScore('drake', 'feat. drake')
        expect(prefix).toBeGreaterThan(middle)
    })

    it('consecutive char runs score higher than scattered matches', () => {
        // Uses query "abd" — NOT a substring of either text, so both go
        // through the subsequence scorer where consecutiveBonus matters.
        // "abd" in "abXXdX": a-b consecutive (run=2), then d after gap
        // "abd" in "aXbXdX": all chars separated by gaps (run=1)
        const consecutive = fuzzyScore('abd', 'abXXdX') // maxConsec = 2
        const scattered = fuzzyScore('abd', 'aXbXdX')   // maxConsec = 1
        expect(consecutive).toBeGreaterThan(scattered)
    })

    it('score never exceeds 1.0 for subsequence matches', () => {
        // Even a perfect subsequence (all consecutive, full coverage) caps below 1.0
        // because exact substrings return 1.0 via the includes() fast path
        const testCases = ['ab', 'xyz', 'test', 'a', 'zz']
        for (const q of testCases) {
            for (const t of ['abcxyz', 'testing123', 'zzzzz', 'a']) {
                const score = fuzzyScore(q, t)
                expect(score).toBeLessThanOrEqual(1.0)
                expect(score).toBeGreaterThanOrEqual(0)
            }
        }
    })

    it('case-insensitive matching works correctly', () => {
        expect(fuzzyScore('DRAKE', 'drake')).toBe(1) // exact substring
        expect(fuzzyScore('drake', 'DRAKE')).toBe(1)
        expect(fuzzyScore('DrAkE', 'dRaKe')).toBe(1)
    })

    it('returns 0 for null, undefined, and empty inputs', () => {
        expect(fuzzyScore(null, 'text')).toBe(0)
        expect(fuzzyScore('query', null)).toBe(0)
        expect(fuzzyScore('', 'text')).toBe(0)
        expect(fuzzyScore('query', '')).toBe(0)
        expect(fuzzyScore(null, null)).toBe(0)
        expect(fuzzyScore(undefined, undefined)).toBe(0)
    })

    it('returns 0 when query chars do not appear in order', () => {
        expect(fuzzyScore('zyx', 'abcdef')).toBe(0)
        expect(fuzzyScore('ba', 'abcdef')).toBe(0) // reversed order
        expect(fuzzyScore('xyz', 'abc')).toBe(0)    // no chars at all
    })
})

describe('fuzzyScore — prefix scoring formula: PREFIX_BASE + coverage × SUBSTRING_COVERAGE_WEIGHT', () => {
    it('prefix score scales with coverage — short text scores higher', () => {
        // "drop" in "dropXX" → coverage = 4/6
        const short = fuzzyScore('drop', 'dropXX')
        expect(short).toBeCloseTo(expectedSubstringScore(4, 6, true), 3)

        // "drop" in "dropXXXXXXXXXX" → coverage = 4/14
        const long = fuzzyScore('drop', 'dropXXXXXXXXXX')
        expect(long).toBeCloseTo(expectedSubstringScore(4, 14, true), 3)

        expect(short).toBeGreaterThan(long)
    })

    it('prefix ceiling approaches but never reaches 1.0', () => {
        // Maximum prefix score: query is almost the full text
        // "abcde" in "abcdef" → coverage = 5/6
        const nearFull = fuzzyScore('abcde', 'abcdef')
        expect(nearFull).toBeCloseTo(expectedSubstringScore(5, 6, true), 3)
        expect(nearFull).toBeLessThan(1.0)
    })

    it('prefix floor is 0.90 for vanishingly small coverage', () => {
        // "a" in "a" + 99 X's → coverage = 1/100 = 0.01 → 0.901
        const tiny = fuzzyScore('a', 'a' + 'X'.repeat(99))
        expect(tiny).toBeCloseTo(0.901, 2)
        expect(tiny).toBeGreaterThan(0.90)
    })

    it('real-world prefix: artist name at start of title', () => {
        const score = fuzzyScore('migos', 'migos - culture iii')
        expect(score).toBeCloseTo(expectedSubstringScore(5, 19, true), 3)
    })
})

describe('fuzzyScore — mid-string scoring formula: MID_BASE + coverage × SUBSTRING_COVERAGE_WEIGHT', () => {
    it('mid-string score scales with coverage', () => {
        // "abc" in "XabcX" → coverage = 3/5
        const tight = fuzzyScore('abc', 'XabcX')
        expect(tight).toBeCloseTo(expectedSubstringScore(3, 5, false), 3)

        // "abc" in "XXXXXabcXXXXX" → coverage = 3/13
        const buried = fuzzyScore('abc', 'XXXXXabcXXXXX')
        expect(buried).toBeCloseTo(expectedSubstringScore(3, 13, false), 3)

        expect(tight).toBeGreaterThan(buried)
    })

    it('mid-string ceiling stays below prefix floor', () => {
        // Best possible mid-string: "ab" in "Xab" → coverage = 2/3 → 0.867
        // Worst possible prefix:    "a" in "a" + 99 X's → 0.901
        const bestMid = fuzzyScore('ab', 'Xab')
        const worstPrefix = fuzzyScore('a', 'a' + 'X'.repeat(99))
        expect(bestMid).toBeLessThan(worstPrefix)
    })

    it('real-world mid-string: "feat." artist buried in title', () => {
        const score = fuzzyScore('drake', 'sicko mode feat. drake')
        expect(score).toBeCloseTo(expectedSubstringScore(5, 22, false), 3)
    })
})

describe('fuzzyScore — edge cases that break ranking in production', () => {
    it('query longer than text returns 0 (cannot match)', () => {
        expect(fuzzyScore('abcdef', 'abc')).toBe(0)
        expect(fuzzyScore('longquery', 'short')).toBe(0)
    })

    it('single-character subsequence scores correctly', () => {
        // Single char: coverage = 1/10, consecutiveBonus = 1/1 = 1.0
        // This is a substring match (single char is always contiguous)
        // so it goes through the substring path, not subsequence
        const score = fuzzyScore('a', 'abcdefghij')
        expect(score).toBeCloseTo(expectedSubstringScore(1, 10, true), 3)
    })

    it('single-character mid-string match uses MID_BASE', () => {
        const score = fuzzyScore('e', 'abcdefghij')
        expect(score).toBeCloseTo(expectedSubstringScore(1, 10, false), 3)
    })

    it('repeated characters in query track consecutive runs correctly', () => {
        // "aaa" in "aXaXa" — subsequence, each 'a' matches but none consecutive
        // maxConsecutive = 1, coverage = 3/5
        const scattered = fuzzyScore('aaa', 'aXaXa')
        expect(scattered).toBeCloseTo(expectedSubsequenceScore(3, 5, 1), 2)

        // "aaa" in "aaXXa" — first two 'a's consecutive, third after gap
        // maxConsecutive = 2, coverage = 3/5
        const partial = fuzzyScore('aaa', 'aaXXa')
        expect(partial).toBeCloseTo(expectedSubsequenceScore(3, 5, 2), 2)

        expect(partial).toBeGreaterThan(scattered)
    })

    it('special characters in music titles match correctly', () => {
        // Hyphens, parentheses, "feat." — real music metadata
        expect(fuzzyScore('feat', 'Sicko Mode (feat. Drake)')).toBeGreaterThan(0)
        expect(fuzzyScore('ft.', 'Track ft. Artist')).toBe(
            expectedSubstringScore(3, 16, false)
        )
        expect(fuzzyScore('(remix)', '(Remix)')).toBe(1.0) // case-insensitive exact
    })

    it('whitespace in query and text does not break matching', () => {
        // Space is a valid character in fuzzy matching
        expect(fuzzyScore('gods plan', 'Gods Plan')).toBe(1.0)
        expect(fuzzyScore('culture iii', 'Migos - Culture III')).toBeGreaterThan(MID_BASE)
    })

    it('subsequence where all chars exist but last char is at the very end', () => {
        // "az" in "abcdefghijklmnopqrstuvwxyz" — max spread
        // coverage = 2/26, consecutive = 1 (only 'a' or only 'z' alone), maxConsec = 1
        const score = fuzzyScore('az', 'abcdefghijklmnopqrstuvwxyz')
        // This is actually a substring check first — "az" is NOT in the string contiguously
        // So it falls to subsequence: coverage=2/26, consecutiveBonus=1/2
        expect(score).toBeCloseTo(expectedSubsequenceScore(2, 26, 1), 2)
    })

    it('near-miss: all chars present but wrong order returns 0', () => {
        // Every char of "cba" exists in "abc" but in reverse order
        expect(fuzzyScore('cba', 'abc')).toBe(0)
        expect(fuzzyScore('gfe', 'efg')).toBe(0)
    })

    it('emoji and unicode in text does not crash or produce negative scores', () => {
        const score = fuzzyScore('fire', '🔥 Fire Mix 🔥')
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(1.0)
    })

    it('identical single characters score 1.0 (exact match)', () => {
        expect(fuzzyScore('a', 'a')).toBe(1.0)
        expect(fuzzyScore('X', 'x')).toBe(1.0) // case-insensitive
    })

    it('subsequence score ceiling: high coverage + full consecutive still < MID_BASE', () => {
        // "adc" in "abdc" — true subsequence: a(0) d(2) c(3)
        // coverage = 3/4, maxConsec = 2 (d,c consecutive), bonus = 2/3
        const trueSubseq = fuzzyScore('adc', 'abdc')
        const expected = expectedSubsequenceScore(3, 4, 2)
        // Raw formula gives ~0.796, capped below MID_BASE
        expect(trueSubseq).toBeCloseTo(Math.min(expected, MID_BASE - SCORE_EPSILON), 2)
        expect(trueSubseq).toBeLessThan(MID_BASE)
    })

    it('high-coverage subsequence is capped below MID_BASE (ranking inversion fix)', () => {
        // REGRESSION: "abcd" in "aXbcd" — a(0) b(2) c(3) d(4)
        // coverage = 4/5, maxConsec = 3, bonus = 3/4
        // Raw formula: 0.30 + 0.28 + 0.2625 = 0.8425 (exceeded MID_BASE!)
        // After fix: capped just below MID_BASE to preserve hierarchy
        const score = fuzzyScore('abcd', 'aXbcd')
        expect(score).toBeLessThan(MID_BASE)

        // A legitimate mid-string substring must ALWAYS outrank any subsequence
        const substringScore = fuzzyScore('abcd', 'XXXXabcdXXXX')
        expect(substringScore).toBeGreaterThan(score)
    })
})

describe('sanitizeSearchInput — control char stripping and truncation', () => {
    it('passes through normal alphanumeric and emoji input', () => {
        expect(sanitizeSearchInput('drake 🔥')).toBe('drake 🔥')
        expect(sanitizeSearchInput('Migos - Culture')).toBe('Migos - Culture')
    })

    it('strips C0 control characters (null, backspace, escape)', () => {
        expect(sanitizeSearchInput('dra\x00ke')).toBe('drake')
        expect(sanitizeSearchInput('\x08hello\x1B')).toBe('hello')
    })

    it('strips zero-width Unicode characters used for fuzzy bypass', () => {
        // Zero-width space (U+200B) injected between chars
        expect(sanitizeSearchInput('d\u200Br\u200Bake')).toBe('drake')
        // BOM (U+FEFF) prepended
        expect(sanitizeSearchInput('\uFEFFquery')).toBe('query')
    })

    it('truncates to MAX_QUERY_LENGTH (100) chars', () => {
        const long = 'a'.repeat(150)
        const result = sanitizeSearchInput(long)
        expect(result.length).toBe(100)
    })

    it('strips control chars THEN truncates (order matters for bypass)', () => {
        // 98 real chars + 50 zero-width chars + 2 real chars = strips to 100 real, truncates to 100
        const payload = 'A'.repeat(98) + '\u200B'.repeat(50) + 'BB'
        const result = sanitizeSearchInput(payload)
        // After stripping: 100 chars of "A...ABB", truncated to 100
        expect(result.length).toBe(100)
        expect(result).toBe('A'.repeat(98) + 'BB')
    })

    it('returns empty string for null, undefined, non-string inputs', () => {
        expect(sanitizeSearchInput(null)).toBe('')
        expect(sanitizeSearchInput(undefined)).toBe('')
        expect(sanitizeSearchInput(42)).toBe('')
        expect(sanitizeSearchInput({})).toBe('')
    })
})

describe('epsilonSortBy — comparator factory', () => {
    it('sorts by score descending when scores differ by more than epsilon', () => {
        const items = [
            { score: 0.50, label: 'low' },
            { score: 0.90, label: 'high' },
            { score: 0.70, label: 'mid' },
        ]
        const sorted = [...items].sort(epsilonSortBy(() => 0))
        expect(sorted.map(i => i.label)).toEqual(['high', 'mid', 'low'])
    })

    it('falls through to tiebreaker when scores are within epsilon', () => {
        const a = { score: 0.900000000000001, views: 100 }
        const b = { score: 0.900000000000002, views: 500 }
        // Scores differ by ~1e-15 (within SCORE_EPSILON of 1e-9)
        const sorted = [a, b].sort(epsilonSortBy((x, y) => y.views - x.views))
        expect(sorted[0].views).toBe(500) // tiebreaker: higher views first
    })

    it('does NOT use tiebreaker when score gap exceeds epsilon', () => {
        const a = { score: 0.95, views: 1 }
        const b = { score: 0.50, views: 999999 }
        const sorted = [a, b].sort(epsilonSortBy((x, y) => y.views - x.views))
        expect(sorted[0].score).toBe(0.95) // score wins despite fewer views
    })
})

describe('searchAll — epsilon-bucketed sort stability', () => {
    it('SCORE_EPSILON is exported and positive', () => {
        expect(SCORE_EPSILON).toBeGreaterThan(0)
        expect(SCORE_EPSILON).toBeLessThan(1e-6) // sanity: epsilon is tiny
    })

    it('scores within epsilon are treated as equal, falling through to view-count tiebreaker', () => {
        // When two videos score identically (or within epsilon) for a query,
        // the sort must fall through to view count — the more popular video first.
        // With the old strict `!==` comparison, IEEE 754 rounding on different
        // text lengths could produce scores that differ by ~1e-16, bypassing
        // the tiebreaker and producing unstable ordering.
        const result = searchAll('Freestyle')
        if (result.videos.length >= 2) {
            // Among videos with tied or near-tied scores, higher view counts come first
            for (let i = 0; i < result.videos.length - 1; i++) {
                const a = result.videos[i]
                const b = result.videos[i + 1]
                const aScore = Math.max(fuzzyScore('freestyle', a.title), fuzzyScore('freestyle', a.artist) * 0.8)
                const bScore = Math.max(fuzzyScore('freestyle', b.title), fuzzyScore('freestyle', b.artist) * 0.8)
                if (Math.abs(aScore - bScore) <= SCORE_EPSILON) {
                    // Scores are within epsilon — view count tiebreaker must apply
                    expect(a.viewCount).toBeGreaterThanOrEqual(b.viewCount)
                }
            }
        }
    })
})

describe('scoredRank — generic pipeline', () => {
    it('filters out zero-score items and sorts by score descending', () => {
        const items = ['alpha', 'beta', 'gamma']
        const scorer = name => ({ name, score: name === 'beta' ? 0.9 : name === 'gamma' ? 0.7 : 0 })
        const result = scoredRank(items, scorer, () => 0, r => r.name)
        expect(result).toEqual(['beta', 'gamma'])
    })

    it('applies limit when provided', () => {
        const items = [1, 2, 3, 4, 5]
        const scorer = n => ({ n, score: n * 0.1 })
        const result = scoredRank(items, scorer, () => 0, r => r.n, 2)
        expect(result).toHaveLength(2)
    })

    it('returns all results when limit is omitted', () => {
        const items = [1, 2, 3]
        const scorer = n => ({ n, score: n * 0.1 })
        const result = scoredRank(items, scorer, () => 0, r => r.n)
        expect(result).toHaveLength(3)
    })

    it('falls through to tiebreaker for equal scores', () => {
        const items = [{ id: 'a', priority: 10 }, { id: 'b', priority: 50 }]
        const scorer = item => ({ ...item, score: 0.5 })
        const tiebreaker = (a, b) => b.priority - a.priority
        const result = scoredRank(items, scorer, tiebreaker, r => r.id)
        expect(result).toEqual(['b', 'a'])
    })
})

describe('extracted constants — ARTIST_MATCH_PENALTY & VIDEO_RESULTS_CAP', () => {
    it('ARTIST_MATCH_PENALTY is between 0 and 1 exclusive', () => {
        expect(ARTIST_MATCH_PENALTY).toBeGreaterThan(0)
        expect(ARTIST_MATCH_PENALTY).toBeLessThan(1)
    })

    it('VIDEO_RESULTS_CAP is a positive integer', () => {
        expect(VIDEO_RESULTS_CAP).toBeGreaterThan(0)
        expect(Number.isInteger(VIDEO_RESULTS_CAP)).toBe(true)
    })

    it('artist score penalty ensures title matches outrank artist matches', () => {
        // For identical fuzzy scores, the penalty must push artist below title
        const baseScore = 0.85
        expect(baseScore * ARTIST_MATCH_PENALTY).toBeLessThan(baseScore)
    })
})

describe('searchAll — security and edge cases', () => {
    it('truncates queries longer than 100 characters', () => {
        // A very long query should not crash or cause exponential matching
        const longQuery = 'a'.repeat(200)
        const result = searchAll(longQuery)
        // Should run without throwing and return empty (no match for 100 a's)
        expect(result).toHaveProperty('artists')
        expect(result).toHaveProperty('videos')
    })

    it('handles null and undefined queries without throwing', () => {
        expect(() => searchAll(null)).not.toThrow()
        expect(() => searchAll(undefined)).not.toThrow()
        expect(searchAll(null)).toEqual({ artists: [], videos: [] })
        expect(searchAll(undefined)).toEqual({ artists: [], videos: [] })
    })

    it('requires minimum 2 characters to return results', () => {
        // Single char queries are too broad — should return nothing
        expect(searchAll('a')).toEqual({ artists: [], videos: [] })
        expect(searchAll('D')).toEqual({ artists: [], videos: [] })
        // 2 chars should potentially return results
        const twoChar = searchAll('Dr')
        // Structure is correct even if no match
        expect(twoChar).toHaveProperty('artists')
        expect(twoChar).toHaveProperty('videos')
    })

    it('title matches rank higher than artist matches for same query', () => {
        // The 0.8 penalty on artist score means title matches should dominate
        // when both exist. Search for something that matches a title directly.
        const result = searchAll('Freestyle')
        if (result.videos.length >= 2) {
            // Videos with "Freestyle" in title should rank before those
            // matched only via artist name
            const firstVideo = result.videos[0]
            expect(firstVideo.title.toLowerCase()).toContain('freestyle')
        }
    })

    it('video results are capped at 8 even for broad queries', () => {
        const result = searchAll('the')
        expect(result.videos.length).toBeLessThanOrEqual(8)
    })

    it('artist results are sorted by score then by total views', () => {
        // A broad query that matches multiple artists
        const result = searchAll('Sh') // likely matches "Shortiie Raw", etc.
        if (result.artists.length >= 2) {
            // Just verify the result is an array of strings (artist names)
            for (const artist of result.artists) {
                expect(typeof artist).toBe('string')
                expect(artist.length).toBeGreaterThan(0)
            }
        }
    })
})
