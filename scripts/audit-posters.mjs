#!/usr/bin/env node
/**
 * audit-posters.mjs — Reject poster frames that are too dark to use as a card.
 *
 * The first pass of build-poster-frames.mjs picked the best-scoring frame in
 * its window even when the entire window was dark, so a handful of cards
 * shipped as black rectangles. A black card is worse than the watermarked
 * YouTube thumbnail it replaced.
 *
 * This measures every poster on disk and deletes the ones below the floor.
 * build-poster-frames.mjs (which now enforces the same floor) will regenerate
 * them on the next run; any that still can't clear it stay absent, and
 * FilmStill falls back to YouTube.
 *
 * Usage:
 *   node scripts/audit-posters.mjs           # report only
 *   node scripts/audit-posters.mjs --delete  # remove the failures
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'public', 'posters')

/** Must match MIN_LUMA in build-poster-frames.mjs. */
const MIN_LUMA = 42
/** A frame with almost no tonal spread is a flat wall or a fade, not a shot. */
const MIN_STD = 12

const DELETE = process.argv.includes('--delete')

async function measure(file) {
    const { stderr } = await run('ffmpeg', ['-i', file, '-vf', 'signalstats,metadata=print',
        '-f', 'null', '-'], { maxBuffer: 1024 * 1024 * 8 }).catch((e) => ({ stderr: e.stderr || '' }))
    const txt = String(stderr)
    return {
        avg: Number(txt.match(/YAVG=([\d.]+)/)?.[1]) || 0,
        std: Number(txt.match(/YSTD=([\d.]+)/)?.[1]) || 0
    }
}

const files = (await readdir(DIR)).filter((f) => f.endsWith('.jpg'))
const bad = []

for (const f of files) {
    const { avg, std } = await measure(path.join(DIR, f))
    if (avg < MIN_LUMA || std < MIN_STD) {
        bad.push({ f, avg: avg.toFixed(0), std: std.toFixed(0) })
    }
}

console.log(`Audited ${files.length} posters (floor: luma ${MIN_LUMA}, spread ${MIN_STD})`)
if (!bad.length) {
    console.log('  all pass')
} else {
    for (const b of bad) console.log(`  REJECT ${b.f}  luma ${b.avg}  spread ${b.std}`)
    if (DELETE) {
        for (const b of bad) await rm(path.join(DIR, b.f), { force: true })
        console.log(`\n  deleted ${bad.length} — re-run build-poster-frames.mjs to regenerate`)
    } else {
        console.log(`\n  ${bad.length} would be removed. Re-run with --delete.`)
    }
}
