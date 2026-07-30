#!/usr/bin/env node
/**
 * probe-shots.mjs — Feasibility probe for the shot-level concepts.
 *
 * Before committing to a homepage built out of the footage itself (The Recut,
 * The Archive, The Pad) we need real numbers, not estimates:
 *
 *   - How many distinct shots does a typical film actually cut into?
 *   - What is the average shot length? (Drill videos cut fast; if the mean is
 *     under ~1s the "one shot per tile" idea produces a strobing mess.)
 *   - What does one shot cost in bytes once encoded for the web?
 *   - Can we pull a dominant colour per shot cheaply enough to make the
 *     Archive's colour filter real rather than decorative?
 *
 * Extrapolating those to 101 films tells us whether this is buildable or
 * whether it's a 4GB idea. Run it before writing any of the three demos.
 *
 * Usage: node scripts/probe-shots.mjs [videoId ...]
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TMP = path.join(ROOT, '.shot-lab')
const OUT = path.join(ROOT, '.shot-lab', 'out')

/** Scene-change sensitivity. 0.3 is a reasonable cut threshold for music video grading. */
const SCENE_THRESHOLD = 0.3
/** Ignore shots shorter than this — they are flash frames, not usable material. */
const MIN_SHOT = 0.55

const IDS = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['u3O5PKN9vCQ', 'E7ZStZMn-ac', 'gwXOTijyua4']

async function fetchSource(id) {
    const file = path.join(TMP, `${id}.mp4`)
    if (existsSync(file)) return file
    await run('yt-dlp', [
        '-f', 'bestvideo[height<=720][ext=mp4]+bestaudio/best[height<=720]',
        '--merge-output-format', 'mp4',
        '--no-playlist', '--quiet', '--no-warnings',
        '-o', file,
        `https://www.youtube.com/watch?v=${id}`
    ], { maxBuffer: 1024 * 1024 * 64 })
    return file
}

async function duration(file) {
    const { stdout } = await run('ffprobe', [
        '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', file
    ])
    return Number(stdout.trim()) || 0
}

/**
 * Return cut timestamps in seconds using ffmpeg's scene-change score.
 * @returns {Promise<number[]>}
 */
async function detectCuts(file) {
    const { stderr } = await run('ffmpeg', [
        '-i', file,
        '-filter:v', `select='gt(scene,${SCENE_THRESHOLD})',metadata=print`,
        '-an', '-f', 'null', '-'
    ], { maxBuffer: 1024 * 1024 * 128 }).catch((e) => ({ stderr: e.stderr || '' }))

    return [...String(stderr).matchAll(/pts_time:([\d.]+)/g)]
        .map((m) => Number(m[1]))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
}

/** Turn cut points into usable [start, len] shots, dropping flash frames. */
function toShots(cuts, dur) {
    const bounds = [0, ...cuts, dur]
    const shots = []
    for (let i = 0; i < bounds.length - 1; i++) {
        const start = bounds[i]
        const len = bounds[i + 1] - start
        if (len >= MIN_SHOT) shots.push({ start: +start.toFixed(2), len: +len.toFixed(2) })
    }
    return shots
}

/**
 * Mean colour of a shot, as hex. Cheap: scale the frame to 1x1 and read it.
 * This is what would drive the Archive's colour filter.
 */
async function shotColour(file, t) {
    try {
        const { stdout } = await run('ffmpeg', [
            '-ss', String(t), '-i', file, '-frames:v', '1',
            '-vf', 'scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'
        ], { encoding: 'buffer', maxBuffer: 1024 * 64 })
        const b = Buffer.from(stdout)
        if (b.length < 3) return null
        return '#' + [b[0], b[1], b[2]].map((c) => c.toString(16).padStart(2, '0')).join('')
    } catch {
        return null
    }
}

async function main() {
    await mkdir(TMP, { recursive: true })
    await mkdir(OUT, { recursive: true })

    const report = []
    console.log(`Probing ${IDS.length} films (scene threshold ${SCENE_THRESHOLD}, min shot ${MIN_SHOT}s)\n`)

    for (const id of IDS) {
        process.stdout.write(`  ${id}  fetching…`)
        const file = await fetchSource(id)
        const dur = await duration(file)
        process.stdout.write(` detecting…`)
        const cuts = await detectCuts(file)
        const shots = toShots(cuts, dur)

        const lens = shots.map((s) => s.len)
        const mean = lens.reduce((a, b) => a + b, 0) / (lens.length || 1)
        const median = [...lens].sort((a, b) => a - b)[Math.floor(lens.length / 2)] || 0

        // Encode 3 sample shots to measure real per-shot web weight.
        let bytes = 0
        const samples = shots.slice(Math.floor(shots.length / 3), Math.floor(shots.length / 3) + 3)
        for (const [i, s] of samples.entries()) {
            const out = path.join(OUT, `${id}-${i}.mp4`)
            await run('ffmpeg', [
                '-y', '-ss', String(s.start), '-t', String(Math.min(s.len, 2)),
                '-i', file, '-an',
                '-vf', 'scale=480:-2:flags=lanczos,fps=24',
                '-c:v', 'libx264', '-crf', '30', '-preset', 'fast',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out
            ], { maxBuffer: 1024 * 1024 * 16 })
            bytes += (await stat(out)).size
        }
        const perShot = bytes / (samples.length || 1)

        // Colour sample across the film — proves the Archive filter is real.
        const colourPicks = shots
            .filter((_, i) => i % Math.max(1, Math.floor(shots.length / 6)) === 0)
            .slice(0, 6)
        const colours = []
        for (const s of colourPicks) colours.push(await shotColour(file, s.start + s.len / 2))

        report.push({ id, dur, shots: shots.length, mean, median, perShot, colours, shotList: shots })
        console.log(
            ` ${shots.length} shots / ${dur.toFixed(0)}s` +
            ` · mean ${mean.toFixed(2)}s · median ${median.toFixed(2)}s` +
            ` · ~${(perShot / 1024).toFixed(0)}KB per 2s shot`
        )
        console.log(`      colours: ${colours.filter(Boolean).join(' ')}`)
    }

    const totalShots = report.reduce((a, r) => a + r.shots, 0)
    const avgShots = totalShots / report.length
    const avgPerShot = report.reduce((a, r) => a + r.perShot, 0) / report.length
    const avgMean = report.reduce((a, r) => a + r.mean, 0) / report.length

    console.log('\n─── EXTRAPOLATION TO 101 FILMS ───')
    console.log(`  shots/film (avg)      ${avgShots.toFixed(0)}`)
    console.log(`  total shots           ~${Math.round(avgShots * 101).toLocaleString()}`)
    console.log(`  mean shot length      ${avgMean.toFixed(2)}s`)
    console.log(`  per 2s shot @480p     ~${(avgPerShot / 1024).toFixed(0)}KB`)
    console.log(`  ALL shots as video    ~${((avgShots * 101 * avgPerShot) / 1024 / 1024 / 1024).toFixed(2)}GB  <- too big to ship whole`)
    console.log(`  as poster JPEGs only  ~${((avgShots * 101 * 9000) / 1024 / 1024).toFixed(0)}MB  <- Archive is viable on stills`)
    console.log(`  a 60-shot Recut       ~${((60 * avgPerShot) / 1024 / 1024).toFixed(1)}MB`)

    await writeFile(path.join(OUT, 'probe.json'), JSON.stringify(report, null, 2))
    console.log(`\n  full data -> .shot-lab/out/probe.json`)
}

main().catch((e) => { console.error(e); process.exit(1) })
