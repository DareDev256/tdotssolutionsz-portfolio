import { describe, it, expect } from 'vitest'
import photos from '../data/photos.json'

/**
 * Tests for PhotoGallery.jsx logic: photo source paths, category filtering,
 * lightbox navigation wrapping, and CATEGORIES/CATEGORY_DIRS consistency.
 * Replicates pure functions from the component to test without React rendering
 * (same pattern as MobileApp.test.js).
 */

// ── Replicate PhotoGallery's constants and pure functions ──

const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'portraits', label: 'Portraits' },
    { key: 'artist', label: 'Artist' },
    { key: 'events', label: 'Events' },
    { key: 'street', label: 'Street' },
]

const CATEGORY_DIRS = {
    portraits: 'portraits',
    artist: 'artist',
    events: 'events',
    street: 'street',
}

function getPhotoSrc(photo) {
    return `/photos/${CATEGORY_DIRS[photo.category]}/${photo.filename}`
}

function filterPhotos(activeCategory) {
    return activeCategory === 'all'
        ? photos
        : photos.filter((p) => p.category === activeCategory)
}

// Lightbox wrap-around navigation (matches component's goPrev/goNext)
function goPrev(currentIndex, filteredLength) {
    return currentIndex > 0 ? currentIndex - 1 : filteredLength - 1
}

function goNext(currentIndex, filteredLength) {
    return currentIndex < filteredLength - 1 ? currentIndex + 1 : 0
}


describe('PhotoGallery: getPhotoSrc', () => {
    it('builds correct path for each category', () => {
        expect(getPhotoSrc({ category: 'portraits', filename: 'test.webp' }))
            .toBe('/photos/portraits/test.webp')
        expect(getPhotoSrc({ category: 'artist', filename: 'epk.webp' }))
            .toBe('/photos/artist/epk.webp')
        expect(getPhotoSrc({ category: 'events', filename: 'party.webp' }))
            .toBe('/photos/events/party.webp')
        expect(getPhotoSrc({ category: 'street', filename: 'urban.webp' }))
            .toBe('/photos/street/urban.webp')
    })

    it('every photo in dataset produces a valid path', () => {
        for (const photo of photos) {
            const src = getPhotoSrc(photo)
            expect(src).toMatch(/^\/photos\/(portraits|artist|events|street)\/.+\.webp$/)
        }
    })

    it('preserves filename exactly (no encoding issues)', () => {
        const photo = photos.find((p) => p.filename.includes('-'))
        if (photo) {
            expect(getPhotoSrc(photo)).toContain(photo.filename)
        }
    })
})

describe('PhotoGallery: category filtering', () => {
    it('"all" returns every photo', () => {
        expect(filterPhotos('all')).toHaveLength(photos.length)
    })

    it('each category filter returns only matching photos', () => {
        for (const cat of CATEGORIES.filter((c) => c.key !== 'all')) {
            const filtered = filterPhotos(cat.key)
            expect(filtered.length).toBeGreaterThan(0)
            expect(filtered.every((p) => p.category === cat.key)).toBe(true)
        }
    })

    it('category counts sum to total', () => {
        const sum = CATEGORIES
            .filter((c) => c.key !== 'all')
            .reduce((acc, cat) => acc + filterPhotos(cat.key).length, 0)
        expect(sum).toBe(photos.length)
    })

    it('CATEGORY_DIRS covers all photo categories in dataset', () => {
        const usedCategories = new Set(photos.map((p) => p.category))
        for (const cat of usedCategories) {
            expect(CATEGORY_DIRS).toHaveProperty(cat)
        }
    })

    it('CATEGORIES keys match CATEGORY_DIRS keys (excluding "all")', () => {
        const catKeys = CATEGORIES.filter((c) => c.key !== 'all').map((c) => c.key)
        const dirKeys = Object.keys(CATEGORY_DIRS)
        expect(catKeys.sort()).toEqual(dirKeys.sort())
    })
})

describe('PhotoGallery: lightbox navigation', () => {
    it('goNext advances index by 1', () => {
        expect(goNext(0, 10)).toBe(1)
        expect(goNext(4, 10)).toBe(5)
    })

    it('goNext wraps from last to first', () => {
        expect(goNext(9, 10)).toBe(0)
        expect(goNext(24, 25)).toBe(0)
    })

    it('goPrev decrements index by 1', () => {
        expect(goPrev(5, 10)).toBe(4)
        expect(goPrev(1, 10)).toBe(0)
    })

    it('goPrev wraps from first to last', () => {
        expect(goPrev(0, 10)).toBe(9)
        expect(goPrev(0, 25)).toBe(24)
    })

    it('single-item list stays at index 0', () => {
        expect(goNext(0, 1)).toBe(0)
        expect(goPrev(0, 1)).toBe(0)
    })

    it('full cycle through filtered category returns to start', () => {
        const filtered = filterPhotos('portraits')
        let idx = 0
        for (let step = 0; step < filtered.length; step++) {
            idx = goNext(idx, filtered.length)
        }
        expect(idx).toBe(0)
    })
})

describe('PhotoGallery: data consistency with component', () => {
    it('component displays correct total count', () => {
        // PhotoGallery renders: `${photos.length} PHOTOS — TORONTO CREATIVE PRODUCTION`
        expect(photos.length).toBe(25)
    })

    it('"All" tab count equals total photos', () => {
        // Component: cat.key === 'all' ? photos.length : photos.filter(...)
        expect(filterPhotos('all').length).toBe(photos.length)
    })

    it('each tab count is non-zero (no empty tabs displayed)', () => {
        for (const cat of CATEGORIES) {
            const count = filterPhotos(cat.key).length
            expect(count).toBeGreaterThan(0)
        }
    })
})
