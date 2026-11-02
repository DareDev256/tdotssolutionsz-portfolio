import { describe, it, expect } from 'vitest'
import { renderStaticCopy } from '../../scripts/static-copy.mjs'
import { VIDEOS, PORTFOLIO_STATS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { WEB_PROJECTS } from './webProjects'
import { DOORS, DOORS_TO } from './doors'

const real = { videos: VIDEOS, stats: PORTFOLIO_STATS, projects: WEB_PROJECTS, doors: DOORS, inbox: DOORS_TO, formatViews }

describe('static copy (no-JS text inside #root)', () => {
  it('carries the same counts the hub shows, from the same modules', () => {
    const html = renderStaticCopy(real)
    expect(html).toContain(`${PORTFOLIO_STATS.totalVideos} films for ${PORTFOLIO_STATS.totalArtists} artists`)
    expect(html).toContain(`${formatViews(PORTFOLIO_STATS.totalViews)} plays`)
    for (const p of WEB_PROJECTS) expect(html).toContain(p.url.replace(/&/g, '&amp;'))
    for (const d of DOORS) expect(html).toContain(d.lines[0])
  })

  it('is enough text for a crawler that never runs JS', () => {
    const words = renderStaticCopy(real).replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}]+/gu) || []
    expect(words.length).toBeGreaterThan(150)
  })

  it('is visually hidden, so the locked hub never shows it', () => {
    expect(renderStaticCopy(real)).toMatch(/^<section[^>]*style="position:absolute;width:1px;height:1px;[^"]*clip-path:inset\(50%\)/)
  })

  it('escapes markup in data', () => {
    const html = renderStaticCopy({ ...real, projects: [{ name: '<b>x</b>', type: 'a"b', url: 'https://x.test/?a=1&b=2' }] })
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html).toContain('a&quot;b')
    expect(html).not.toContain('<b>x</b>')
  })

  it('refuses rather than ship an empty or zero-count block', () => {
    expect(() => renderStaticCopy({ ...real, projects: [] })).toThrow(/projects/)
    expect(() => renderStaticCopy({ ...real, stats: { ...PORTFOLIO_STATS, totalVideos: 0 } })).toThrow(/stats/)
    expect(() => renderStaticCopy({ ...real, videos: [] })).toThrow(/videos/)
  })
})
