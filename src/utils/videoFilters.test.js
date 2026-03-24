import { describe, it, expect } from 'vitest'
import { topByViews, latestFirst, byArtist, byYearRange, topVideoForArtist } from './videoFilters'

/** Minimal video stubs — only the fields each filter actually reads */
const STUB_VIDEOS = [
    { id: 1, artist: 'Drake', viewCount: 500000, uploadDate: '2023-06-15' },
    { id: 2, artist: 'Shortiie Raw', viewCount: 1200000, uploadDate: '2021-03-10' },
    { id: 3, artist: 'Drake', viewCount: 800000, uploadDate: '2019-11-22' },
    { id: 4, artist: 'Murda', viewCount: 300000, uploadDate: '2015-01-05' },
    { id: 5, artist: 'Pressa', viewCount: 2000000, uploadDate: '2022-08-30' },
]

describe('topByViews', () => {
    it('sorts descending by viewCount', () => {
        const result = topByViews(STUB_VIDEOS)
        const views = result.map(v => v.viewCount)
        expect(views).toEqual([2000000, 1200000, 800000, 500000, 300000])
    })

    it('respects limit parameter', () => {
        expect(topByViews(STUB_VIDEOS, 3)).toHaveLength(3)
        expect(topByViews(STUB_VIDEOS, 3)[0].viewCount).toBe(2000000)
    })

    it('returns all when limit exceeds array length', () => {
        expect(topByViews(STUB_VIDEOS, 99)).toHaveLength(5)
    })

    it('never mutates the input array', () => {
        const original = [...STUB_VIDEOS]
        topByViews(STUB_VIDEOS, 2)
        expect(STUB_VIDEOS).toEqual(original)
    })

    it('returns empty array for empty input', () => {
        expect(topByViews([])).toEqual([])
    })
})

describe('latestFirst', () => {
    it('sorts newest upload date first', () => {
        const result = latestFirst(STUB_VIDEOS)
        expect(result[0].uploadDate).toBe('2023-06-15')
        expect(result[result.length - 1].uploadDate).toBe('2015-01-05')
    })

    it('respects limit parameter', () => {
        expect(latestFirst(STUB_VIDEOS, 2)).toHaveLength(2)
    })
})

describe('byArtist', () => {
    it('filters to exact artist match', () => {
        const drakeVids = byArtist(STUB_VIDEOS, 'Drake')
        expect(drakeVids).toHaveLength(2)
        expect(drakeVids.every(v => v.artist === 'Drake')).toBe(true)
    })

    it('returns empty for non-existent artist', () => {
        expect(byArtist(STUB_VIDEOS, 'Nobody')).toEqual([])
    })

    it('is case-sensitive (artist field is pre-normalized)', () => {
        expect(byArtist(STUB_VIDEOS, 'drake')).toEqual([])
    })
})

describe('byYearRange', () => {
    it('filters inclusive of both endpoints', () => {
        const result = byYearRange(STUB_VIDEOS, 2021, 2022)
        expect(result).toHaveLength(2) // Shortiie Raw (2021) + Pressa (2022)
    })

    it('returns empty when no videos in range', () => {
        expect(byYearRange(STUB_VIDEOS, 2000, 2010)).toEqual([])
    })

    it('single-year range works', () => {
        const result = byYearRange(STUB_VIDEOS, 2015, 2015)
        expect(result).toHaveLength(1)
        expect(result[0].artist).toBe('Murda')
    })
})

describe('topVideoForArtist', () => {
    it('returns the highest-viewed video for a given artist', () => {
        const top = topVideoForArtist(STUB_VIDEOS, 'Drake')
        expect(top.viewCount).toBe(800000) // Drake's top
    })

    it('returns null for non-existent artist', () => {
        expect(topVideoForArtist(STUB_VIDEOS, 'Nobody')).toBeNull()
    })
})
