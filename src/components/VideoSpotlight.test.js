import { describe, it, expect } from 'vitest'
import { VIDEOS } from '../utils/videoData.js'

/**
 * Tests VideoSpotlight's sliding-window diversity buffer logic.
 * Reproduces the diversePick algorithm (module-private) per project convention.
 */

const SPOTLIGHT_POOL = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 20)

const HISTORY_SIZE = Math.max(1, SPOTLIGHT_POOL.length - 1)

function diversePick(history, currentId) {
  const excludeSet = new Set(history)
  if (currentId) excludeSet.add(currentId)
  const candidates = SPOTLIGHT_POOL
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => !excludeSet.has(v.youtubeId))
  const pool = candidates.length > 0
    ? candidates
    : SPOTLIGHT_POOL
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v.youtubeId !== currentId)
  return pool[Math.floor(Math.random() * pool.length)].i
}

describe('VideoSpotlight — SPOTLIGHT_POOL construction', () => {
  it('contains exactly 20 videos', () => {
    expect(SPOTLIGHT_POOL).toHaveLength(20)
  })

  it('is sorted by viewCount descending', () => {
    for (let i = 1; i < SPOTLIGHT_POOL.length; i++) {
      expect(SPOTLIGHT_POOL[i - 1].viewCount).toBeGreaterThanOrEqual(SPOTLIGHT_POOL[i].viewCount)
    }
  })

  it('every pool entry has a valid youtubeId', () => {
    for (const v of SPOTLIGHT_POOL) {
      expect(v.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('HISTORY_SIZE is pool - 1 (full rotation before repeat)', () => {
    expect(HISTORY_SIZE).toBe(SPOTLIGHT_POOL.length - 1)
    expect(HISTORY_SIZE).toBe(19)
  })
})

describe('VideoSpotlight — diversePick sliding-window logic', () => {
  it('returns a valid index into SPOTLIGHT_POOL', () => {
    const idx = diversePick([], null)
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(SPOTLIGHT_POOL.length)
  })

  it('excludes recently-shown IDs from candidates', () => {
    // Fill history with first 19 IDs — only 1 candidate remains
    const history = SPOTLIGHT_POOL.slice(0, 19).map(v => v.youtubeId)
    const idx = diversePick(history, null)
    expect(SPOTLIGHT_POOL[idx].youtubeId).toBe(SPOTLIGHT_POOL[19].youtubeId)
  })

  it('never returns the currently displayed video (no ghost shuffles)', () => {
    const currentId = SPOTLIGHT_POOL[0].youtubeId
    // Run 100 picks — none should match the current video
    for (let i = 0; i < 100; i++) {
      const idx = diversePick([], currentId)
      expect(SPOTLIGHT_POOL[idx].youtubeId).not.toBe(currentId)
    }
  })

  it('excludes currentId even when history is empty', () => {
    const currentId = SPOTLIGHT_POOL[5].youtubeId
    for (let i = 0; i < 50; i++) {
      const idx = diversePick([], currentId)
      expect(SPOTLIGHT_POOL[idx].youtubeId).not.toBe(currentId)
    }
  })

  it('falls back to full pool minus current when history covers all entries', () => {
    const allIds = SPOTLIGHT_POOL.map(v => v.youtubeId)
    const currentId = SPOTLIGHT_POOL[0].youtubeId
    // Should not throw — gracefully uses full pool minus current
    for (let i = 0; i < 30; i++) {
      const idx = diversePick(allIds, currentId)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(SPOTLIGHT_POOL.length)
      expect(SPOTLIGHT_POOL[idx].youtubeId).not.toBe(currentId)
    }
  })

  it('guarantees full rotation — 20 picks with sliding window sees all 20 videos', () => {
    const history = []
    const seen = new Set()
    let currentId = null
    for (let i = 0; i < 20; i++) {
      const idx = diversePick(history, currentId)
      currentId = SPOTLIGHT_POOL[idx].youtubeId
      seen.add(currentId)
      history.push(currentId)
      if (history.length > HISTORY_SIZE) history.shift()
    }
    expect(seen.size).toBe(20)
  })

  it('sliding window trims oldest entry at HISTORY_SIZE', () => {
    const history = []
    let currentId = null
    for (let i = 0; i < 25; i++) {
      const idx = diversePick(history, currentId)
      currentId = SPOTLIGHT_POOL[idx].youtubeId
      history.push(currentId)
      if (history.length > HISTORY_SIZE) history.shift()
    }
    expect(history.length).toBeLessThanOrEqual(HISTORY_SIZE)
  })
})
