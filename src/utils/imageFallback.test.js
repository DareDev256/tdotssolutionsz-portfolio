import { describe, it, expect } from 'vitest'
import { THUMBNAIL_FALLBACK } from './imageFallback.js'

/**
 * Tests for the SVG thumbnail fallback data URI.
 * Validates structure, dimensions, and safety properties.
 */

describe('THUMBNAIL_FALLBACK', () => {
    it('is a data:image/svg+xml URI', () => {
        expect(THUMBNAIL_FALLBACK).toMatch(/^data:image\/svg\+xml,/)
    })

    it('contains valid SVG with 320×180 dimensions (16:9)', () => {
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).toContain('width="320"')
        expect(svg).toContain('height="180"')
        expect(svg).toContain('viewBox="0 0 320 180"')
    })

    it('contains play triangle indicator', () => {
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).toContain('<polygon')
        expect(svg).toContain('points=')
    })

    it('contains "No Preview" text', () => {
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).toContain('No Preview')
    })

    it('uses dark background matching site theme', () => {
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).toContain('fill="#0a0a1a"')
    })

    it('uses synthwave pink for play icon', () => {
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).toContain('fill="#ff6ec7"')
    })

    it('is a self-contained URI with no external references', () => {
        // Must not reference external URLs — offline safety
        // (xmlns="http://www.w3.org/2000/svg" is the SVG namespace, not a fetch target)
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).not.toMatch(/href/)
        expect(svg).not.toMatch(/xlink/)
        expect(svg).not.toMatch(/<image/)
        expect(svg).not.toMatch(/<use/)
        // No http URLs besides the SVG namespace
        const httpMatches = svg.match(/https?:\/\//g) || []
        const namespaceMatches = svg.match(/http:\/\/www\.w3\.org/g) || []
        expect(httpMatches.length).toBe(namespaceMatches.length)
    })

    it('does not contain script tags or event handlers (XSS safety)', () => {
        const svg = decodeURIComponent(THUMBNAIL_FALLBACK.replace('data:image/svg+xml,', ''))
        expect(svg).not.toMatch(/<script/i)
        expect(svg).not.toMatch(/on\w+=/i)
        expect(svg).not.toContain('javascript:')
    })

    it('is usable as an img src attribute value', () => {
        // Must be a string that starts with "data:" — browsers accept this in <img src>
        expect(typeof THUMBNAIL_FALLBACK).toBe('string')
        expect(THUMBNAIL_FALLBACK.startsWith('data:')).toBe(true)
        // Must not contain unescaped characters that break HTML attributes
        expect(THUMBNAIL_FALLBACK).not.toContain('"')
    })
})
