#!/usr/bin/env node
/**
 * build-preview-clips.mjs — Cut silent hover-scrub loops from the reel films.
 *
 * The homepage reel lets you scrub real footage by moving the cursor across a
 * tile. That needs actual video, not thumbnails: YouTube's storyboard sprite
 * sheets are signature-gated (403 since 2024) and an embedded iframe is far too
 * heavy to put six of on a landing page.
 *
 * So we pull a short segment from each film once, at build/asset time, and
 * self-host it. Output per film is ~200-500KB — cheaper than the maxres JPEG
 * it replaces in some cases.
 *
 * These are TdotsSolutionsz's own directed works.
 *
 * Usage:
 *   node scripts/build-preview-clips.mjs            # only missing clips
 *   node scripts/build-preview-clips.mjs --force    # rebuild everything
 *
 * Requires: yt-dlp, ffmpeg on PATH.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'previews')
const TMP = path.join(ROOT, '.preview-tmp')
const FORCE = process.argv.includes('--force')

/** Seconds of footage per loop. Long enough to read as a shot, short enough to stay small. */
const CLIP_SECONDS = 6
/** Start this far into the film — skips label idents, black, and title cards. */
const START_FRACTION = 0.33
const WIDTH = 640

/**
 * The reel selection, mirrored from src/data/studio.js `selectReel()`:
 * highest-viewed work, deduped by artist. Kept as an explicit list so this
 * script never has to import JSX-adjacent modules.
 */
const { default: videoData } = await import('../src/data/videos.json', {
    with: { type: 'json' }
})

function selectReel() {
    const seen = new Set()
    const picked = []
    for (const v of [...videoData.videos].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))) {
        if (!v.artist || seen.has(v.artist)) continue
        seen.add(v.artist)
        picked.push(v)
        if (picked.length === 6) break
    }
    return picked
}

/** @returns {Promise<number>} duration in seconds, or 0 if unknown */
async function probeDuration(file) {
    try {
        const { stdout } = await run('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file
        ])
        return Number(stdout.trim()) || 0
    } catch {
        return 0
    }
}

/**
 * Detect the real picture area, stripping baked-in letterbox / pillarbox bars.
 *
 * Several of these films were mastered 4:3-in-16:9 or uploaded with hard black
 * bars. Scaling those straight into a 16:9 tile renders a frame inside a frame,
 * which reads as broken. ffmpeg's cropdetect samples the actual content rect;
 * we take the last (most settled) reading.
 *
 * @returns {Promise<string|null>} an ffmpeg crop expression, or null
 */
async function detectCrop(file, start) {
    try {
        // cropdetect writes to stderr; a non-zero limit ignores near-black noise.
        const { stderr } = await run('ffmpeg', [
            '-ss', String(start),
            '-t', '8',
            '-i', file,
            '-vf', 'cropdetect=limit=24:round=2:reset=0',
            '-f', 'null', '-'
        ], { maxBuffer: 1024 * 1024 * 32 }).catch((e) => ({ stderr: e.stderr || '' }))

        const matches = [...String(stderr).matchAll(/crop=(\d+):(\d+):(\d+):(\d+)/g)]
        if (!matches.length) return null
        const [, w, h, x, y] = matches[matches.length - 1]
        // Guard against a pathological detection that would throw the frame away.
        if (Number(w) < 200 || Number(h) < 150) return null
        return `crop=${w}:${h}:${x}:${y}`
    } catch {
        return null
    }
}

/**
 * Score a candidate moment by how well it would read as a poster frame.
 *
 * A fixed timestamp lands wherever it lands — on this reel that meant a hand in
 * the dark and a tree. Instead we sample several points across the film and
 * measure them with ffmpeg's `signalstats`:
 *
 *   YAVG — mean luma. Punishes crushed-black and blown-out frames.
 *   YSTD — luma spread. Rewards frames with an actual subject and depth over
 *          flat walls, skies, and fades.
 *
 * @returns {Promise<number>} higher is better; 0 means unusable
 */
async function scoreMoment(file, t, cropExpr) {
    try {
        const { stderr } = await run('ffmpeg', [
            '-ss', String(t),
            '-i', file,
            '-frames:v', '1',
            '-vf', `${cropExpr ? `${cropExpr},` : ''}signalstats,metadata=print`,
            '-f', 'null', '-'
        ], { maxBuffer: 1024 * 1024 * 16 }).catch((e) => ({ stderr: e.stderr || '' }))

        const text = String(stderr)
        const avg = Number(text.match(/lavfi\.signalstats\.YAVG=([\d.]+)/)?.[1])
        const std = Number(text.match(/lavfi\.signalstats\.YSTD=([\d.]+)/)?.[1])
        if (!Number.isFinite(avg) || !Number.isFinite(std)) return 0

        // Exposure: peak at mid-grey, fall off toward either clipped end.
        const exposure = 1 - Math.min(1, Math.abs(avg - 118) / 118)
        // Detail: YSTD above ~55 is a well-populated frame; cap so it can't dominate.
        const detail = Math.min(1, std / 55)
        return exposure * 0.45 + detail * 0.55
    } catch {
        return 0
    }
}

/**
 * Walk candidate start points across the body of the film and return the best.
 * The first and last fifth are skipped — that is where idents, title cards, and
 * end slates live.
 */
async function pickStart(file, duration, cropExpr) {
    const span = duration || 180
    const candidates = [0.22, 0.32, 0.42, 0.52, 0.62, 0.72]
        .map((f) => Math.max(2, Math.floor(span * f)))
        // Leave room for the full clip length at the tail.
        .filter((t) => t + CLIP_SECONDS < span - 2)

    if (!candidates.length) return Math.max(2, Math.floor(span * START_FRACTION))

    const scored = []
    for (const t of candidates) {
        scored.push({ t, score: await scoreMoment(file, t, cropExpr) })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored[0].t
}

async function buildOne(video) {
    const id = video.youtubeId
    const webm = path.join(OUT, `${id}.webm`)
    const mp4 = path.join(OUT, `${id}.mp4`)
    const poster = path.join(OUT, `${id}.jpg`)

    if (!FORCE && existsSync(webm) && existsSync(mp4) && existsSync(poster)) {
        console.log(`  skip   ${id}  (${video.artist}) — already built`)
        return { id, status: 'skipped' }
    }

    const source = path.join(TMP, `${id}.src.mp4`)

    try {
        if (!existsSync(source)) {
            // Cap at 720p — we downscale to 640 anyway, and this keeps the pull fast.
            await run('yt-dlp', [
                '-f', 'bestvideo[height<=720][ext=mp4]+bestaudio/best[height<=720]',
                '--merge-output-format', 'mp4',
                '--no-playlist',
                '--quiet', '--no-warnings',
                '-o', source,
                `https://www.youtube.com/watch?v=${id}`
            ], { maxBuffer: 1024 * 1024 * 32 })
        }

        const duration = await probeDuration(source)
        // Detect bars first (using a mid-film probe), then choose the moment —
        // scoring has to run on the cropped picture or the black bars drag the
        // luma statistics down on every candidate equally.
        const crop = await detectCrop(source, Math.max(2, Math.floor((duration || 180) * START_FRACTION)))
        const pre = crop ? `${crop},` : ''
        const start = await pickStart(source, duration, crop)

        // Audio is kept. The player mutes by default (browsers require it for
        // autoplay) and a global SOUND ON toggle unmutes — the reel then plays
        // the actual track under the picture. Loudness-normalised so six tiles
        // mastered a decade apart don't jump in level as you move between them.
        const common = [
            '-y',
            '-ss', String(start),
            '-t', String(CLIP_SECONDS),
            '-i', source,
            '-vf', `${pre}scale=${WIDTH}:-2:flags=lanczos,fps=24`,
            '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.35,' +
                   `afade=t=out:st=${CLIP_SECONDS - 0.45}:d=0.45`,
            '-movflags', '+faststart'
        ]

        await run('ffmpeg', [
            ...common,
            '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1',
            '-deadline', 'good', '-cpu-used', '2',
            '-c:a', 'libopus', '-b:a', '96k', '-ac', '2',
            webm
        ], { maxBuffer: 1024 * 1024 * 32 })

        await run('ffmpeg', [
            ...common,
            '-c:v', 'libx264', '-crf', '27', '-preset', 'slow',
            '-pix_fmt', 'yuv420p', '-profile:v', 'main',
            '-c:a', 'aac', '-b:a', '112k', '-ac', '2',
            mp4
        ], { maxBuffer: 1024 * 1024 * 32 })

        // Poster frame, pulled from the clip rather than from YouTube.
        // YouTube's own thumbnails have distributor watermarks burned in
        // (6IXBUZZ CERTIFIED, WSHH EXCLUSIVE) because they're taken from the
        // intro card. A frame from mid-film is clean, and it colour-matches the
        // clip that replaces it on hover.
        // `thumbnail=N` scores N consecutive frames and emits the most
        // representative one, rather than whatever happened to sit at a fixed
        // timestamp — that is how we stop landing on a hand or a tree.
        await run('ffmpeg', [
            '-y',
            '-ss', String(start),
            '-t', String(CLIP_SECONDS),
            '-i', source,
            '-an',
            '-vf', `${pre}thumbnail=90,scale=1280:-2:flags=lanczos`,
            '-frames:v', '1',
            '-q:v', '3',
            poster
        ], { maxBuffer: 1024 * 1024 * 32 })

        const [w, m] = await Promise.all([stat(webm), stat(mp4)])
        console.log(
            `  built  ${id}  (${video.artist}) — webm ${(w.size / 1024).toFixed(0)}KB, ` +
            `mp4 ${(m.size / 1024).toFixed(0)}KB, @${start}s${crop ? ', debarred' : ''}`
        )
        return { id, status: 'built' }
    } catch (err) {
        console.warn(`  FAILED ${id}  (${video.artist}) — ${err.shortMessage || err.message}`)
        // A missing clip is not fatal: the component falls back to the still.
        return { id, status: 'failed' }
    }
}

async function main() {
    await mkdir(OUT, { recursive: true })
    await mkdir(TMP, { recursive: true })

    const reel = selectReel()
    console.log(`Building hover-scrub previews for ${reel.length} films${FORCE ? ' (forced)' : ''}:\n`)

    const results = []
    for (const v of reel) {
        results.push(await buildOne(v))
    }

    // Drop the raw downloads; only the encoded loops are worth keeping.
    await rm(TMP, { recursive: true, force: true })

    const built = results.filter((r) => r.status === 'built').length
    const failed = results.filter((r) => r.status === 'failed')
    const files = await readdir(OUT)
    console.log(`\n${built} built, ${files.length} files in public/previews/`)
    if (failed.length) {
        console.log(`Fell back to stills for: ${failed.map((f) => f.id).join(', ')}`)
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
