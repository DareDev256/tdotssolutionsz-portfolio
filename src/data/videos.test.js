import { describe, it, expect } from 'vitest'
import rawVideoData from './videos.json'

const videos = rawVideoData.videos
const REQUIRED_FIELDS = ['id', 'title', 'artist', 'description', 'youtubeId', 'uploadDate', 'viewCount']

describe('videos.json — schema integrity', () => {
    it('is a non-empty array under "videos" key', () => {
        expect(Array.isArray(videos)).toBe(true)
        expect(videos.length).toBeGreaterThan(0)
    })

    it('every entry has all required fields with correct types', () => {
        for (const video of videos) {
            expect(typeof video.id, `video ${video.id}: id should be number`).toBe('number')
            expect(typeof video.title, `video ${video.id}: title should be string`).toBe('string')
            expect(typeof video.artist, `video ${video.id}: artist should be string`).toBe('string')
            expect(typeof video.description, `video ${video.id}: description should be string`).toBe('string')
            expect(typeof video.youtubeId, `video ${video.id}: youtubeId should be string`).toBe('string')
            expect(typeof video.uploadDate, `video ${video.id}: uploadDate should be string`).toBe('string')
            expect(typeof video.viewCount, `video ${video.id}: viewCount should be number`).toBe('number')
        }
    })

    it('all IDs are unique positive integers', () => {
        const ids = videos.map(v => v.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const id of ids) {
            expect(Number.isInteger(id) && id > 0, `ID ${id} should be a positive integer`).toBe(true)
        }
    })

    it('all youtubeIds are exactly 11 characters matching [A-Za-z0-9_-]', () => {
        const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/
        for (const video of videos) {
            expect(YT_ID_RE.test(video.youtubeId),
                `video ${video.id} youtubeId "${video.youtubeId}" must be 11 chars [A-Za-z0-9_-]`
            ).toBe(true)
        }
    })

    it('all youtubeIds are unique (no duplicate videos)', () => {
        const ytIds = videos.map(v => v.youtubeId)
        expect(new Set(ytIds).size).toBe(ytIds.length)
    })

    it('all uploadDates are valid ISO date strings (YYYY-MM-DD)', () => {
        const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
        for (const video of videos) {
            expect(DATE_RE.test(video.uploadDate),
                `video ${video.id} date "${video.uploadDate}" should be YYYY-MM-DD`
            ).toBe(true)
            expect(new Date(video.uploadDate).toString(),
                `video ${video.id} date "${video.uploadDate}" should parse to valid date`
            ).not.toBe('Invalid Date')
        }
    })

    it('all viewCounts are non-negative integers', () => {
        for (const video of videos) {
            expect(Number.isInteger(video.viewCount) && video.viewCount >= 0,
                `video ${video.id} viewCount ${video.viewCount} should be non-negative integer`
            ).toBe(true)
        }
    })

    it('no entry has title or artist as empty/whitespace-only string', () => {
        for (const video of videos) {
            expect(video.title.trim().length, `video ${video.id} title should not be empty`).toBeGreaterThan(0)
            expect(video.artist.trim().length, `video ${video.id} artist should not be empty`).toBeGreaterThan(0)
        }
    })

    it('no entry has unexpected extra fields (schema guard)', () => {
        const ALLOWED = new Set(REQUIRED_FIELDS)
        for (const video of videos) {
            const extra = Object.keys(video).filter(k => !ALLOWED.has(k))
            expect(extra, `video ${video.id} has unexpected fields: ${extra.join(', ')}`).toEqual([])
        }
    })
})
