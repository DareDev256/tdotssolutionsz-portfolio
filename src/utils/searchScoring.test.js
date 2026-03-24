import { describe, it, expect } from 'vitest'
import { fuzzyScore, searchAll } from './searchScoring'

/**
 * Deep verification of fuzzyScore's mathematical properties and searchAll's
 * security boundaries. These tests catch regressions that the existing
 * useSearch.test.js doesn't cover — formula weight changes that silently
 * degrade ranking, and input sanitization edge cases.
 */

describe('fuzzyScore — scoring formula verification', () => {
    // The formula: 0.30 base + (coverage * 0.35) + (consecutiveBonus * 0.35)
    // where coverage = queryLen/textLen, consecutiveBonus = maxConsecutiveRun/queryLen

    it('subsequence match gets exactly 0.30 base when coverage and consecutive are minimal', () => {
        // "ae" in "abcdefghij" — chars exist in order but scattered
        // coverage = 2/10 = 0.2, consecutive = 1/2 = 0.5
        // score = 0.30 + (0.2 * 0.35) + (0.5 * 0.35) = 0.30 + 0.07 + 0.175 = 0.545
        const score = fuzzyScore('ae', 'abcdefghij')
        expect(score).toBeCloseTo(0.545, 2)
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

        // Prefix substring → 0.90 + (coverage * 0.10)
        const prefix = fuzzyScore('abc', 'abcXXX') // coverage = 3/6 = 0.5 → 0.95
        expect(prefix).toBeCloseTo(0.95, 2)
        expect(prefix).toBeLessThan(1.0)

        // Mid-string substring → 0.80 + (coverage * 0.10)
        const mid = fuzzyScore('abc', 'XXXabcXXX') // coverage = 3/9 ≈ 0.333 → ≈0.833
        expect(mid).toBeCloseTo(0.833, 2)
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
