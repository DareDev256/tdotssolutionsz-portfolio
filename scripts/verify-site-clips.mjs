import { chromium } from 'playwright'
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
const DIST = new URL('../dist/', import.meta.url).pathname
const T = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.mp4':'video/mp4', '.webm':'video/webm', '.svg':'image/svg+xml', '.json':'application/json', '.woff2':'font/woff2' }
const srv = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); let f = join(DIST, p)
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html') } catch { f = join(DIST, 'index.html') }
  try {
    const buf = await readFile(f); const range = req.headers.range
    res.setHeader('Content-Type', T[extname(f)] || 'application/octet-stream'); res.setHeader('Accept-Ranges', 'bytes')
    if (range) { const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : buf.length - 1
      res.writeHead(206, { 'Content-Range': `bytes ${s}-${e}/${buf.length}`, 'Content-Length': e - s + 1 }); res.end(buf.subarray(s, e + 1)) }
    else res.end(buf)
  } catch { res.statusCode = 404; res.end() }
}).listen(0)
const base = `http://127.0.0.1:${srv.address().port}`
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] })
const SHOT = 'docs/screenshots/2026-10-21_'
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: name === 'mobile', hasTouch: name === 'mobile' })
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('response', r => { if (r.headers()['content-type'] === 'text/html' && /\.(js|mjs)$/.test(new URL(r.url()).pathname)) errs.push('html-for-js ' + new URL(r.url()).pathname) })
  await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(2500)
  await p.screenshot({ path: `${SHOT}LOCAL-hero-logo-${name}.png` })
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  for (let y = 0; y <= max * 0.28; y += 120) { await p.mouse.wheel(0, 120); await p.waitForTimeout(40) }
  await p.waitForTimeout(3500)
  const state = await p.evaluate(() => [...document.querySelectorAll('.cinema-browser-clip')].map(v => {
    const r = v.getBoundingClientRect()
    return { src: (v.currentSrc || v.dataset.src).split('/').pop(), playing: !v.paused && v.currentTime > 0.2, attached: !!v.dataset.ready, vis: r.width > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight }
  }))
  const vis = state.filter(s => s.vis), attached = state.filter(s => s.attached)
  console.log(name, `clips=${state.length} visible=${vis.length} visible+playing=${vis.filter(s => s.playing).length} attached=${attached.length} offscreen-playing=${state.filter(s => !s.vis && s.playing).length}`)
  console.log('  not playing but visible:', vis.filter(s => !s.playing).map(s => s.src).join(' ') || 'none')
  await p.screenshot({ path: `${SHOT}LOCAL-webdesign-floor-${name}.png` })
  await p.waitForTimeout(2000)
  await p.screenshot({ path: `${SHOT}LOCAL-webdesign-floor-${name}-2s.png` })
  // leave the floor: everything must pause
  for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 200); await p.waitForTimeout(30) }
  await p.waitForTimeout(1200)
  const after = await p.evaluate(() => [...document.querySelectorAll('.cinema-browser-clip')].filter(v => !v.paused).length)
  console.log('  playing after leaving floor:', after, 'errors:', errs.length ? errs.join(' | ') : 'none')
  await ctx.close()
}
// /web-design preview card: desktop picks by node, phone by list
for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2 }); const p = await ctx.newPage()
  await p.goto(base + '/web-design', { waitUntil: 'load' }); await p.waitForTimeout(2000)
  const pick = name === 'desktop' ? p.locator('.webdesign-page__node-label').filter({ hasText: 'KMONEY' }).first() : p.locator('.webdesign-page__list-item').filter({ hasText: 'KMONEY' }).first()
  await pick.click({ force: true })
  await p.waitForTimeout(3000)
  const wd = await p.evaluate(() => { const v = document.querySelector('.webdesign-page__card-preview video'); return v ? { src: v.currentSrc.split('/').pop(), playing: !v.paused && v.currentTime > 0.2 } : null })
  console.log('web-design card', name, JSON.stringify(wd))
  await p.locator('.webdesign-page__card-preview').scrollIntoViewIfNeeded().catch(() => {})
  await p.screenshot({ path: `${SHOT}LOCAL-web-design-card-${name}.png` })
  await ctx.close()
}
await b.close(); srv.close()
