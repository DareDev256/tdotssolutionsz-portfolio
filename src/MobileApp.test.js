import { describe, it, expect } from 'vitest'
import { VIDEOS, POPULAR_THRESHOLD, ALL_ARTISTS, ARTIST_STATS } from './utils/videoData'

/**
 * Tests for MobileApp.jsx filtering, sorting, and search logic.
 * These replicate the inline useMemo/function logic from MobileApp
 * as pure functions to verify correctness without React rendering.
 */

// ── Replicate MobileApp's filteredVideos logic ──
function getFilteredVideos(activeTab, filterArtist, favorites) {
    let vids = [...VIDEOS]
    if (filterArtist) {
        vids = vids.filter(v => v.artist === filterArtist)
    }
    if (activeTab === 'favorites') {
        return vids
            .filter(v => favorites.includes(v.id))
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    }
    if (activeTab === 'latest') {
        return vids.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    } else {
        return vids
            .filter(v => v.viewCount >= POPULAR_THRESHOLD)
            .sort((a, b) => b.viewCount - a.viewCount)
    }
}

// ── Replicate MobileApp's searchResults logic ──
function getSearchResults(searchQuery) {
    if (!searchQuery) return ALL_ARTISTS
    const q = searchQuery.toLowerCase()
    return ALL_ARTISTS.filter(a => a.toLowerCase().includes(q))
}

// ── Replicate MobileApp's relatedVideos logic ──
function getRelatedVideos(playingVideo) {
    if (!playingVideo) return []
    return VIDEOS.filter(v => v.artist === playingVideo.artist && v.id !== playingVideo.id)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 4)
}

// ── Replicate MobileApp's formatViews ──
function formatViews(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
}

describe('MobileApp: filteredVideos', () => {
    it('"latest" tab returns all videos sorted newest-first', () => {
        const result = getFilteredVideos('latest', null, [])
        expect(result.length).toBe(VIDEOS.length)
        for (let i = 1; i < result.length; i++) {
            expect(new Date(result[i - 1].uploadDate) >= new Date(result[i].uploadDate)).toBe(true)
        }
    })

    it('"popular" tab filters by threshold and sorts by views descending', () => {
        const result = getFilteredVideos('popular', null, [])
        expect(result.every(v => v.viewCount >= POPULAR_THRESHOLD)).toBe(true)
        for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].viewCount >= result[i].viewCount).toBe(true)
        }
    })

    it('artist filter narrows results to one artist', () => {
        const artist = ALL_ARTISTS[0]
        const result = getFilteredVideos('latest', artist, [])
        expect(result.length).toBe(ARTIST_STATS[artist].count)
        expect(result.every(v => v.artist === artist)).toBe(true)
    })

    it('"favorites" tab returns only favorited IDs, sorted by date', () => {
        const favIds = VIDEOS.slice(0, 3).map(v => v.id)
        const result = getFilteredVideos('favorites', null, favIds)
        expect(result.length).toBe(3)
        expect(result.every(v => favIds.includes(v.id))).toBe(true)
        for (let i = 1; i < result.length; i++) {
            expect(new Date(result[i - 1].uploadDate) >= new Date(result[i].uploadDate)).toBe(true)
        }
    })

    it('artist filter + favorites combo works', () => {
        // Find an artist with multiple videos, favorite some
        const artist = ALL_ARTISTS.find(a => ARTIST_STATS[a].count >= 2)
        const artistVids = VIDEOS.filter(v => v.artist === artist)
        const favIds = [artistVids[0].id]
        const result = getFilteredVideos('favorites', artist, favIds)
        expect(result.length).toBe(1)
        expect(result[0].artist).toBe(artist)
    })

    it('empty favorites returns empty array on favorites tab', () => {
        const result = getFilteredVideos('favorites', null, [])
        expect(result).toEqual([])
    })
})

describe('MobileApp: searchResults', () => {
    it('empty query returns all artists', () => {
        expect(getSearchResults('')).toEqual(ALL_ARTISTS)
    })

    it('case-insensitive search matches artist names', () => {
        const firstArtist = ALL_ARTISTS[0]
        const results = getSearchResults(firstArtist.toLowerCase())
        expect(results).toContain(firstArtist)
    })

    it('partial match works', () => {
        // Search for a 3-letter substring that should match at least one artist
        const substr = ALL_ARTISTS[0].substring(0, 3)
        const results = getSearchResults(substr)
        expect(results.length).toBeGreaterThan(0)
        expect(results.every(a => a.toLowerCase().includes(substr.toLowerCase()))).toBe(true)
    })

    it('no-match query returns empty array', () => {
        expect(getSearchResults('zzzznonexistentartist')).toEqual([])
    })
})

describe('MobileApp: relatedVideos', () => {
    it('returns up to 4 videos by same artist, excluding current', () => {
        const artist = ALL_ARTISTS.find(a => ARTIST_STATS[a].count >= 3)
        const video = VIDEOS.find(v => v.artist === artist)
        const related = getRelatedVideos(video)
        expect(related.length).toBeLessThanOrEqual(4)
        expect(related.every(v => v.artist === artist && v.id !== video.id)).toBe(true)
    })

    it('returns empty for null input', () => {
        expect(getRelatedVideos(null)).toEqual([])
    })

    it('sorts related videos by viewCount descending', () => {
        const artist = ALL_ARTISTS.find(a => ARTIST_STATS[a].count >= 3)
        const video = VIDEOS.find(v => v.artist === artist)
        const related = getRelatedVideos(video)
        for (let i = 1; i < related.length; i++) {
            expect(related[i - 1].viewCount >= related[i].viewCount).toBe(true)
        }
    })

    it('returns empty for solo artist (only 1 video)', () => {
        const soloArtist = ALL_ARTISTS.find(a => ARTIST_STATS[a].count === 1)
        if (soloArtist) {
            const video = VIDEOS.find(v => v.artist === soloArtist)
            expect(getRelatedVideos(video)).toEqual([])
        }
    })
})

describe('MobileApp: formatViews', () => {
    it('formats millions with 1 decimal', () => {
        expect(formatViews(5700000)).toBe('5.7M')
        expect(formatViews(1000000)).toBe('1.0M')
    })

    it('formats thousands with no decimal', () => {
        expect(formatViews(252000)).toBe('252K')
        expect(formatViews(1000)).toBe('1K')
    })

    it('returns raw number string below 1000', () => {
        expect(formatViews(999)).toBe('999')
        expect(formatViews(0)).toBe('0')
    })
})
