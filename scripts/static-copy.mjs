/**
 * static-copy.mjs (6.19.0): the hub's words as plain HTML inside #root, for every reader that never runs
 * JavaScript. AI search crawlers (GPTBot, ClaudeBot, PerplexityBot) read the served document only, and before
 * this the served document held 58 words (seo-geo-audit, 2026-11-01). React's createRoot replaces #root on
 * mount, and the block is visually hidden, so a visitor never sees it; screen readers and crawlers do.
 *
 * Every figure and line comes from the same modules the hub renders (videoData, webProjects, doors), at build
 * time, so this copy cannot drift from the page. It refuses (throws, failing the build) rather than render an
 * empty or zero-count block.
 */
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const SR_ONLY = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;'
  + 'clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0'

/**
 * @param {{videos: Array<{title:string,artist:string,viewCount:number}>, stats: {totalVideos:number,totalArtists:number,totalViews:number,earliestDate:string},
 *          projects: Array<{name:string,type:string,url:string}>, doors: Array<{title:string,lines:string[]}>, inbox: string,
 *          formatViews: (n:number)=>string}} d
 * @returns {string} one hidden <section>
 */
export function renderStaticCopy({ videos, stats, projects, doors, inbox, formatViews }) {
  const empty = []
  if (!videos?.length) empty.push('videos')
  if (!stats?.totalVideos || !stats?.totalArtists || !stats?.totalViews) empty.push('stats')
  if (!projects?.length) empty.push('projects')
  if (!doors?.length) empty.push('doors')
  if (!inbox) empty.push('inbox')
  if (empty.length) throw new Error(`static-copy: refusing to render, empty source(s): ${empty.join(', ')}`)

  const year = String(stats.earliestDate || '').slice(0, 4)
  // the most watched film per artist, the same rule the v6 reel uses
  const seen = new Set()
  const top = []
  for (const v of [...videos].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))) {
    if (!v.artist || seen.has(v.artist)) continue
    seen.add(v.artist)
    top.push(v)
    if (top.length === 8) break
  }

  return [
    `<section aria-label="About TdotsSolutionsz" style="${SR_ONLY}">`,
    `<h2>A Toronto studio for music videos and websites</h2>`,
    `<p>TdotsSolutionsz is a Toronto studio${year ? ` that has been shooting music videos since ${esc(year)}` : ''}: `
      + `${stats.totalVideos} films for ${stats.totalArtists} artists, ${esc(formatViews(stats.totalViews))} plays on YouTube. `
      + `The same studio designs and ships the websites and web apps that go with them.</p>`,
    `<h2>Music videos</h2>`,
    `<p>Most watched: ${top.map((v) => `${esc(v.title)} (${esc(formatViews(v.viewCount || 0))} views)`).join(', ')}.</p>`,
    `<h2>Websites live in production</h2>`,
    `<ul>${projects.map((p) => `<li><a href="${esc(p.url)}">${esc(p.name)}</a>, ${esc(p.type)}</li>`).join('')}</ul>`,
    `<h2>Book a session</h2>`,
    ...doors.map((d) => `<h3>${esc(d.title)}</h3><p>${d.lines.map(esc).join(' ')}</p>`),
    `<p>Email <a href="mailto:${esc(inbox)}">${esc(inbox)}</a>.</p>`,
    `</section>`,
  ].join('\n')
}
