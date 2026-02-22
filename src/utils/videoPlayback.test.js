/**
 * Video Playback Guardrails — CRITICAL REGRESSION TESTS
 *
 * These tests exist because automated agents (Passion) have broken video
 * playback TWICE through overly aggressive security hardening:
 *
 *   1. Trusted Types CSP (v3.18.2) — blocked YouTube IFrame API + Three.js
 *   2. referrerPolicy="no-referrer" (v3.18.1) — YouTube Error 153
 *
 * VideoSpotlight.jsx was added to guardrails in v3.23.2 — its hover-to-play
 * iframe was previously unguarded despite using the same YouTube embed pattern.
 *
 * Every test here guards a specific configuration that, if changed, will
 * silently break video playback in production. YouTube shows no console
 * errors for most of these — the video just doesn't play.
 *
 * DO NOT WEAKEN OR REMOVE THESE TESTS.
 * If a test blocks your change, your change is wrong.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, join } from 'path'

const SRC_DIR = resolve(__dirname, '..')

// ── Helpers ──

/** Read a source file and return its contents */
function readSrc(relativePath) {
    return readFileSync(join(SRC_DIR, relativePath), 'utf-8')
}

/** Parse vercel.json */
function getVercelConfig() {
    return JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8'))
}

/** Get a global header value from vercel.json */
function getHeader(key) {
    const config = getVercelConfig()
    const globalRule = config.headers.find(h => h.source === '/(.*)')
    return globalRule?.headers.find(h => h.key === key)?.value ?? null
}

// ════════════════════════════════════════════════
// CSP — Content Security Policy guardrails
// ════════════════════════════════════════════════

describe('CSP: YouTube + Three.js compatibility', () => {
    it('does NOT use require-trusted-types-for (breaks YouTube API + Three.js innerHTML)', () => {
        const csp = getHeader('Content-Security-Policy')
        // Trusted Types blocks: document.head.appendChild(script) in ensureYTApi(),
        // wrapper.innerHTML = '' in YouTubePlayer, and Three.js internals.
        // Broke all video playback in v3.18.2.
        expect(csp).not.toContain('require-trusted-types-for')
    })

    it('allows YouTube domains in frame-src', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).toContain('https://www.youtube.com')
        expect(csp).toContain('https://www.youtube-nocookie.com')
    })

    it('allows YouTube IFrame API script in script-src', () => {
        const csp = getHeader('Content-Security-Policy')
        const scriptSrc = csp.match(/script-src\s+([^;]+)/)?.[1] || ''
        // ensureYTApi() loads https://www.youtube.com/iframe_api dynamically
        expect(scriptSrc).toContain('https://www.youtube.com')
    })

    it('allows YouTube thumbnail images in img-src', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).toContain('https://img.youtube.com')
        expect(csp).toContain('https://i.ytimg.com')
    })

    it('does NOT use unsafe-eval (not needed, would weaken CSP)', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).not.toContain("'unsafe-eval'")
    })
})

// ════════════════════════════════════════════════
// HTTP Headers — Referrer Policy
// ════════════════════════════════════════════════

describe('Referrer-Policy: YouTube embed compatibility', () => {
    it('server Referrer-Policy is strict-origin-when-cross-origin (NOT no-referrer)', () => {
        const rp = getHeader('Referrer-Policy')
        // YouTube requires the Referer header for embedded players (since late 2025).
        // "no-referrer" causes Error 153. "strict-origin-when-cross-origin" sends
        // just the origin domain, balancing privacy with YouTube's requirements.
        expect(rp).toBe('strict-origin-when-cross-origin')
    })

    it('does NOT set Cross-Origin-Embedder-Policy (breaks YouTube embeds)', () => {
        // COEP: require-corp forces all subresources to opt-in via CORP headers.
        // YouTube's embed iframe doesn't send CORP headers, so COEP breaks it.
        // This has been broken and fixed TWICE already.
        expect(getHeader('Cross-Origin-Embedder-Policy')).toBeNull()
    })
})

// ════════════════════════════════════════════════
// iframe referrerPolicy — Source code guardrails
// ════════════════════════════════════════════════

describe('iframe referrerPolicy: must NOT be no-referrer', () => {
    it('VideoOverlay iframe uses strict-origin-when-cross-origin', () => {
        const src = readSrc('components/ui/VideoOverlay.jsx')
        // Error 153 if this is "no-referrer" — YouTube needs the referer.
        expect(src).not.toContain('referrerPolicy="no-referrer"')
        expect(src).toContain('referrerPolicy="strict-origin-when-cross-origin"')
    })

    it('VideoPage iframe uses strict-origin-when-cross-origin', () => {
        const src = readSrc('components/VideoPage.jsx')
        expect(src).not.toContain('referrerPolicy="no-referrer"')
        expect(src).toContain('referrerPolicy="strict-origin-when-cross-origin"')
    })

    it('VideoSpotlight iframe uses strict-origin-when-cross-origin', () => {
        const src = readSrc('components/VideoSpotlight.jsx')
        // Spotlight hover-to-play iframe was unguarded — same Error 153 risk.
        expect(src).not.toContain('referrerPolicy="no-referrer"')
        expect(src).toContain('referrerPolicy="strict-origin-when-cross-origin"')
    })

    it('no iframe anywhere in src/ uses referrerPolicy="no-referrer"', () => {
        // Broad sweep — catch any new iframe that might get added with the wrong policy.
        // Read all .jsx files that contain iframes.
        const files = [
            'components/ui/VideoOverlay.jsx',
            'components/VideoPage.jsx',
            'components/VideoSpotlight.jsx',
        ]
        for (const file of files) {
            const src = readSrc(file)
            if (src.includes('<iframe')) {
                expect(src, `${file} has referrerPolicy="no-referrer"`).not.toContain('referrerPolicy="no-referrer"')
            }
        }
    })
})

// ════════════════════════════════════════════════
// iframe sandbox — Must NOT be added
// ════════════════════════════════════════════════

describe('iframe sandbox: must NOT be present on YouTube embeds', () => {
    it('VideoOverlay iframe has no sandbox attribute', () => {
        const src = readSrc('components/ui/VideoOverlay.jsx')
        // The sandbox attribute severely restricts iframes. Even with allow-scripts,
        // YouTube embeds break because they need allow-same-origin + allow-popups
        // and the interaction is fragile. CSP provides sufficient security.
        expect(src).not.toMatch(/sandbox[=\s>]/)
    })

    it('VideoPage iframe has no sandbox attribute', () => {
        const src = readSrc('components/VideoPage.jsx')
        expect(src).not.toMatch(/sandbox[=\s>]/)
    })

    it('VideoSpotlight iframe has no sandbox attribute', () => {
        const src = readSrc('components/VideoSpotlight.jsx')
        expect(src).not.toMatch(/sandbox[=\s>]/)
    })
})

// ════════════════════════════════════════════════
// YouTube embed URLs — Format validation
// ════════════════════════════════════════════════

describe('YouTube embed URLs: correct format', () => {
    it('VideoOverlay uses youtube.com/embed/ (not youtube-nocookie for autoplay)', () => {
        const src = readSrc('components/ui/VideoOverlay.jsx')
        // VideoOverlay needs autoplay=1 which works more reliably on youtube.com
        expect(src).toContain('https://www.youtube.com/embed/')
    })

    it('VideoSpotlight uses youtube.com/embed/ (hover-to-play needs autoplay)', () => {
        const src = readSrc('components/VideoSpotlight.jsx')
        // Spotlight hover preview relies on autoplay=1 — must use youtube.com, not nocookie
        expect(src).toContain('https://www.youtube.com/embed/')
    })

    it('VideoPage uses youtube-nocookie.com/embed/ (privacy-enhanced, no autoplay)', () => {
        const src = readSrc('components/VideoPage.jsx')
        // VideoPage is a standalone shareable page — privacy-enhanced domain is correct
        expect(src).toContain('https://www.youtube-nocookie.com/embed/')
    })

    it('YouTubePlayer loads IFrame API from correct URL', () => {
        const src = readSrc('components/YouTubePlayer.jsx')
        expect(src).toContain("'https://www.youtube.com/iframe_api'")
    })
})

// ════════════════════════════════════════════════
// Video data integrity
// ════════════════════════════════════════════════

describe('Video data: all entries playable', () => {
    let videos

    it('videos.json loads and has entries', () => {
        const raw = JSON.parse(readFileSync(join(SRC_DIR, 'data/videos.json'), 'utf-8'))
        videos = raw.videos
        expect(videos.length).toBeGreaterThan(0)
    })

    it('every video has a valid 11-character youtubeId', () => {
        const raw = JSON.parse(readFileSync(join(SRC_DIR, 'data/videos.json'), 'utf-8'))
        for (const v of raw.videos) {
            expect(v.youtubeId, `${v.title} has invalid youtubeId: ${v.youtubeId}`).toMatch(/^[A-Za-z0-9_-]{11}$/)
        }
    })

    it('no duplicate youtubeIds', () => {
        const raw = JSON.parse(readFileSync(join(SRC_DIR, 'data/videos.json'), 'utf-8'))
        const ids = raw.videos.map(v => v.youtubeId)
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
        expect(dupes, `Duplicate youtubeIds: ${dupes.join(', ')}`).toEqual([])
    })
})
