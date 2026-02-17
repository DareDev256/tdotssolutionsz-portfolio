import { describe, it, expect } from 'vitest'
import { VIDEOS } from '../utils/videoData.js'

/**
 * Tests CollabWeb's graph-building logic (buildCollabGraph + buildNetwork).
 * Reproduces module-private functions per project convention.
 */

function buildCollabGraph() {
  const collabs = []
  for (const v of VIDEOS) {
    const ftMatch = (v.title + ' ' + (v.description || '')).match(/ft\.?\s+(.+?)(?:\s*[-–—(]|$)/i)
    if (!ftMatch) continue
    const featured = ftMatch[1]
      .split(/[,&]/)
      .map(s => s.replace(/\(.*$/, '').trim())
      .filter(Boolean)
    for (const feat of featured) {
      collabs.push({ primary: v.artist, featured: feat, video: v })
    }
  }
  return collabs
}

function buildNetwork(collabs) {
  const nodeMap = new Map()
  const edges = []
  for (const c of collabs) {
    for (const name of [c.primary, c.featured]) {
      if (!nodeMap.has(name)) {
        nodeMap.set(name, { name, collabCount: 0, videos: [] })
      }
    }
    nodeMap.get(c.primary).collabCount++
    nodeMap.get(c.primary).videos.push(c.video)
    nodeMap.get(c.featured).collabCount++
    nodeMap.get(c.featured).videos.push(c.video)
    edges.push({ from: c.primary, to: c.featured, video: c.video })
  }
  const nodes = [...nodeMap.values()].sort((a, b) => b.collabCount - a.collabCount)
  return { nodes, edges }
}

describe('CollabWeb — buildCollabGraph', () => {
  const collabs = buildCollabGraph()

  it('returns a non-empty array of collaborations', () => {
    expect(Array.isArray(collabs)).toBe(true)
    expect(collabs.length).toBeGreaterThan(0)
  })

  it('every collab has primary, featured, and video fields', () => {
    for (const c of collabs) {
      expect(typeof c.primary).toBe('string')
      expect(c.primary.length).toBeGreaterThan(0)
      expect(typeof c.featured).toBe('string')
      expect(c.featured.length).toBeGreaterThan(0)
      expect(c.video).toHaveProperty('youtubeId')
    }
  })

  it('only includes videos that contain "ft." in title or description', () => {
    const ftVideos = VIDEOS.filter(v =>
      /ft\.?/i.test(v.title + ' ' + (v.description || ''))
    )
    // collabs count ≥ ftVideos because one video can produce multiple collabs (ft. A & B)
    expect(collabs.length).toBeGreaterThanOrEqual(ftVideos.length)
  })

  it('splits multi-artist features (comma/ampersand) into separate entries', () => {
    // Any video with "ft. X & Y" or "ft. X, Y" should produce 2+ collabs
    const multiArtist = VIDEOS.filter(v => {
      const text = v.title + ' ' + (v.description || '')
      const match = text.match(/ft\.?\s+(.+?)(?:\s*[-–—(]|$)/i)
      return match && /[,&]/.test(match[1])
    })
    if (multiArtist.length > 0) {
      const multiCollabs = collabs.filter(c =>
        multiArtist.some(v => v.youtubeId === c.video.youtubeId)
      )
      expect(multiCollabs.length).toBeGreaterThan(multiArtist.length)
    }
  })

  it('featured names are trimmed (no leading/trailing whitespace)', () => {
    for (const c of collabs) {
      expect(c.featured).toBe(c.featured.trim())
    }
  })
})

describe('CollabWeb — buildNetwork', () => {
  const collabs = buildCollabGraph()
  const { nodes, edges } = buildNetwork(collabs)

  it('nodes array is non-empty', () => {
    expect(nodes.length).toBeGreaterThan(0)
  })

  it('edges array matches collabs count', () => {
    expect(edges.length).toBe(collabs.length)
  })

  it('every node has name, collabCount, and videos array', () => {
    for (const n of nodes) {
      expect(typeof n.name).toBe('string')
      expect(typeof n.collabCount).toBe('number')
      expect(n.collabCount).toBeGreaterThan(0)
      expect(Array.isArray(n.videos)).toBe(true)
      expect(n.videos.length).toBeGreaterThan(0)
    }
  })

  it('nodes are sorted by collabCount descending', () => {
    for (let i = 1; i < nodes.length; i++) {
      expect(nodes[i - 1].collabCount).toBeGreaterThanOrEqual(nodes[i].collabCount)
    }
  })

  it('every edge references existing nodes', () => {
    const nameSet = new Set(nodes.map(n => n.name))
    for (const e of edges) {
      expect(nameSet.has(e.from)).toBe(true)
      expect(nameSet.has(e.to)).toBe(true)
    }
  })

  it('edge video objects have valid youtubeIds', () => {
    for (const e of edges) {
      expect(e.video.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/)
    }
  })

  it('total collabCount across nodes equals 2× edges (each edge counted on both sides)', () => {
    const totalCollabs = nodes.reduce((sum, n) => sum + n.collabCount, 0)
    expect(totalCollabs).toBe(edges.length * 2)
  })
})
