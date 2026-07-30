#!/usr/bin/env node
/**
 * build-poster-frames.mjs — Clean poster art for all 101 films.
 *
 * The problem this solves is visible on every card on the site: YouTube's
 * thumbnails are taken from each video's intro card, and those have the
 * distributor's branding burned into the picture — 6IXBUZZ CERTIFIED,
 * 6IXBUZZENT.COM, WORLDSTARHIPHOP.COM, VEVO. On a site selling James's
 * direction, every tile is wearing somebody else's logo. Several are also
 * letterboxed, and pre-2016 uploads have no maxres at all (YouTube answers with
 * a 120x90 grey stub and a 200, so it can't even be detected as an error).
 *
 * So we take our own frame from mid-film instead:
 *   1. Ask yt-dlp for the duration only (metadata, no download).
 *   2. Pull a single ~45s window from the middle — NOT the whole film. A poster
 *      needs one frame; downloading 4 minutes to throw away 99% of it turns a
 *      15-minute job into a two-hour one.
 *   3. cropdetect the window and strip baked-in letterbox bars.
 *   4. Score six candidate moments on exposure (YAVG) and detail (YSTD), and
 *      take the best. A fixed timestamp lands on whatever happens to be there —
 *      in testing that meant a hand in the dark and a tree.
 *   5. Write a 1280-wide JPEG.
 *
 * Output: public/posters/{youtubeId}.jpg + manifest.json
 *
 * Usage:
 *   node scripts/build-poster-frames.mjs             # all films, skip existing
 *   node scripts/build-poster-frames.mjs --force     # redo everything
 *   node scripts/build-poster-frames.mjs --limit 10  # first 10 only
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'posters')
const TMP = path.join(ROOT, '.poster-tmp')

const argv = process.argv.slice(2)
const FORCE = argv.includes('--force')
const limIdx = argv.indexOf('--limit')
const LIMIT = limIdx >= 0 ? Number(argv[limIdx + 1]) : Infinity

/** Seconds of film to actually download. Wide enough to score across. */
const WINDOW = 45

const { default: videoData } = await import('../src/data/videos.json', { with: { type: 'json' } })

async function probeDuration(id) {
    try {
        const { stdout } = await run('yt-dlp', [
            '--no-playlist', '--quiet', '--no-warnings',
            '--print', 'duration', `https://www.youtube.com/watch?v=${id}`
        ], { maxBuffer: 1024 * 256 })
        return Number(String(stdout).trim()) || 0
    } catch {
        return 0
    }
}

async function detectCrop(file) {
    const { stderr } = await run('ffmpeg', ['-i', file,
        '-vf', 'cropdetect=limit=24:round=2:reset=0', '-an', '-f', 'null', '-'],
        { maxBuffer: 1024 * 1024 * 32 }).catch((e) => ({ stderr: e.stderr || '' }))
    const m = [...String(stderr).matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)]
    if (!m.length) return null
    const [, w, h, x, y] = m[m.length - 1]
    if (Number(w) < 200 || Number(h) < 150) return null
    return `crop=${w}:${h}:${x}:${y}`
}

/**
 * A frame this dark is unusable as a card no matter how it scores relatively —
 * the whole window can be dark, in which case "best available" is still black.
 * Below this mean luma we refuse the frame and fall back to YouTube.
 */
const MIN_LUMA = 42

/** Exposure + detail score for one moment. Returns {score, avg, std}. */
async function score(file, t, cropExpr) {
    try {
        const { stderr } = await run('ffmpeg', ['-ss', String(t), '-i', file, '-frames:v', '1',
            '-vf', `${cropExpr ? cropExpr + ',' : ''}signalstats,metadata=print`,
            '-an', '-f', 'null', '-'], { maxBuffer: 1024 * 1024 * 8 })
            .catch((e) => ({ stderr: e.stderr || '' }))
        const txt = String(stderr)
        const avg = Number(txt.match(/YAVG=([\d.]+)/)?.[1])
        const std = Number(txt.match(/YSTD=([\d.]+)/)?.[1])
        if (!Number.isFinite(avg) || !Number.isFinite(std)) return { score: 0, avg: 0, std: 0 }
        const exposure = 1 - Math.min(1, Math.abs(avg - 118) / 118)
        const detail = Math.min(1, std / 55)
        return { score: exposure * 0.45 + detail * 0.55, avg, std }
    } catch {
        return { score: 0, avg: 0, std: 0 }
    }
}

async function buildOne(v, i, total) {
    const id = v.youtubeId
    const out = path.join(OUT, `${id}.jpg`)
    if (!FORCE && existsSync(out)) return { id, status: 'skipped' }

    const seg = path.join(TMP, `${id}.mp4`)
    try {
        const dur = await probeDuration(id)
        if (!dur) throw new Error('no duration (private/removed?)')

        // Middle of the film, clear of idents and end slates.
        const from = Math.max(3, Math.floor(dur * 0.38))
        const to = Math.min(dur - 2, from + WINDOW)

        await run('yt-dlp', [
            '-f', 'bestvideo[height<=720][ext=mp4]/bestvideo[height<=720]/best[height<=720]',
            '--download-sections', `*${from}-${to}`,
            '--force-keyframes-at-cuts',
            '--no-playlist', '--quiet', '--no-warnings',
            '-o', seg, `https://www.youtube.com/watch?v=${id}`
        ], { maxBuffer: 1024 * 1024 * 32 })

        if (!existsSync(seg)) throw new Error('segment not written')

        const crop = await detectCrop(seg)
        const span = Math.min(WINDOW, to - from)
        const candidates = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92]
            .map((f) => +(span * f).toFixed(1))
        const scored = []
        for (const t of candidates) {
            const r = await score(seg, t, crop)
            scored.push({ t, ...r })
        }
        // Only consider frames above the brightness floor. Sorting first and
        // then filtering would still hand back a black frame when every
        // candidate is dark — which is exactly what shipped on the first pass.
        const usable = scored.filter((c) => c.avg >= MIN_LUMA)
        if (!usable.length) {
            const brightest = Math.max(...scored.map((c) => c.avg)).toFixed(0)
            throw new Error(`no frame above luma floor (brightest ${brightest})`)
        }
        usable.sort((a, b) => b.score - a.score)
        const best = usable[0].t

        await run('ffmpeg', ['-y', '-ss', String(best), '-i', seg, '-frames:v', '1', '-an',
            '-vf', `${crop ? crop + ',' : ''}scale=1280:-2:flags=lanczos`, '-q:v', '4', out],
            { maxBuffer: 1024 * 1024 * 8 })

        const size = (await stat(out)).size
        console.log(`  [${i + 1}/${total}] ${id} ${v.artist} — ${(size / 1024).toFixed(0)}KB${crop ? ' debarred' : ''}`)
        return { id, status: 'built', bytes: size, crop: !!crop }
    } catch (err) {
        console.warn(`  [${i + 1}/${total}] ${id} ${v.artist} — FAILED: ${err.shortMessage || err.message}`)
        return { id, status: 'failed', reason: err.message }
    } finally {
        await rm(seg, { force: true })
    }
}

async function main() {
    await mkdir(OUT, { recursive: true })
    await mkdir(TMP, { recursive: true })

    const films = videoData.videos.slice(0, LIMIT)
    console.log(`Building clean poster frames for ${films.length} films\n`)

    const results = []
    // Serial: yt-dlp in parallel invites rate-limiting, and this runs once.
    for (const [i, v] of films.entries()) {
        results.push(await buildOne(v, i, films.length))
    }

    const built = results.filter((r) => r.status === 'built')
    const failed = results.filter((r) => r.status === 'failed')
    const skipped = results.filter((r) => r.status === 'skipped')

    await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify({
        generated: films.length,
        ok: built.map((r) => r.id).concat(skipped.map((r) => r.id)),
        failed: failed.map((r) => ({ id: r.id, reason: r.reason }))
    }, null, 1))

    await rm(TMP, { recursive: true, force: true })

    const mb = built.reduce((a, r) => a + r.bytes, 0) / 1024 / 1024
    console.log(`\n  built ${built.length} · skipped ${skipped.length} · failed ${failed.length}`)
    console.log(`  ${mb.toFixed(1)}MB in public/posters/`)
    if (failed.length) {
        console.log(`  falling back to YouTube for: ${failed.map((f) => f.id).join(', ')}`)
    }
}

main().catch((e) => { console.error(e); process.exit(1) })
