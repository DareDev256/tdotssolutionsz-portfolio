import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { VIDEOS, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS, NEON_COLORS, DECEASED_ARTISTS } from './videoData'
import { sanitizeSearchInput } from './searchScoring'

// ── Prototype Pollution Defense ─────────────────────────────────────
// Third-party scripts (YouTube IFrame API, Troika font loader, Three.js)
// share our execution context. If any of these gets compromised or has a
// supply-chain vulnerability, frozen data objects prevent mutation of
// content that React renders into the DOM.

describe('data object immutability (prototype pollution defense)', () => {
    it('VIDEOS array is frozen — cannot push malicious entries', () => {
        expect(Object.isFrozen(VIDEOS)).toBe(true)
        expect(() => { VIDEOS.push({ title: '<img onerror=alert(1)>' }) }).toThrow()
    })

    it('individual video objects are frozen — cannot overwrite titles', () => {
        const first = VIDEOS[0]
        expect(Object.isFrozen(first)).toBe(true)
        expect(() => { first.title = '<script>alert(1)</script>' }).toThrow()
    })

    it('ALL_ARTISTS array is frozen — cannot inject artist names', () => {
        expect(Object.isFrozen(ALL_ARTISTS)).toBe(true)
        expect(() => { ALL_ARTISTS.push('"><script>alert(1)</script>') }).toThrow()
    })

    it('ARTIST_STATS object is frozen — cannot add fake artist entries', () => {
        expect(Object.isFrozen(ARTIST_STATS)).toBe(true)
        expect(() => { ARTIST_STATS['__proto__'] = { polluted: true } }).toThrow()
    })

    it('PORTFOLIO_STATS object is frozen — cannot tamper with aggregate numbers', () => {
        expect(Object.isFrozen(PORTFOLIO_STATS)).toBe(true)
        expect(() => { PORTFOLIO_STATS.totalVideos = 999999 }).toThrow()
    })

    it('NEON_COLORS array is frozen — cannot inject CSS payloads', () => {
        expect(Object.isFrozen(NEON_COLORS)).toBe(true)
        expect(() => { NEON_COLORS[0] = 'expression(alert(1))' }).toThrow()
    })

    it('DECEASED_ARTISTS Set is frozen — cannot add names via prototype', () => {
        expect(Object.isFrozen(DECEASED_ARTISTS)).toBe(true)
    })
})

// ── Search Input Sanitization ───────────────────────────────────────
// Validates that control characters, zero-width Unicode, and null bytes
// are stripped from search input before fuzzy matching.

describe('search input sanitization', () => {
    it('strips NUL bytes from input', () => {
        expect(sanitizeSearchInput('dra\x00ke')).toBe('drake')
    })

    it('strips C0 control characters (0x01-0x1F except tab/newline)', () => {
        expect(sanitizeSearchInput('\x01\x02hello\x1F')).toBe('hello')
    })

    it('strips zero-width spaces and joiners (U+200B-U+200F)', () => {
        expect(sanitizeSearchInput('dr\u200Bake')).toBe('drake')
    })

    it('strips byte order mark (U+FEFF)', () => {
        expect(sanitizeSearchInput('\uFEFFdrake')).toBe('drake')
    })

    it('strips line/paragraph separators (U+2028-U+2029)', () => {
        expect(sanitizeSearchInput('drake\u2028future')).toBe('drakefuture')
    })

    it('preserves normal printable characters', () => {
        expect(sanitizeSearchInput('Drake & Future')).toBe('Drake & Future')
    })

    it('preserves emoji (valid Unicode above control range)', () => {
        expect(sanitizeSearchInput('drake 🔥')).toBe('drake 🔥')
    })

    it('handles null/undefined gracefully', () => {
        expect(sanitizeSearchInput(null)).toBe('')
        expect(sanitizeSearchInput(undefined)).toBe('')
    })

    it('enforces MAX_QUERY_LENGTH after sanitization', () => {
        const longInput = 'a'.repeat(200)
        expect(sanitizeSearchInput(longInput).length).toBe(100)
    })

    it('handles non-string input types', () => {
        expect(sanitizeSearchInput(12345)).toBe('')
        expect(sanitizeSearchInput({})).toBe('')
    })
})

// ── Permissions-Policy Fingerprinting Defense ───────────────────────
// Newer browser APIs that enable user tracking/fingerprinting must be
// explicitly blocked. These are often missed in initial security configs.

describe('Permissions-Policy anti-fingerprinting', () => {
    const vercelConfig = JSON.parse(
        readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')
    )
    const globalRule = vercelConfig.headers.find(h => h.source === '/(.*)')
    const pp = globalRule?.headers.find(h => h.key === 'Permissions-Policy')?.value

    it('blocks Topics API (FLoC successor for ad tracking)', () => {
        // Google's Topics API assigns interest categories to users based on
        // browsing history. No video portfolio needs to participate in ad auctions.
        expect(pp).toContain('browsing-topics=()')
    })

    it('blocks local font enumeration (fingerprinting vector)', () => {
        // The Local Font Access API exposes installed fonts, which creates
        // a high-entropy fingerprint (font lists are nearly unique per device).
        expect(pp).toContain('local-fonts=()')
    })

    it('blocks window management API (multi-screen fingerprinting)', () => {
        // Window Management API exposes number of screens, their resolution,
        // and arrangement — another fingerprinting vector.
        expect(pp).toContain('window-management=()')
    })
})
