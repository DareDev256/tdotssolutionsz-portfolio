import { describe, it, expect } from 'vitest'
import {
    VIDEOS, ALL_ARTISTS, ARTIST_STATS, NEON_COLORS,
    LANE_CONFIG, POPULAR_THRESHOLD, PORTFOLIO_STATS, processVideosIntoLanes
} from './videoData.js'

describe('VIDEOS', () => {
    it('contains valid video entries with full YouTube URLs and unique IDs', () => {
        expect(VIDEOS.length).toBeGreaterThan(0)
        const ids = VIDEOS.map(v => v.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const v of VIDEOS) {
            expect(v.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/)
            expect(v.youtubeId).toBeTruthy()
            expect(v.artist).toBeTruthy()
            expect(new Date(v.uploadDate).toString()).not.toBe('Invalid Date')
        }
    })
})

describe('ALL_ARTISTS / ARTIST_STATS', () => {
    it('ALL_ARTISTS is sorted, unique, and covers every video artist', () => {
        const sorted = [...ALL_ARTISTS].sort()
        expect(ALL_ARTISTS).toEqual(sorted)
        expect(new Set(ALL_ARTISTS).size).toBe(ALL_ARTISTS.length)
        const fromVideos = new Set(VIDEOS.map(v => v.artist))
        for (const artist of fromVideos) expect(ALL_ARTISTS).toContain(artist)
    })

    it('ARTIST_STATS counts match actual video counts', () => {
        for (const artist of ALL_ARTISTS) {
            const actual = VIDEOS.filter(v => v.artist === artist).length
            expect(ARTIST_STATS[artist].count).toBe(actual)
            expect(ARTIST_STATS[artist].totalViews).toBeGreaterThanOrEqual(0)
        }
    })
})

describe('PORTFOLIO_STATS', () => {
    it('totalVideos and totalArtists match source data', () => {
        expect(PORTFOLIO_STATS.totalVideos).toBe(VIDEOS.length)
        expect(PORTFOLIO_STATS.totalArtists).toBe(ALL_ARTISTS.length)
    })

    it('totalViews equals sum of all video view counts', () => {
        const expected = VIDEOS.reduce((sum, v) => sum + v.viewCount, 0)
        expect(PORTFOLIO_STATS.totalViews).toBe(expected)
    })

    it('date range covers all videos', () => {
        for (const v of VIDEOS) {
            expect(v.uploadDate >= PORTFOLIO_STATS.earliestDate).toBe(true)
            expect(v.uploadDate <= PORTFOLIO_STATS.latestDate).toBe(true)
        }
    })

    it('topArtist has the highest total views', () => {
        expect(PORTFOLIO_STATS.topArtist).not.toBeNull()
        for (const artist of ALL_ARTISTS) {
            expect(PORTFOLIO_STATS.topArtist.totalViews).toBeGreaterThanOrEqual(ARTIST_STATS[artist].totalViews)
        }
    })
})

describe('processVideosIntoLanes', () => {
    const { chronological, popular, all } = processVideosIntoLanes()

    it('chronological lane has all videos sorted newest first', () => {
        expect(chronological.length).toBe(VIDEOS.length)
        for (let i = 1; i < chronological.length; i++) {
            expect(new Date(chronological[i - 1].uploadDate).getTime())
                .toBeGreaterThanOrEqual(new Date(chronological[i].uploadDate).getTime())
        }
    })

    it('popular lane filters by threshold and sorts by views descending', () => {
        expect(popular.length).toBeGreaterThan(0)
        for (const v of popular) expect(v.viewCount).toBeGreaterThanOrEqual(POPULAR_THRESHOLD)
        for (let i = 1; i < popular.length; i++) {
            expect(popular[i - 1].viewCount).toBeGreaterThanOrEqual(popular[i].viewCount)
        }
    })

    it('assigns correct lane metadata and positions', () => {
        for (const v of chronological) {
            expect(v.position[0]).toBe(LANE_CONFIG.CHRONOLOGICAL.x)
            expect(v.lane).toBe('chronological')
            expect(NEON_COLORS).toContain(v.color)
        }
        for (const v of popular) {
            expect(v.position[0]).toBe(LANE_CONFIG.POPULAR.x)
            expect(v.lane).toBe('popular')
        }
        expect(all.length).toBe(chronological.length + popular.length)
    })
})
