import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { selectMonitors } from './HubPageCinema.jsx'
import { VIDEOS } from '../utils/videoData'

describe('homepage monitor wall', () => {
  const picked = selectMonitors(VIDEOS)

  it('shows the top 5 by views and the 7 newest, no repeats', () => {
    expect(picked).toHaveLength(12)
    expect(new Set(picked.map((v) => v.youtubeId)).size).toBe(12)
    const top5 = [...VIDEOS].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5).map((v) => v.youtubeId)
    top5.forEach((id) => expect(picked.map((v) => v.youtubeId)).toContain(id))
    const newest = [...VIDEOS].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))[0].youtubeId
    expect(picked.map((v) => v.youtubeId)).toContain(newest)
  })

  it('honours the owner calls: Only 1s out, Fire on the top row (slot < 4), not stacked on a dark tile', () => {
    const order = picked.map((v) => v.youtubeId)
    expect(order).not.toContain('hqnjuO9XMlQ')
    expect(order).toContain('0l5xIst3VME') // Soodope - WTF
    expect(order.indexOf('82_xVuYR45c')).toBeLessThan(4)
  })

  // A new upload enters the wall automatically; this goes red until its clip is built.
  it('every film on the wall has a preview clip', () => {
    const missing = picked.filter((v) => !existsSync(`public/previews/${v.youtubeId}.mp4`)).map((v) => v.youtubeId)
    expect(missing, `run: node scripts/build-preview-clips.mjs --ids=${missing.join(',')}`).toEqual([])
  })
})
