import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatViews, formatYear, formatDate } from './formatters'

describe('formatViews', () => {
    it('formats millions with 1 decimal', () => {
        expect(formatViews(1000000)).toBe('1.0M')
        expect(formatViews(5700000)).toBe('5.7M')
        expect(formatViews(1500000)).toBe('1.5M')
        expect(formatViews(12345678)).toBe('12.3M')
    })

    it('formats thousands with no decimal', () => {
        expect(formatViews(1000)).toBe('1K')
        expect(formatViews(5200)).toBe('5K')
        expect(formatViews(999999)).toBe('1000K')
        expect(formatViews(252000)).toBe('252K')
    })

    it('returns raw number as string below 1000', () => {
        expect(formatViews(0)).toBe('0')
        expect(formatViews(1)).toBe('1')
        expect(formatViews(999)).toBe('999')
        expect(formatViews(500)).toBe('500')
    })

    it('handles boundary at exactly 1000 and 1000000', () => {
        expect(formatViews(999)).toBe('999')
        expect(formatViews(1000)).toBe('1K')
        expect(formatViews(999999)).toBe('1000K')
        expect(formatViews(1000000)).toBe('1.0M')
    })
})

describe('formatYear', () => {
    it('extracts year from ISO date strings', () => {
        expect(formatYear('2024-06-15')).toBe('2024')
        expect(formatYear('2013-03-15')).toBe('2013')
        expect(formatYear('2026-02-10')).toBe('2026')
    })

    it('extracts year from full ISO datetime strings', () => {
        expect(formatYear('2024-06-15T12:00:00Z')).toBe('2024')
    })
})

describe('formatDate (relative time)', () => {
    let now

    beforeEach(() => {
        now = new Date('2026-02-10T12:00:00Z')
        vi.useFakeTimers()
        vi.setSystemTime(now)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('shows days for dates < 7 days ago', () => {
        const result = formatDate('2026-02-07T12:00:00Z')
        expect(result).toMatch(/^\dd ago$/)
    })

    it('shows weeks for dates 7-29 days ago', () => {
        const result = formatDate('2026-01-27T12:00:00Z')
        expect(result).toBe('2w ago')
    })

    it('shows months for dates 30-364 days ago', () => {
        const result = formatDate('2025-11-10T12:00:00Z')
        expect(result).toBe('3mo ago')
    })

    it('shows years for dates 365+ days ago', () => {
        const result = formatDate('2024-02-10T12:00:00Z')
        expect(result).toBe('2y ago')
    })

    it('handles boundary at exactly 7 days', () => {
        const result = formatDate('2026-02-03T12:00:00Z')
        expect(result).toBe('1w ago')
    })
})
