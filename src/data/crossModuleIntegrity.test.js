import { describe, it, expect } from 'vitest'
import { isValidYouTubeId, extractVideoId, getThumbnailUrl } from '../utils/youtube.js'
import {
    VIDEOS, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS,
    DECEASED_ARTISTS, NEON_COLORS, processVideosIntoLanes
} from '../utils/videoData.js'

/**
 * Cross-module data integrity tests — verifies contracts between
 * videos.json, videoData.js, and youtube.js that no single-module
 * test catches. These prevent silent breakage when video data is
 * edited (bad youtubeId, duplicate IDs, broken artist references).
 */

describe('videos.json ↔ youtube.js contract', () => {
    it('every video youtubeId passes isValidYouTubeId validation', () => {
        // THE critical test: if this fails, video playback is broken for that entry.
        // This catches typos, extra characters, or accidental edits to videos.json.
        const failures = VIDEOS.filter(v => !isValidYouTubeId(v.youtubeId))
        expect(failures, `Invalid youtubeIds: ${failures.map(v => `${v.title}: "${v.youtubeId}"`).join(', ')}`).toHaveLength(0)
    })

    it('every video URL is extractable back to its youtubeId', () => {
        // Round-trip: url → extractVideoId → should match youtubeId
        for (const v of VIDEOS) {
            const extracted = extractVideoId(v.url)
            expect(extracted, `URL round-trip failed for "${v.title}": url=${v.url}`).toBe(v.youtubeId)
        }
    })

    it('every video produces a valid thumbnail URL', () => {
        for (const v of VIDEOS) {
            const thumb = getThumbnailUrl(v.youtubeId)
            expect(thumb).toMatch(/^https:\/\/img\.youtube\.com\/vi\/[A-Za-z0-9_-]{11}\/hqdefault\.jpg$/)
        }
    })

    it('no duplicate youtubeIds exist in the catalog', () => {
        const ids = VIDEOS.map(v => v.youtubeId)
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
        expect(dupes, `Duplicate youtubeIds: ${dupes.join(', ')}`).toHaveLength(0)
    })

    it('no duplicate numeric IDs exist in the catalog', () => {
        const ids = VIDEOS.map(v => v.id)
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
        expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0)
    })
})

describe('videoData.js internal consistency', () => {
    it('ALL_ARTISTS covers every unique artist from VIDEOS', () => {
        const fromVideos = new Set(VIDEOS.map(v => v.artist))
        const fromAllArtists = new Set(ALL_ARTISTS)
        // Every video artist must be in ALL_ARTISTS
        for (const artist of fromVideos) {
            expect(fromAllArtists.has(artist), `Missing artist: "${artist}"`).toBe(true)
        }
        // ALL_ARTISTS should not have phantom entries
        for (const artist of ALL_ARTISTS) {
            expect(fromVideos.has(artist), `Phantom artist in ALL_ARTISTS: "${artist}"`).toBe(true)
        }
    })

    it('ARTIST_STATS totalViews matches sum of individual video views', () => {
        for (const artist of ALL_ARTISTS) {
            const expectedViews = VIDEOS
                .filter(v => v.artist === artist)
                .reduce((sum, v) => sum + v.viewCount, 0)
            expect(ARTIST_STATS[artist].totalViews).toBe(expectedViews)
        }
    })

    it('ARTIST_STATS date ranges are valid and bounded by actual video dates', () => {
        for (const artist of ALL_ARTISTS) {
            const stats = ARTIST_STATS[artist]
            const artistVideos = VIDEOS.filter(v => v.artist === artist)
            const dates = artistVideos.map(v => v.uploadDate).sort()
            expect(stats.earliest).toBe(dates[0])
            expect(stats.latest).toBe(dates[dates.length - 1])
        }
    })

    it('DECEASED_ARTISTS only contains artists that exist in VIDEOS', () => {
        const allVideoArtists = new Set(
            VIDEOS.flatMap(v => v.artist.split(',').map(a => a.trim()))
        )
        for (const name of DECEASED_ARTISTS) {
            expect(allVideoArtists.has(name), `"${name}" in DECEASED_ARTISTS but not in any video`).toBe(true)
        }
    })

    it('NEON_COLORS are all valid hex color strings', () => {
        for (const color of NEON_COLORS) {
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
        }
    })
})

describe('processVideosIntoLanes — popular lane neon offset', () => {
    const { popular } = processVideosIntoLanes()

    it('popular lane colors use +3 offset from neon palette', () => {
        // The popular lane offsets by 3 to avoid visually matching the
        // chronological lane which starts at index 0
        for (let i = 0; i < popular.length; i++) {
            const expectedColor = NEON_COLORS[(i + 3) % NEON_COLORS.length]
            expect(popular[i].color).toBe(expectedColor)
        }
    })
})

describe('PORTFOLIO_STATS derived values', () => {
    it('topArtist name exists in ALL_ARTISTS', () => {
        expect(ALL_ARTISTS).toContain(PORTFOLIO_STATS.topArtist.name)
    })

    it('earliestDate and latestDate are valid ISO date strings', () => {
        expect(new Date(PORTFOLIO_STATS.earliestDate).toString()).not.toBe('Invalid Date')
        expect(new Date(PORTFOLIO_STATS.latestDate).toString()).not.toBe('Invalid Date')
        expect(PORTFOLIO_STATS.earliestDate <= PORTFOLIO_STATS.latestDate).toBe(true)
    })

    it('totalViews is non-negative and matches video sum', () => {
        const sum = VIDEOS.reduce((s, v) => s + v.viewCount, 0)
        expect(PORTFOLIO_STATS.totalViews).toBe(sum)
        expect(PORTFOLIO_STATS.totalViews).toBeGreaterThanOrEqual(0)
    })
})
