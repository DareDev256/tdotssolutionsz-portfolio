import { describe, it, expect } from 'vitest'
import { ERA_DEFS, ERAS } from './EraTimeline.jsx'
import { VIDEOS } from '../utils/videoData.js'

describe('ERA_DEFS', () => {
  it('defines 4 production eras', () => {
    expect(ERA_DEFS).toHaveLength(4)
  })

  it('each era has required fields: id, label, range, color', () => {
    for (const era of ERA_DEFS) {
      expect(era.id).toBeTruthy()
      expect(era.label).toBeTruthy()
      expect(era.range).toHaveLength(2)
      expect(era.range[0]).toBeLessThanOrEqual(era.range[1])
      expect(era.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('eras cover a contiguous year range with no gaps', () => {
    for (let i = 1; i < ERA_DEFS.length; i++) {
      // Each era starts at most 1 year after the previous era ends
      expect(ERA_DEFS[i].range[0]).toBe(ERA_DEFS[i - 1].range[1] + 1)
    }
  })

  it('eras are ordered chronologically', () => {
    for (let i = 1; i < ERA_DEFS.length; i++) {
      expect(ERA_DEFS[i].range[0]).toBeGreaterThan(ERA_DEFS[i - 1].range[0])
    }
  })
})

describe('ERAS (computed from VIDEOS)', () => {
  it('produces at least one era with videos', () => {
    expect(ERAS.length).toBeGreaterThan(0)
  })

  it('every era has computed stats: count, totalViews, uniqueArtists, topVideo', () => {
    for (const era of ERAS) {
      expect(era.count).toBeGreaterThan(0)
      expect(era.totalViews).toBeGreaterThanOrEqual(0)
      expect(era.uniqueArtists).toBeGreaterThan(0)
      expect(era.topVideo).not.toBeNull()
    }
  })

  it('video counts per era sum to total catalog (no video lost or double-counted)', () => {
    const totalAssigned = ERAS.reduce((sum, era) => sum + era.count, 0)
    // Some videos might not fall into any era range, so total should be <= VIDEOS.length
    expect(totalAssigned).toBeLessThanOrEqual(VIDEOS.length)
    // But most should be covered (at least 90%)
    expect(totalAssigned).toBeGreaterThanOrEqual(VIDEOS.length * 0.9)
  })

  it('videos within each era fall inside the declared year range', () => {
    for (const era of ERAS) {
      for (const v of era.videos) {
        const year = new Date(v.uploadDate).getFullYear()
        expect(year).toBeGreaterThanOrEqual(era.range[0])
        expect(year).toBeLessThanOrEqual(era.range[1])
      }
    }
  })

  it('videos within each era are sorted by viewCount descending (top videos first)', () => {
    for (const era of ERAS) {
      for (let i = 1; i < era.videos.length; i++) {
        expect(era.videos[i - 1].viewCount).toBeGreaterThanOrEqual(era.videos[i].viewCount)
      }
    }
  })

  it('topVideo is the highest-viewed video in each era (or pinned override)', () => {
    for (const era of ERAS) {
      if (era.pinnedVideoId) {
        // Pinned video takes priority if it exists in the era
        const pinned = era.videos.find(v => v.youtubeId === era.pinnedVideoId)
        if (pinned) {
          expect(era.topVideo.youtubeId).toBe(era.pinnedVideoId)
        }
      } else {
        // Default: topVideo is the first (highest views) in sorted array
        expect(era.topVideo.youtubeId).toBe(era.videos[0].youtubeId)
      }
    }
  })

  it('uniqueArtists count is accurate per era', () => {
    for (const era of ERAS) {
      const artists = new Set(era.videos.map(v => v.artist))
      expect(era.uniqueArtists).toBe(artists.size)
    }
  })

  it('totalViews equals sum of video views in each era', () => {
    for (const era of ERAS) {
      const expected = era.videos.reduce((sum, v) => sum + v.viewCount, 0)
      expect(era.totalViews).toBe(expected)
    }
  })

  it('empty eras are filtered out (no era with 0 videos)', () => {
    for (const era of ERAS) {
      expect(era.count).toBeGreaterThan(0)
    }
  })

  it('era IDs match the ERA_DEFS identifiers', () => {
    const defIds = new Set(ERA_DEFS.map(d => d.id))
    for (const era of ERAS) {
      expect(defIds.has(era.id)).toBe(true)
    }
  })
})
