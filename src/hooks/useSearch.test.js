import { describe, it, expect } from 'vitest'
import { fuzzyScore, searchAll } from './useSearch'

describe('fuzzyScore', () => {
    it('returns 1 for exact substring match', () => {
        expect(fuzzyScore('masicka', 'Masicka')).toBe(1)
    })

    it('returns 0 for empty query', () => {
        expect(fuzzyScore('', 'Masicka')).toBe(0)
    })

    it('returns 0 for empty text', () => {
        expect(fuzzyScore('test', '')).toBe(0)
    })

    it('matches partial substring', () => {
        expect(fuzzyScore('cas', 'Casper TNG')).toBe(1)
    })

    it('returns > 0 for subsequence match (typo tolerance)', () => {
        // "msicka" — skipped the 'a', all chars still appear in order
        const score = fuzzyScore('msicka', 'Masicka')
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThan(1)
    })

    it('returns 0 when chars are not in order', () => {
        expect(fuzzyScore('zzz', 'Masicka')).toBe(0)
    })

    it('scores exact match higher than subsequence', () => {
        const exact = fuzzyScore('casper', 'Casper TNG')
        const subseq = fuzzyScore('csper', 'Casper TNG')
        expect(exact).toBeGreaterThan(subseq)
    })
})

describe('searchAll', () => {
    it('returns empty results for short queries', () => {
        const result = searchAll('a')
        expect(result.artists).toHaveLength(0)
        expect(result.videos).toHaveLength(0)
    })

    it('returns empty results for empty query', () => {
        const result = searchAll('')
        expect(result.artists).toHaveLength(0)
        expect(result.videos).toHaveLength(0)
    })

    it('finds artists by name', () => {
        const result = searchAll('Masicka')
        expect(result.artists).toContain('Masicka')
    })

    it('finds videos by title keyword', () => {
        const result = searchAll('Freestyle')
        expect(result.videos.length).toBeGreaterThan(0)
        expect(result.videos.some(v => v.title.toLowerCase().includes('freestyle'))).toBe(true)
    })

    it('caps video results at 8', () => {
        // broad query that would match many videos
        const result = searchAll('ft')
        expect(result.videos.length).toBeLessThanOrEqual(8)
    })

    it('ranks exact artist matches first', () => {
        const result = searchAll('Casper')
        if (result.artists.length > 0) {
            expect(result.artists[0]).toContain('Casper')
        }
    })
})
