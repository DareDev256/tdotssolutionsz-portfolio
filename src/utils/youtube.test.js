import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isValidYouTubeId, extractVideoId, getShareUrl, getThumbnailUrl, openShareWindow } from './youtube.js'

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

    it('rejects non-YouTube origins even with valid v= IDs (origin guard)', () => {
        expect(extractVideoId('https://evil.com/watch?v=dQw4w9WgXcQ')).toBe('')
        expect(extractVideoId('https://notyoutube.com/watch?v=dQw4w9WgXcQ')).toBe('')
        expect(extractVideoId('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ')).toBe('')
    })

    it('accepts youtu.be short links', () => {
        expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
        expect(extractVideoId('https://youtu.be/Xedv19NEX-E')).toBe('Xedv19NEX-E')
    })

    it('accepts m.youtube.com and music.youtube.com URLs', () => {
        expect(extractVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
        expect(extractVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('rejects youtu.be with invalid IDs', () => {
        expect(extractVideoId('https://youtu.be/<script>alert(1)')).toBe('')
        expect(extractVideoId('https://youtu.be/short')).toBe('')
    })
})

describe('getShareUrl', () => {
    // getShareUrl uses window.location — provide a minimal mock
    const origWindow = globalThis.window
    beforeEach(() => {
        globalThis.window = { location: { origin: 'https://tdotssolutionsz.com', pathname: '/' } }
    })
    afterEach(() => {
        globalThis.window = origWindow
    })

    it('builds share URL from youtubeId property', () => {
        const video = { youtubeId: 'dQw4w9WgXcQ' }
        const url = getShareUrl(video)
        expect(url).toBe('https://tdotssolutionsz.com/?v=dQw4w9WgXcQ')
    })

    it('falls back to extracting from url property', () => {
        const video = { url: 'https://www.youtube.com/watch?v=9hRUzEGfW7o' }
        const url = getShareUrl(video)
        expect(url).toBe('https://tdotssolutionsz.com/?v=9hRUzEGfW7o')
    })

    it('returns safe URL even with invalid video data', () => {
        const video = { youtubeId: '<script>alert(1)</script>' }
        const url = getShareUrl(video)
        // Invalid ID should produce ?v= with empty string, not the injection payload
        expect(url).not.toContain('<script>')
    })
})

describe('deep link ?v= parameter validation', () => {
    it('rejects XSS payloads that would be written to URL via replaceState', () => {
        // These are the exact strings an attacker might put in ?v=
        const xssPayloads = [
            '"><img src=x onerror=alert(1)>',
            "'-alert(1)-'",
            '<svg/onload=alert(1)>',
            'javascript:alert(1)',
            '../../etc/passwd',
        ]
        for (const payload of xssPayloads) {
            expect(isValidYouTubeId(payload)).toBe(false)
        }
    })

    it('accepts real YouTube IDs that appear in deep links', () => {
        // Real IDs from the video data
        expect(isValidYouTubeId('u3O5PKN9vCQ')).toBe(true)
        expect(isValidYouTubeId('E7ZStZMn-ac')).toBe(true)
        expect(isValidYouTubeId('8p4i1b5IW2k')).toBe(true)
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

describe('getThumbnailUrl — consolidated callers (VideoCard + MobileApp)', () => {
    it('produces correct mqdefault URL for VideoCard fallback', () => {
        expect(getThumbnailUrl('dQw4w9WgXcQ', 'mqdefault')).toBe(
            'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        )
    })

    it('produces correct default URL for MobileApp related videos', () => {
        expect(getThumbnailUrl('9hRUzEGfW7o', 'default')).toBe(
            'https://img.youtube.com/vi/9hRUzEGfW7o/default.jpg'
        )
    })

    it('blocks injection via tampered youtubeId in VideoCard context', () => {
        expect(getThumbnailUrl('<img/onerror=alert(1)>')).toBe('')
        expect(getThumbnailUrl('javascript:void')).toBe('')
        expect(getThumbnailUrl('id/../../etc')).toBe('')
    })

    it('blocks injection via tampered youtubeId in MobileApp related context', () => {
        expect(getThumbnailUrl('"><script>x</script>', 'default')).toBe('')
        expect(getThumbnailUrl(undefined, 'default')).toBe('')
    })
})

describe('openShareWindow', () => {
    let openSpy
    beforeEach(() => {
        openSpy = vi.fn()
        globalThis.window = { open: openSpy }
    })
    afterEach(() => {
        vi.restoreAllMocks()
        delete globalThis.window
    })

    it('opens allowed share targets (twitter.com, wa.me)', () => {
        expect(openShareWindow('https://twitter.com/intent/tweet?text=test')).toBe(true)
        expect(openSpy).toHaveBeenCalledOnce()
        openSpy.mockClear()
        expect(openShareWindow('https://wa.me/?text=test')).toBe(true)
        expect(openSpy).toHaveBeenCalledOnce()
    })

    it('blocks non-allowlisted hosts (open redirect prevention)', () => {
        expect(openShareWindow('https://evil.com/redirect?to=malware')).toBe(false)
        expect(openShareWindow('https://twitter.com.evil.com/fake')).toBe(false)
        expect(openSpy).not.toHaveBeenCalled()
    })

    it('blocks javascript: and data: protocol URLs', () => {
        expect(openShareWindow('javascript:alert(1)')).toBe(false)
        expect(openShareWindow('data:text/html,<script>alert(1)</script>')).toBe(false)
        expect(openSpy).not.toHaveBeenCalled()
    })

    it('returns false for malformed URLs', () => {
        expect(openShareWindow('')).toBe(false)
        expect(openShareWindow('not-a-url')).toBe(false)
    })

    it('passes custom features string to window.open', () => {
        openShareWindow('https://twitter.com/intent/tweet', 'noopener,noreferrer,width=550')
        expect(openSpy).toHaveBeenCalledWith(
            'https://twitter.com/intent/tweet',
            '_blank',
            'noopener,noreferrer,width=550'
        )
    })
})
