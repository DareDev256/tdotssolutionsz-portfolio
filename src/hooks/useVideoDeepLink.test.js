import { describe, it, expect } from 'vitest'
import { resolveDeepLink, buildVideoUrl } from './useVideoDeepLink'

const CATALOG = [
    { youtubeId: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up' },
    { youtubeId: 'Xedv19NEX-E', title: 'Another Video' },
]

describe('resolveDeepLink', () => {
    it('returns matching video for valid ID in catalog', () => {
        const result = resolveDeepLink('dQw4w9WgXcQ', CATALOG)
        expect(result).toBe(CATALOG[0])
    })

    it('returns null for valid ID not in catalog', () => {
        expect(resolveDeepLink('abcdefghijk', CATALOG)).toBeNull()
    })

    it('returns null for null input', () => {
        expect(resolveDeepLink(null, CATALOG)).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(resolveDeepLink('', CATALOG)).toBeNull()
    })

    it('rejects IDs that are too short', () => {
        expect(resolveDeepLink('abc', CATALOG)).toBeNull()
    })

    it('rejects IDs with invalid characters (XSS)', () => {
        expect(resolveDeepLink('<script>xss', CATALOG)).toBeNull()
    })

    it('rejects IDs that are too long', () => {
        expect(resolveDeepLink('dQw4w9WgXcQx', CATALOG)).toBeNull()
    })

    it('returns null for empty catalog', () => {
        expect(resolveDeepLink('dQw4w9WgXcQ', [])).toBeNull()
    })
})

describe('buildVideoUrl', () => {
    it('returns ?v=ID when showing a video with youtubeId', () => {
        const video = { youtubeId: 'dQw4w9WgXcQ' }
        expect(buildVideoUrl(video, true)).toBe('?v=dQw4w9WgXcQ')
    })

    it('returns null when not showing video', () => {
        const video = { youtubeId: 'dQw4w9WgXcQ' }
        expect(buildVideoUrl(video, false)).toBeNull()
    })

    it('returns null when activeVideo is null', () => {
        expect(buildVideoUrl(null, true)).toBeNull()
    })

    it('returns null when both params are falsy', () => {
        expect(buildVideoUrl(null, false)).toBeNull()
    })

    it('extracts ID from url property when youtubeId missing', () => {
        const video = { url: 'https://www.youtube.com/watch?v=Xedv19NEX-E' }
        expect(buildVideoUrl(video, true)).toBe('?v=Xedv19NEX-E')
    })

    it('returns null for video with no extractable ID', () => {
        const video = { title: 'No ID' }
        expect(buildVideoUrl(video, true)).toBeNull()
    })
})
