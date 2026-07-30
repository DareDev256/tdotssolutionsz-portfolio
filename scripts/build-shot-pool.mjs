#!/usr/bin/env node
/**
 * build-shot-pool.mjs — Cut a shot pool the three lab demos share.
 *
 * probe-shots.mjs established the numbers: ~110 shots per film, mean 2.33s,
 * ~50KB per 2s shot at 480p. This turns that into real assets plus a manifest.
 *
 * One pool feeds all three concepts, which is the point — the material is the
 * same, only the instrument changes:
 *   The Recut   sequences shots into a generated film
 *   The Archive lays every shot out as a filterable wall
 *   The Pad     triggers shots as samples, with their audio
 *
 * Each shot ships as:
 *   {id}-{n}.mp4   480p, 24fps, audio kept (The Pad needs it), ~50-90KB
 *   {id}-{n}.jpg   320px still, the Archive tile and the video poster
 *
 * Output manifest: public/shots/manifest.json
 *
 * Usage: node scripts/build-shot-pool.mjs [--per N] [videoId ...]
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, '.shot-lab')
const OUT = path.join(ROOT, 'public', 'shots')

const argv = process.argv.slice(2)
const perIdx = argv.indexOf('--per')
/** Shots kept per film. 30 gives the demos enough variety without a long encode. */
const PER_FILM = perIdx >= 0 ? Number(argv[perIdx + 1]) : 30
const IDS = argv.filter((a, i) => !a.startsWith('--') && i !== perIdx + 1)
const FILM_IDS = IDS.length ? IDS : ['u3O5PKN9vCQ', 'E7ZStZMn-ac', 'gwXOTijyua4']

const { default: videoData } = await import('../src/data/videos.json', { with: { type: 'json' } })
const META = Object.fromEntries(videoData.videos.map((v) => [v.youtubeId, v]))

const SCENE_THRESHOLD = 0.3
const MIN_SHOT = 0.8
/** Cap shot length: past ~3s a tile stops reading as a shot and starts being a clip. */
const MAX_SHOT = 3.0

async function duration(file) {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', file])
    return Number(stdout.trim()) || 0
}

async function detectCrop(file, t) {
    const { stderr } = await run('ffmpeg', ['-ss', String(t), '-t', '8', '-i', file,
        '-vf', 'cropdetect=limit=24:round=2:reset=0', '-an', '-f', 'null', '-'],
        { maxBuffer: 1024 * 1024 * 32 }).catch((e) => ({ stderr: e.stderr || '' }))
    const m = [...String(stderr).matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)]
    if (!m.length) return null
    const [, w, h, x, y] = m[m.length - 1]
    if (Number(w) < 200 || Number(h) < 150) return null
    return `crop=${w}:${h}:${x}:${y}`
}

async function detectCuts(file) {
    const { stderr } = await run('ffmpeg', ['-i', file,
        '-filter:v', `select='gt(scene,${SCENE_THRESHOLD})',metadata=print`,
        '-an', '-f', 'null', '-'], { maxBuffer: 1024 * 1024 * 128 })
        .catch((e) => ({ stderr: e.stderr || '' }))
    return [...String(stderr).matchAll(/pts_time:([\d.]+)/g)]
        .map((m) => Number(m[1])).filter(Number.isFinite).sort((a, b) => a - b)
}

/** Mean colour + luma of a shot's midpoint. Drives the Archive's filters. */
async function sampleShot(file, t, cropExpr) {
    try {
        const { stdout } = await run('ffmpeg', ['-ss', String(t), '-i', file, '-frames:v', '1',
            '-vf', `${cropExpr ? cropExpr + ',' : ''}scale=1:1`, '-f', 'rawvideo',
            '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 1024 * 64 })
        const b = Buffer.from(stdout)
        if (b.length < 3) return null
        const [r, g, bl] = [b[0], b[1], b[2]]
        // Rec.709 luma — decides the day/night bucket.
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl
        const max = Math.max(r, g, bl), min = Math.min(r, g, bl)
        let hue = 0
        if (max !== min) {
            const d = max - min
            if (max === r) hue = ((g - bl) / d + (g < bl ? 6 : 0))
            else if (max === g) hue = (bl - r) / d + 2
            else hue = (r - g) / d + 4
            hue *= 60
        }
        return {
            hex: '#' + [r, g, bl].map((c) => c.toString(16).padStart(2, '0')).join(''),
            luma: Math.round(luma),
            hue: Math.round(hue),
            sat: max === 0 ? 0 : Math.round(((max - min) / max) * 100),
            light: luma > 108 ? 'day' : 'night'
        }
    } catch {
        return null
    }
}

/**
 * Spread N picks across the shot list rather than taking the first N — the
 * opening of a music video is all establishing and title cards, so the head of
 * the list is the least representative part of the film.
 */
function spread(list, n) {
    if (list.length <= n) return list
    const step = list.length / n
    return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)])
}

async function main() {
    await mkdir(OUT, { recursive: true })
    const shots = []

    for (const id of FILM_IDS) {
        const src = path.join(SRC, `${id}.mp4`)
        if (!existsSync(src)) {
            console.log(`  skip ${id} — no source in .shot-lab (run probe-shots.mjs first)`)
            continue
        }
        const meta = META[id] || {}
        const dur = await duration(src)
        const crop = await detectCrop(src, dur * 0.33)
        const pre = crop ? `${crop},` : ''
        const cuts = await detectCuts(src)

        const bounds = [0, ...cuts, dur]
        const all = []
        for (let i = 0; i < bounds.length - 1; i++) {
            const start = bounds[i]
            const len = Math.min(bounds[i + 1] - start, MAX_SHOT)
            // Skip the first 4s (idents/title cards) and the last 3s (end slates).
            if (len >= MIN_SHOT && start > 4 && start + len < dur - 3) {
                all.push({ start: +start.toFixed(2), len: +len.toFixed(2) })
            }
        }

        const picks = spread(all, PER_FILM)
        console.log(`  ${id} (${meta.artist}) — ${all.length} usable shots, taking ${picks.length}`)

        for (const [n, s] of picks.entries()) {
            const base = `${id}-${String(n).padStart(3, '0')}`
            const mp4 = path.join(OUT, `${base}.mp4`)
            const jpg = path.join(OUT, `${base}.jpg`)
            const mid = s.start + s.len / 2

            if (!existsSync(mp4)) {
                await run('ffmpeg', ['-y', '-ss', String(s.start), '-t', String(s.len), '-i', src,
                    '-vf', `${pre}scale=480:-2:flags=lanczos,fps=24`,
                    '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11',
                    '-c:v', 'libx264', '-crf', '30', '-preset', 'fast', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
                    '-movflags', '+faststart', mp4], { maxBuffer: 1024 * 1024 * 16 })
            }
            if (!existsSync(jpg)) {
                await run('ffmpeg', ['-y', '-ss', String(mid), '-i', src, '-frames:v', '1', '-an',
                    '-vf', `${pre}scale=320:-2:flags=lanczos`, '-q:v', '5', jpg],
                    { maxBuffer: 1024 * 1024 * 8 })
            }

            const colour = await sampleShot(src, mid, crop)
            const size = (await stat(mp4)).size
            shots.push({
                id: base,
                film: id,
                artist: meta.artist || 'Unknown',
                title: meta.title || '',
                year: meta.uploadDate?.slice(0, 4) || '',
                views: meta.viewCount || 0,
                start: s.start,
                len: s.len,
                bytes: size,
                ...(colour || {})
            })
        }
    }

    const manifest = {
        builtFrom: FILM_IDS,
        shotCount: shots.length,
        totalBytes: shots.reduce((a, s) => a + s.bytes, 0),
        shots
    }
    await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1))

    console.log(`\n  ${shots.length} shots -> public/shots/`)
    console.log(`  ${(manifest.totalBytes / 1024 / 1024).toFixed(1)}MB of video`)
    console.log(`  day ${shots.filter((s) => s.light === 'day').length} / night ${shots.filter((s) => s.light === 'night').length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
