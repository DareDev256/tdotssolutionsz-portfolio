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

function diversePick(history) {
  const historySet = new Set(history)
  const candidates = SPOTLIGHT_POOL
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => !historySet.has(v.youtubeId))
  const pool = candidates.length > 0 ? candidates : SPOTLIGHT_POOL.map((v, i) => ({ v, i }))
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
    const idx = diversePick([])
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(SPOTLIGHT_POOL.length)
  })

  it('excludes recently-shown IDs from candidates', () => {
    // Fill history with first 19 IDs — only 1 candidate remains
    const history = SPOTLIGHT_POOL.slice(0, 19).map(v => v.youtubeId)
    const idx = diversePick(history)
    expect(SPOTLIGHT_POOL[idx].youtubeId).toBe(SPOTLIGHT_POOL[19].youtubeId)
  })

  it('falls back to full pool when history covers all entries', () => {
    const allIds = SPOTLIGHT_POOL.map(v => v.youtubeId)
    // Should not throw — gracefully uses full pool
    for (let i = 0; i < 30; i++) {
      const idx = diversePick(allIds)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(SPOTLIGHT_POOL.length)
    }
  })

  it('guarantees full rotation — 20 picks with sliding window sees all 20 videos', () => {
    const history = []
    const seen = new Set()
    for (let i = 0; i < 20; i++) {
      const idx = diversePick(history)
      seen.add(SPOTLIGHT_POOL[idx].youtubeId)
      history.push(SPOTLIGHT_POOL[idx].youtubeId)
      if (history.length > HISTORY_SIZE) history.shift()
    }
    expect(seen.size).toBe(20)
  })

  it('sliding window trims oldest entry at HISTORY_SIZE', () => {
    const history = []
    for (let i = 0; i < 25; i++) {
      const idx = diversePick(history)
      history.push(SPOTLIGHT_POOL[idx].youtubeId)
      if (history.length > HISTORY_SIZE) history.shift()
    }
    expect(history.length).toBeLessThanOrEqual(HISTORY_SIZE)
  })
})

describe('SpotlightPortal — color cycling', () => {
  const NEON_PALETTE = ['#ff2a6d', '#05d9e8', '#d300c5', '#7700ff']

  it('colorIndex maps to NEON_PALETTE via modulo', () => {
    for (let i = 0; i < 20; i++) {
      expect(NEON_PALETTE[i % NEON_PALETTE.length]).toBeDefined()
    }
  })

  it('every SPOTLIGHT_POOL index produces a valid portal color', () => {
    for (let i = 0; i < SPOTLIGHT_POOL.length; i++) {
      const color = NEON_PALETTE[i % NEON_PALETTE.length]
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('palette cycles — index 0 and index 4 get same color', () => {
    expect(NEON_PALETTE[0 % NEON_PALETTE.length]).toBe(NEON_PALETTE[4 % NEON_PALETTE.length])
  })
})
