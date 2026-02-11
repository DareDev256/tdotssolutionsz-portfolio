import { describe, it, expect } from 'vitest'
import photos from './photos.json'

/** Valid categories matching PhotoGallery.jsx tab structure */
const VALID_CATEGORIES = new Set(['portraits', 'artist', 'events', 'street'])

/** Expected ID prefixes per category (convention from the dataset) */
const CATEGORY_PREFIX = { portraits: 'p', artist: 'a', events: 'e', street: 's' }

describe('photos.json — data integrity', () => {
    it('is a non-empty array', () => {
        expect(Array.isArray(photos)).toBe(true)
        expect(photos.length).toBeGreaterThan(0)
    })

    it('every entry has all required fields as non-empty strings', () => {
        const REQUIRED = ['id', 'filename', 'title', 'category', 'subject', 'description', 'camera']
        for (const photo of photos) {
            for (const field of REQUIRED) {
                expect(typeof photo[field], `${photo.id}.${field} should be string`).toBe('string')
                expect(photo[field].trim().length, `${photo.id}.${field} should not be empty`).toBeGreaterThan(0)
            }
        }
    })

    it('all IDs are unique', () => {
        const ids = photos.map(p => p.id)
        expect(new Set(ids).size).toBe(ids.length)
    })

    it('all filenames are unique', () => {
        const filenames = photos.map(p => p.filename)
        expect(new Set(filenames).size).toBe(filenames.length)
    })

    it('every category is one of the valid gallery tabs', () => {
        for (const photo of photos) {
            expect(VALID_CATEGORIES.has(photo.category),
                `"${photo.category}" is not a valid category for ${photo.id}`
            ).toBe(true)
        }
    })

    it('all filenames use .webp extension', () => {
        for (const photo of photos) {
            expect(photo.filename.endsWith('.webp'),
                `${photo.id} filename "${photo.filename}" should be .webp`
            ).toBe(true)
        }
    })

    it('ID prefix matches category convention (p=portraits, a=artist, e=events, s=street)', () => {
        for (const photo of photos) {
            const expectedPrefix = CATEGORY_PREFIX[photo.category]
            expect(photo.id.startsWith(expectedPrefix),
                `${photo.id} should start with "${expectedPrefix}" for category "${photo.category}"`
            ).toBe(true)
        }
    })

    it('every category has at least one photo', () => {
        for (const cat of VALID_CATEGORIES) {
            const count = photos.filter(p => p.category === cat).length
            expect(count, `category "${cat}" should have at least 1 photo`).toBeGreaterThan(0)
        }
    })

    it('no entry has unexpected extra fields (schema guard)', () => {
        const ALLOWED = new Set(['id', 'filename', 'title', 'category', 'subject', 'description', 'camera'])
        for (const photo of photos) {
            const extra = Object.keys(photo).filter(k => !ALLOWED.has(k))
            expect(extra, `${photo.id} has unexpected fields: ${extra.join(', ')}`).toEqual([])
        }
    })
})
