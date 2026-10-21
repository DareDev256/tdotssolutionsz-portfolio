#!/usr/bin/env node
/**
 * build-site-clips.mjs — a scroll-through loop for every site card on the
 * Web Design floor (public/sites/clips/<slug>.mp4 + <slug>.jpg poster).
 *
 * Each site is opened headless at a 1280x800 desktop, left to settle, then
 * scrolled with real wheel input (so Lenis/GSAP/custom scrollers move the way a
 * visitor sees them) while the CDP screencast records every painted frame with
 * its timestamp. ffmpeg resamples that variable-rate stream to a constant 25 fps
 * 640x400 H.264, the same shape as /sites/bib-play-loop.mp4. The poster is the
 * clip's own first frame, so the swap from still to video does not jump.
 *
 *   node scripts/build-site-clips.mjs                 # every site below
 *   node scripts/build-site-clips.mjs --only=kmoney   # one or more slugs, comma separated
 *
 * Refuses (exit 2) when a site answers non-2xx, scrolls less than 200 px (an
 * `idle` site: paints fewer than 25 frames), or the clip comes out under 7 s. A refusal keeps the old clip.
 * Requires: ffmpeg on PATH, playwright (devDependency) with chromium installed.
 */
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/sites/clips')

/* slug = the clip file name. `settle` waits out intro loaders; `px` caps the
   scroll so a long page reads as a tour, not a blur. `hide` takes the site's
   own cookie bar out of the frame (hidden, never clicked, so no consent is
   given). `idle` is a one-screen site: record its own motion, no scroll. */
export const SITES = [
  { slug: 'spoiledkass', url: 'https://spoiledkass.com' },
  { slug: 'dancehallprincess', url: 'https://dancehallprincess.ca' },
  { slug: 'shortiieraw', url: 'https://shortiieraw.com' },
  { slug: 'shairbraiding', url: 'https://shairbraiding.com' },
  { slug: 'baliwhisper', url: 'https://baliwhisper.com', hide: '#cookieBar' },
  { slug: 'lodiie', url: 'https://lodiieharmonytour.com', hide: '#cookieBar' },
  { slug: 'shopbayhq', url: 'https://shopbayhq.com' },
  { slug: 'betmetrics', url: 'https://betmetrics.ca' },
  { slug: 'nirvana', url: 'https://nirvanadeshaunbuilds.com' },
  { slug: 'frenchies', url: 'https://musthavefrenchies.com' },
  { slug: 'streetbud', url: 'https://officialstreetbud.com' },
  { slug: 'savv4x', url: 'https://savv4x.com' },
  { slug: 'kmoney', url: 'https://officialkmoney.com' },
  { slug: 'syreneffect', url: 'https://syreneffect.com', idle: true },
  { slug: '100bandplan', url: 'https://100bandplan.com' },
]

const W = 1280, H = 800
const HOLD_TOP = 1.2, SCROLL = 6.4, HOLD_END = 0.8      // seconds; 8.4 s loop
const MAX_PX = 3800, TICK = 1000 / 60
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

async function record(browser, site) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'en-CA', reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  try {
    const res = await page.goto(site.url, { waitUntil: 'load', timeout: 45000 })
    if (!res || res.status() >= 400) throw new Error(`HTTP ${res ? res.status() : 'none'}`)
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await sleep(site.settle ?? 2500)
    // CSSOM, not a <style> tag: a strict style-src CSP (baliwhisper) refuses inline styles.
    if (site.hide) await page.evaluate((sel) => document.querySelectorAll(sel).forEach((el) => el.style.setProperty('display', 'none', 'important')), site.hide)

    // How far can a visitor actually scroll? The window, or the largest inner scroller.
    const reach = await page.evaluate(() => {
      const win = document.scrollingElement.scrollHeight - innerHeight
      let inner = 0
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el)
        if (/(auto|scroll)/.test(s.overflowY) && el.clientHeight > innerHeight * 0.6) inner = Math.max(inner, el.scrollHeight - el.clientHeight)
      }
      return Math.max(win, inner)
    })
    const dist = site.idle ? 0 : Math.min(reach, site.px ?? MAX_PX)
    await page.mouse.move(W / 2, H / 2)

    const cdp = await ctx.newCDPSession(page)
    const frames = []
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      frames.push({ t: metadata.timestamp, buf: Buffer.from(data, 'base64') })
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 })
    const t0 = Date.now() / 1000
    await sleep(HOLD_TOP * 1000)

    // Wheel in small steps on a fixed clock; the step size follows an ease so
    // the page starts and stops like a hand, not a jump cut.
    let sent = 0
    const start = Date.now()
    while (Date.now() - start < SCROLL * 1000) {
      const want = ease(Math.min(1, (Date.now() - start) / (SCROLL * 1000))) * dist
      const dy = Math.round(want - sent)
      if (dy > 0) { await page.mouse.wheel(0, dy); sent += dy }
      await sleep(TICK)
    }
    await sleep(HOLD_END * 1000)
    const t1 = Date.now() / 1000
    await cdp.send('Page.stopScreencast')
    const moved = await page.evaluate(() => {
      let y = scrollY
      for (const el of document.querySelectorAll('body *')) if (el.scrollTop > y) y = el.scrollTop
      return y
    })
    return { frames, t0, t1, reach, dist, moved }
  } finally {
    await ctx.close()
  }
}

function encode(site, { frames, t0, t1 }) {
  const dir = mkdtempSync(join(tmpdir(), `clip-${site.slug}-`))
  try {
    // Screencast frames arrive only when something paints; hold each one until the next.
    const kept = frames.filter((f) => f.t >= t0 - 0.05).sort((a, b) => a.t - b.t)
    if (kept.length < 10) throw new Error(`only ${kept.length} frames painted`)
    let list = ''
    kept.forEach((f, i) => {
      const name = `f${String(i).padStart(5, '0')}.jpg`
      writeFileSync(join(dir, name), f.buf)
      const next = i + 1 < kept.length ? kept[i + 1].t : t1
      const from = i === 0 ? t0 : f.t
      list += `file '${name}'\nduration ${Math.max(0.001, next - from).toFixed(4)}\n`
    })
    list += `file 'f${String(kept.length - 1).padStart(5, '0')}.jpg'\n`
    writeFileSync(join(dir, 'list.txt'), list)
    const mp4 = join(OUT, `${site.slug}.mp4`)
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
      '-vf', 'fps=25,scale=640:400:flags=lanczos,format=yuv420p', '-t', String((t1 - t0).toFixed(2)),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-profile:v', 'high', '-movflags', '+faststart', '-an', mp4], { cwd: dir })
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-frames:v', '1', '-q:v', '4', join(OUT, `${site.slug}.jpg`)])
    const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString())
    return { mp4, dur, kb: Math.round(statSync(mp4).size / 1024) }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

async function main() {
  const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean)
  const todo = only.length ? SITES.filter((s) => only.includes(s.slug)) : SITES
  if (!todo.length) { console.error(`no site matches ${only.join(',')}`); process.exit(2) }
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] })
  let refused = 0
  for (const site of todo) {
    try {
      const rec = await record(browser, site)
      if (site.idle ? rec.frames.length < 25 : rec.moved < 200)
        throw new Error(site.idle ? `only ${rec.frames.length} frames painted: the page does not move` : `scrolled only ${Math.round(rec.moved)} px of ${rec.reach}`)
      const out = encode(site, rec)
      if (out.dur < 7) throw new Error(`clip is ${out.dur.toFixed(1)} s`)
      console.log(`✓ ${site.slug.padEnd(18)} ${out.dur.toFixed(1)} s  ${String(out.kb).padStart(4)} KB  scrolled ${Math.round(rec.moved)}/${rec.reach} px  ${rec.frames.length} frames`)
    } catch (e) {
      refused++
      console.error(`✗ ${site.slug.padEnd(18)} REFUSED: ${e.message}`)
    }
  }
  await browser.close()
  process.exit(refused ? 2 : 0)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
