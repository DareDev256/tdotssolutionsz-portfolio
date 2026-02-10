import { describe, it, expect } from 'vitest'
import { isValidYouTubeId, extractVideoId, getThumbnailUrl } from './youtube.js'

describe('isValidYouTubeId', () => {
    it('accepts valid 11-char YouTube IDs', () => {
        expect(isValidYouTubeId('dQw4w9WgXcQ')).toBe(true)
        expect(isValidYouTubeId('9hRUzEGfW7o')).toBe(true)
        expect(isValidYouTubeId('EmrpNsyVtDQ')).toBe(true)
        expect(isValidYouTubeId('Xedv19NEX-E')).toBe(true) // hyphens
        expect(isValidYouTubeId('abc_DEF-123')).toBe(true) // underscores + hyphens
    })

    it('rejects strings that are not exactly 11 chars', () => {
        expect(isValidYouTubeId('short')).toBe(false)
        expect(isValidYouTubeId('wayTooLongToBeAnId')).toBe(false)
        expect(isValidYouTubeId('')).toBe(false)
        expect(isValidYouTubeId('1234567890')).toBe(false) // 10 chars
        expect(isValidYouTubeId('123456789012')).toBe(false) // 12 chars
    })

    it('rejects non-string inputs', () => {
        expect(isValidYouTubeId(null)).toBe(false)
        expect(isValidYouTubeId(undefined)).toBe(false)
        expect(isValidYouTubeId(12345678901)).toBe(false)
        expect(isValidYouTubeId({})).toBe(false)
    })

    it('rejects IDs with special characters (XSS prevention)', () => {
        expect(isValidYouTubeId('<script>xss')).toBe(false)
        expect(isValidYouTubeId('id&param=bad')).toBe(false)
        expect(isValidYouTubeId('id"onclick=')).toBe(false)
        expect(isValidYouTubeId("id'OR'1'='1")).toBe(false)
    })
})

describe('extractVideoId', () => {
    it('extracts ID from full YouTube URLs', () => {
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
        expect(extractVideoId('https://youtube.com/watch?v=9hRUzEGfW7o')).toBe('9hRUzEGfW7o')
    })

    it('extracts ID from URLs with extra params', () => {
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')).toBe('dQw4w9WgXcQ')
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLx')).toBe('dQw4w9WgXcQ')
    })

    it('returns bare valid IDs unchanged', () => {
        expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
        expect(extractVideoId('Xedv19NEX-E')).toBe('Xedv19NEX-E')
    })

    it('returns empty string for invalid input', () => {
        expect(extractVideoId('')).toBe('')
        expect(extractVideoId(null)).toBe('')
        expect(extractVideoId(undefined)).toBe('')
        expect(extractVideoId('not-a-valid-id')).toBe('')
    })

    it('rejects injected content in v= param', () => {
        expect(extractVideoId('https://example.com/watch?v=<script>alert(1)</script>')).toBe('')
        expect(extractVideoId('https://example.com/watch?v=../../etc/passwd')).toBe('')
    })
})

describe('getThumbnailUrl', () => {
    it('builds default hqdefault thumbnail URL', () => {
        expect(getThumbnailUrl('dQw4w9WgXcQ')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        )
    })

    it('accepts valid quality presets', () => {
        expect(getThumbnailUrl('dQw4w9WgXcQ', 'maxresdefault')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        )
        expect(getThumbnailUrl('dQw4w9WgXcQ', 'sddefault')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/sddefault.jpg'
        )
        expect(getThumbnailUrl('dQw4w9WgXcQ', 'default')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg'
        )
        expect(getThumbnailUrl('dQw4w9WgXcQ', 'mqdefault')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        )
    })

    it('returns empty string for invalid video ID', () => {
        expect(getThumbnailUrl('')).toBe('')
        expect(getThumbnailUrl('not-valid')).toBe('')
        expect(getThumbnailUrl('<script>xss')).toBe('')
        expect(getThumbnailUrl(null)).toBe('')
    })

    it('falls back to hqdefault for invalid quality param (path injection prevention)', () => {
        expect(getThumbnailUrl('dQw4w9WgXcQ', '../../../etc/passwd')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        )
        expect(getThumbnailUrl('dQw4w9WgXcQ', 'bad?query=1')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        )
        expect(getThumbnailUrl('dQw4w9WgXcQ', '')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        )
    })
})
