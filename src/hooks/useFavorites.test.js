import { describe, it, expect, beforeEach, vi } from 'vitest'

const STORAGE_KEY = 'tdots-favorites'

// Mock localStorage before importing module
const store = {}
const mockLocalStorage = {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = val }),
    clear: vi.fn(() => { for (const k in store) delete store[k] })
}
vi.stubGlobal('localStorage', mockLocalStorage)

const { readFavorites } = await import('./useFavorites.js')

describe('readFavorites (localStorage validation)', () => {
    beforeEach(() => {
        mockLocalStorage.clear()
        vi.clearAllMocks()
    })

    it('returns empty array when nothing stored', () => {
        expect(readFavorites()).toEqual([])
    })

    it('returns valid YouTube IDs from storage', () => {
        store[STORAGE_KEY] = JSON.stringify(['dQw4w9WgXcQ', 'Xedv19NEX-E'])
        expect(readFavorites()).toEqual(['dQw4w9WgXcQ', 'Xedv19NEX-E'])
    })

    it('filters out invalid entries (XSS/injection prevention)', () => {
        store[STORAGE_KEY] = JSON.stringify([
            'dQw4w9WgXcQ',
            '<script>xss',
            '../../passwd',
            42,
            null,
            'Xedv19NEX-E'
        ])
        expect(readFavorites()).toEqual(['dQw4w9WgXcQ', 'Xedv19NEX-E'])
    })

    it('returns empty array for non-array JSON (prototype pollution guard)', () => {
        store[STORAGE_KEY] = '{"__proto__":{"isAdmin":true}}'
        expect(readFavorites()).toEqual([])
    })

    it('returns empty array for corrupted JSON', () => {
        store[STORAGE_KEY] = 'not-valid-json{{{'
        expect(readFavorites()).toEqual([])
    })

    it('caps favorites at 500 to prevent storage abuse', () => {
        const ids = Array.from({ length: 600 }, (_, i) =>
            `abcdefghij${String(i).padStart(1, '0')}`.slice(0, 11)
        ).filter(id => /^[A-Za-z0-9_-]{11}$/.test(id))
        store[STORAGE_KEY] = JSON.stringify(ids)
        expect(readFavorites().length).toBeLessThanOrEqual(500)
    })
})
