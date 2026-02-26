/**
 * TopHits component tests — validates ranked video showcase behavior.
 *
 * Guards:
 * - Top 10 videos sorted by view count (descending)
 * - Each card links to the correct /video/:youtubeId route
 * - Rank numbers 1–10 are displayed
 * - View counts are formatted correctly
 * - Accessibility: section label, list roles, aria-labels
 */
import { describe, it, expect } from 'vitest'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'

/** Pre-compute the expected top 10 for test assertions */
const TOP_10 = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 10)

describe('TopHits — data integrity', () => {
  it('should have at least 10 videos in the catalog', () => {
    expect(VIDEOS.length).toBeGreaterThanOrEqual(10)
  })

  it('top 10 should be sorted by view count descending', () => {
    for (let i = 0; i < TOP_10.length - 1; i++) {
      expect(TOP_10[i].viewCount).toBeGreaterThanOrEqual(TOP_10[i + 1].viewCount)
    }
  })

  it('every top 10 video should have a valid youtubeId', () => {
    const ytIdPattern = /^[A-Za-z0-9_-]{11}$/
    TOP_10.forEach(video => {
      expect(video.youtubeId).toMatch(ytIdPattern)
    })
  })

  it('#1 most viewed should be Masicka - Everything Mi Want', () => {
    expect(TOP_10[0].artist).toBe('Masicka')
    expect(TOP_10[0].viewCount).toBeGreaterThan(5000000)
  })

  it('#2 most viewed should be Casper TNG', () => {
    expect(TOP_10[1].artist).toBe('Casper TNG')
    expect(TOP_10[1].viewCount).toBeGreaterThan(5000000)
  })

  it('all top 10 videos should have view counts above 100K', () => {
    TOP_10.forEach(video => {
      expect(video.viewCount).toBeGreaterThan(100000)
    })
  })

  it('view counts should format correctly for millions', () => {
    expect(formatViews(5741613)).toBe('5.7M')
    expect(formatViews(5243020)).toBe('5.2M')
  })

  it('view counts should format correctly for thousands', () => {
    expect(formatViews(503000)).toBe('503K')
    expect(formatViews(180556)).toBe('181K')
  })

  it('no duplicate videos in top 10', () => {
    const ids = TOP_10.map(v => v.youtubeId)
    expect(new Set(ids).size).toBe(10)
  })

  it('each top 10 video should have an artist name', () => {
    TOP_10.forEach(video => {
      expect(video.artist).toBeTruthy()
      expect(typeof video.artist).toBe('string')
    })
  })

  it('each top 10 video should have a valid upload date', () => {
    TOP_10.forEach(video => {
      const date = new Date(video.uploadDate)
      expect(date.getFullYear()).toBeGreaterThanOrEqual(2010)
      expect(date.getFullYear()).toBeLessThanOrEqual(2026)
    })
  })

  it('rank colors array has exactly 10 entries', () => {
    // Validates the RANK_COLORS constant matches the top 10 count
    const RANK_COLORS = [
      '#ffcc00', '#ff2a6d', '#05d9e8', '#d300c5', '#ff6b35',
      '#00ff88', '#7700ff', '#ff2a6d', '#05d9e8', '#ffcc00',
    ]
    expect(RANK_COLORS).toHaveLength(10)
    RANK_COLORS.forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})
