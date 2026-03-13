import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isDangerousScheme, safeReplaceState, safeJsonParse } from './urlSafety'

// ── Dangerous Scheme Detection ──────────────────────────────────────

describe('isDangerousScheme', () => {
    it('detects javascript: protocol', () => {
        expect(isDangerousScheme('javascript:alert(1)')).toBe(true)
    })

    it('detects data: protocol', () => {
        expect(isDangerousScheme('data:text/html,<script>alert(1)</script>')).toBe(true)
    })

    it('detects vbscript: protocol', () => {
        expect(isDangerousScheme('vbscript:MsgBox("xss")')).toBe(true)
    })

    it('detects blob: protocol', () => {
        expect(isDangerousScheme('blob:https://evil.com/uuid')).toBe(true)
    })

    it('catches case-insensitive variants', () => {
        expect(isDangerousScheme('JAVASCRIPT:void(0)')).toBe(true)
        expect(isDangerousScheme('JaVaScRiPt:alert(1)')).toBe(true)
        expect(isDangerousScheme('DATA:text/html,x')).toBe(true)
    })

    it('catches leading-whitespace bypass attempts', () => {
        expect(isDangerousScheme('  javascript:alert(1)')).toBe(true)
        expect(isDangerousScheme('\tjavascript:void(0)')).toBe(true)
        expect(isDangerousScheme('\ndata:text/html,x')).toBe(true)
    })

    it('allows https: URLs', () => {
        expect(isDangerousScheme('https://youtube.com')).toBe(false)
    })

    it('allows http: URLs', () => {
        expect(isDangerousScheme('http://localhost:3000')).toBe(false)
    })

    it('allows relative URLs', () => {
        expect(isDangerousScheme('?v=abc123_DEFg')).toBe(false)
        expect(isDangerousScheme('/path/to/page')).toBe(false)
    })

    it('returns false for null/undefined/empty', () => {
        expect(isDangerousScheme(null)).toBe(false)
        expect(isDangerousScheme(undefined)).toBe(false)
        expect(isDangerousScheme('')).toBe(false)
    })

    it('returns false for non-string types', () => {
        expect(isDangerousScheme(42)).toBe(false)
        expect(isDangerousScheme({})).toBe(false)
    })
})

// ── Safe replaceState ───────────────────────────────────────────────

describe('safeReplaceState', () => {
    let replaceSpy

    beforeEach(() => {
        // Provide window.history stub in Node test environment
        if (typeof window === 'undefined') {
            globalThis.window = { history: { replaceState: vi.fn() } }
        }
        replaceSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
    })

    afterEach(() => {
        replaceSpy?.mockRestore()
    })

    it('allows relative query strings', () => {
        expect(safeReplaceState('?v=dQw4w9WgXcQ')).toBe(true)
        expect(replaceSpy).toHaveBeenCalledWith(null, '', '?v=dQw4w9WgXcQ')
    })

    it('allows relative paths', () => {
        expect(safeReplaceState('/videos')).toBe(true)
        expect(replaceSpy).toHaveBeenCalledWith(null, '', '/videos')
    })

    it('allows bare pathnames', () => {
        expect(safeReplaceState('/')).toBe(true)
    })

    it('blocks absolute URLs (open redirect prevention)', () => {
        expect(safeReplaceState('https://evil.com')).toBe(false)
        expect(replaceSpy).not.toHaveBeenCalled()
    })

    it('blocks protocol-relative URLs', () => {
        expect(safeReplaceState('//evil.com/path')).toBe(false)
        expect(replaceSpy).not.toHaveBeenCalled()
    })

    it('blocks javascript: scheme', () => {
        expect(safeReplaceState('javascript:alert(1)')).toBe(false)
        expect(replaceSpy).not.toHaveBeenCalled()
    })

    it('blocks data: scheme', () => {
        expect(safeReplaceState('data:text/html,<h1>phish</h1>')).toBe(false)
        expect(replaceSpy).not.toHaveBeenCalled()
    })

    it('returns false for null/empty', () => {
        expect(safeReplaceState(null)).toBe(false)
        expect(safeReplaceState('')).toBe(false)
    })

    it('gracefully handles replaceState throwing', () => {
        replaceSpy.mockImplementation(() => { throw new Error('SecurityError') })
        expect(safeReplaceState('?v=test123test')).toBe(false)
    })
})

// ── Safe JSON Parse ─────────────────────────────────────────────────

describe('safeJsonParse', () => {
    it('parses valid JSON arrays', () => {
        expect(safeJsonParse('["a","b","c"]')).toEqual(['a', 'b', 'c'])
    })

    it('parses valid JSON objects', () => {
        expect(safeJsonParse('{"key":"value"}')).toEqual({ key: 'value' })
    })

    it('strips __proto__ keys (prototype pollution prevention)', () => {
        const malicious = '{"__proto__":{"polluted":true},"safe":"value"}'
        const result = safeJsonParse(malicious)
        expect(result).toEqual({ safe: 'value' })
        expect(Object.prototype.polluted).toBeUndefined()
    })

    it('strips constructor keys', () => {
        const malicious = '{"constructor":{"prototype":{"pwned":true}},"ok":1}'
        const result = safeJsonParse(malicious)
        expect(result).toEqual({ ok: 1 })
    })

    it('strips prototype keys', () => {
        const malicious = '{"prototype":{"injected":true},"data":"safe"}'
        const result = safeJsonParse(malicious)
        expect(result).toEqual({ data: 'safe' })
    })

    it('strips nested __proto__ inside arrays', () => {
        const malicious = '[{"__proto__":{"isAdmin":true},"id":"abc"}]'
        const result = safeJsonParse(malicious)
        expect(result).toEqual([{ id: 'abc' }])
        expect(Object.prototype.isAdmin).toBeUndefined()
    })

    it('returns fallback for invalid JSON', () => {
        expect(safeJsonParse('not json', [])).toEqual([])
        expect(safeJsonParse('{broken', 'default')).toBe('default')
    })

    it('returns null fallback by default', () => {
        expect(safeJsonParse('{')).toBeNull()
    })

    it('returns fallback for null/undefined/empty', () => {
        expect(safeJsonParse(null, [])).toEqual([])
        expect(safeJsonParse(undefined, [])).toEqual([])
        expect(safeJsonParse('', [])).toEqual([])
    })

    it('returns fallback for non-string types', () => {
        expect(safeJsonParse(42, 'nope')).toBe('nope')
    })

    it('preserves legitimate nested objects', () => {
        const safe = '{"user":{"name":"Drake","views":1000}}'
        expect(safeJsonParse(safe)).toEqual({ user: { name: 'Drake', views: 1000 } })
    })
})
