import { describe, it, expect } from 'vitest'
import { DECEASED_ARTISTS, isDeceasedArtist, ALL_ARTISTS, VIDEOS } from './videoData.js'

describe('DECEASED_ARTISTS', () => {
    it('is a non-empty Set', () => {
        expect(DECEASED_ARTISTS).toBeInstanceOf(Set)
        expect(DECEASED_ARTISTS.size).toBeGreaterThan(0)
    })

    it('every deceased artist appears in at least one video', () => {
        const videoArtists = new Set(VIDEOS.flatMap(v =>
            v.artist.split(',').map(a => a.trim())
        ))
        for (const name of DECEASED_ARTISTS) {
            expect(videoArtists.has(name),
                `"${name}" is in DECEASED_ARTISTS but not found in any video`
            ).toBe(true)
        }
    })
})

describe('isDeceasedArtist', () => {
    it('returns true for a known deceased artist', () => {
        for (const name of DECEASED_ARTISTS) {
            expect(isDeceasedArtist(name)).toBe(true)
        }
    })

    it('returns false for a living artist', () => {
        const living = ALL_ARTISTS.find(a => !DECEASED_ARTISTS.has(a))
        expect(living).toBeTruthy()
        expect(isDeceasedArtist(living)).toBe(false)
    })

    it('detects deceased artist in comma-separated multi-artist string', () => {
        const deceased = [...DECEASED_ARTISTS][0]
        expect(isDeceasedArtist(`SomeArtist, ${deceased}`)).toBe(true)
        expect(isDeceasedArtist(`${deceased}, SomeArtist`)).toBe(true)
    })

    it('trims whitespace around names in multi-artist strings', () => {
        const deceased = [...DECEASED_ARTISTS][0]
        expect(isDeceasedArtist(`  ${deceased}  `)).toBe(true)
        expect(isDeceasedArtist(`Other ,  ${deceased}  , Another`)).toBe(true)
    })

    it('returns false for null, undefined, and empty string', () => {
        expect(isDeceasedArtist(null)).toBe(false)
        expect(isDeceasedArtist(undefined)).toBe(false)
        expect(isDeceasedArtist('')).toBe(false)
    })

    it('returns false for partial name matches (not substring matching)', () => {
        expect(isDeceasedArtist('Murdaman')).toBe(false)
        expect(isDeceasedArtist('BGMusic')).toBe(false)
    })

    it('is case-sensitive (exact match required)', () => {
        const deceased = [...DECEASED_ARTISTS][0]
        expect(isDeceasedArtist(deceased.toLowerCase())).toBe(
            DECEASED_ARTISTS.has(deceased.toLowerCase())
        )
    })
})
