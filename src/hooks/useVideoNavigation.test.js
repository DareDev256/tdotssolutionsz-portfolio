import { describe, it, expect } from 'vitest'
import { findVideoIndex, getNextIndex, getPrevIndex } from './useVideoNavigation'

const VIDEOS = [
    { id: 'a', title: 'First' },
    { id: 'b', title: 'Second' },
    { id: 'c', title: 'Third' },
]

describe('findVideoIndex', () => {
    it('returns index when video is in list', () => {
        expect(findVideoIndex(VIDEOS[0], VIDEOS)).toBe(0)
        expect(findVideoIndex(VIDEOS[1], VIDEOS)).toBe(1)
        expect(findVideoIndex(VIDEOS[2], VIDEOS)).toBe(2)
    })

    it('returns -1 for null currentVideo', () => {
        expect(findVideoIndex(null, VIDEOS)).toBe(-1)
    })

    it('returns -1 for empty list', () => {
        expect(findVideoIndex(VIDEOS[0], [])).toBe(-1)
    })

    it('returns -1 when video is not in list', () => {
        expect(findVideoIndex({ id: 'z' }, VIDEOS)).toBe(-1)
    })
})

describe('getNextIndex (circular)', () => {
    it('advances by one', () => {
        expect(getNextIndex(0, 3)).toBe(1)
        expect(getNextIndex(1, 3)).toBe(2)
    })

    it('wraps from last to first', () => {
        expect(getNextIndex(2, 3)).toBe(0)
    })

    it('returns -1 for invalid index', () => {
        expect(getNextIndex(-1, 3)).toBe(-1)
    })

    it('returns -1 for empty list', () => {
        expect(getNextIndex(0, 0)).toBe(-1)
    })

    it('handles single-item list (loops to self)', () => {
        expect(getNextIndex(0, 1)).toBe(0)
    })
})

describe('getPrevIndex (circular)', () => {
    it('goes back by one', () => {
        expect(getPrevIndex(2, 3)).toBe(1)
        expect(getPrevIndex(1, 3)).toBe(0)
    })

    it('wraps from first to last', () => {
        expect(getPrevIndex(0, 3)).toBe(2)
    })

    it('returns -1 for invalid index', () => {
        expect(getPrevIndex(-1, 3)).toBe(-1)
    })

    it('returns -1 for empty list', () => {
        expect(getPrevIndex(0, 0)).toBe(-1)
    })

    it('handles single-item list (loops to self)', () => {
        expect(getPrevIndex(0, 1)).toBe(0)
    })
})
