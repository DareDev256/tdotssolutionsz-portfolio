import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const vercelConfig = JSON.parse(
    readFileSync(resolve(__dirname, '../../vercel.json'), 'utf-8')
)

/** Helper: get the value of a global header by key name */
function getHeader(key) {
    const globalRule = vercelConfig.headers.find(h => h.source === '/(.*)')
    const entry = globalRule?.headers.find(h => h.key === key)
    return entry?.value ?? null
}

describe('vercel.json security headers', () => {
    it('enforces Content-Security-Policy (not report-only)', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).toBeTruthy()
        // Should NOT be report-only — that would be a separate header key
        const reportOnly = getHeader('Content-Security-Policy-Report-Only')
        expect(reportOnly).toBeNull()
    })

    it('includes Strict-Transport-Security with preload', () => {
        const hsts = getHeader('Strict-Transport-Security')
        expect(hsts).toContain('max-age=')
        expect(hsts).toContain('includeSubDomains')
        expect(hsts).toContain('preload')
    })

    it('sets X-Frame-Options to DENY', () => {
        expect(getHeader('X-Frame-Options')).toBe('DENY')
    })

    it('sets X-Content-Type-Options to nosniff', () => {
        expect(getHeader('X-Content-Type-Options')).toBe('nosniff')
    })

    it('does NOT include Cross-Origin-Embedder-Policy (breaks YouTube embeds)', () => {
        expect(getHeader('Cross-Origin-Embedder-Policy')).toBeNull()
    })

    it('includes Cross-Origin-Opener-Policy (COOP)', () => {
        const coop = getHeader('Cross-Origin-Opener-Policy')
        expect(coop).toBeTruthy()
        expect(coop).toContain('same-origin')
    })

    it('includes Cross-Origin-Resource-Policy (CORP)', () => {
        expect(getHeader('Cross-Origin-Resource-Policy')).toBe('cross-origin')
    })

    it('disables unnecessary browser features via Permissions-Policy', () => {
        const pp = getHeader('Permissions-Policy')
        expect(pp).toContain('camera=()')
        expect(pp).toContain('microphone=()')
        expect(pp).toContain('geolocation=()')
    })

    it('blocks Flash/Acrobat cross-domain policies', () => {
        expect(getHeader('X-Permitted-Cross-Domain-Policies')).toBe('none')
    })

    it('CSP blocks object-src and sets frame-ancestors none', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).toContain("object-src 'none'")
        expect(csp).toContain("frame-ancestors 'none'")
    })

    it('CSP includes upgrade-insecure-requests', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).toContain('upgrade-insecure-requests')
    })

    it('CSP does NOT use Trusted Types (incompatible with YouTube IFrame API + Three.js)', () => {
        const csp = getHeader('Content-Security-Policy')
        // Trusted Types blocks innerHTML and dynamic script insertion, which breaks
        // YouTube IFrame API (ensureYTApi) and Three.js internals. Removed intentionally.
        expect(csp).not.toContain("require-trusted-types-for")
    })

    it('CSP restricts form-action to same-origin (form hijack prevention)', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).toContain("form-action 'self'")
    })

    it('CSP restricts base-uri to same-origin (base tag hijack prevention)', () => {
        const csp = getHeader('Content-Security-Policy')
        // Prevents <base href="https://evil.com"> injection which would redirect
        // all relative URLs to an attacker-controlled domain.
        expect(csp).toContain("base-uri 'self'")
    })

    it('CSP does NOT contain unsafe-eval anywhere', () => {
        const csp = getHeader('Content-Security-Policy')
        expect(csp).not.toContain("'unsafe-eval'")
    })
})

describe('CSP style-src: unsafe-inline intentionally allowed', () => {
    it('style-src includes unsafe-inline (required by React inline styles + Three.js)', () => {
        const csp = getHeader('Content-Security-Policy')
        const styleSrc = csp.match(/style-src\s+([^;]+)/)?.[1] || ''
        // React's style prop generates inline styles. Three.js and drei also inject
        // inline styles for canvas sizing. Removing unsafe-inline breaks rendering.
        // This is a conscious tradeoff documented here to prevent future agents
        // from removing it in the name of "security hardening".
        expect(styleSrc).toContain("'unsafe-inline'")
    })
})

describe('CSP script-src hardening', () => {
    it('does NOT allow unsafe-inline in script-src (XSS prevention)', () => {
        const csp = getHeader('Content-Security-Policy')
        const scriptSrc = csp.match(/script-src\s+([^;]+)/)?.[1] || ''
        // Vite production builds use external module scripts, not inline.
        // unsafe-inline in script-src defeats the purpose of CSP against XSS.
        expect(scriptSrc).not.toContain("'unsafe-inline'")
    })

    it('allows blob: in script-src (required for Three.js worker importScripts)', () => {
        const csp = getHeader('Content-Security-Policy')
        // Three.js workers use importScripts() with blob: URLs, which is governed
        // by script-src, not worker-src. Removing blob: from script-src breaks the 3D scene.
        const scriptSrc = csp.match(/script-src\s+([^;]+)/)?.[1] || ''
        expect(scriptSrc).toContain('blob:')
    })

    it('still allows blob: in worker-src for Three.js Web Workers', () => {
        const csp = getHeader('Content-Security-Policy')
        const workerSrc = csp.match(/worker-src\s+([^;]+)/)?.[1] || ''
        expect(workerSrc).toContain('blob:')
    })

    it('connect-src includes cdn.jsdelivr.net (required by Troika font loading in drei Text)', () => {
        const csp = getHeader('Content-Security-Policy')
        const connectSrc = csp.match(/connect-src\s+([^;]+)/)?.[1] || ''
        // Troika (drei's Text component) fetches fonts from jsdelivr inside Web Workers.
        // Worker fetch() calls are governed by connect-src, not font-src.
        // Removing this breaks 3D text labels. Do NOT remove.
        expect(connectSrc).toContain('cdn.jsdelivr.net')
    })
})

describe('Permissions-Policy hardening', () => {
    it('blocks hardware access APIs (usb, bluetooth, serial, hid)', () => {
        const pp = getHeader('Permissions-Policy')
        expect(pp).toContain('usb=()')
        expect(pp).toContain('bluetooth=()')
        expect(pp).toContain('serial=()')
        expect(pp).toContain('hid=()')
    })

    it('blocks payment API', () => {
        const pp = getHeader('Permissions-Policy')
        expect(pp).toContain('payment=()')
    })

    it('restricts autoplay to same-origin only', () => {
        const pp = getHeader('Permissions-Policy')
        expect(pp).toContain('autoplay=(self)')
    })

    it('blocks screen capture and XR tracking APIs', () => {
        const pp = getHeader('Permissions-Policy')
        expect(pp).toContain('display-capture=()')
        expect(pp).toContain('screen-wake-lock=()')
        expect(pp).toContain('xr-spatial-tracking=()')
    })

    it('blocks device sensor APIs used for fingerprinting (accelerometer, gyroscope, magnetometer)', () => {
        const pp = getHeader('Permissions-Policy')
        // Motion/orientation sensors enable device fingerprinting by correlating
        // hardware noise patterns. No video portfolio needs accelerometer data.
        expect(pp).toContain('accelerometer=()')
        expect(pp).toContain('gyroscope=()')
        expect(pp).toContain('magnetometer=()')
    })

    it('blocks ambient light sensor and idle detection APIs', () => {
        const pp = getHeader('Permissions-Policy')
        // Ambient light sensor can leak screen content via luminance side-channel.
        // Idle detection reveals user presence patterns — privacy risk.
        expect(pp).toContain('ambient-light-sensor=()')
        expect(pp).toContain('idle-detection=()')
    })

    it('blocks clipboard-read (clipboard-write allowed for copy link feature)', () => {
        const pp = getHeader('Permissions-Policy')
        // Clipboard read could exfiltrate user clipboard data.
        // Clipboard write is needed for the "Copy Link" feature.
        expect(pp).toContain('clipboard-read=()')
    })
})

describe('vercel.json cache control', () => {
    it('prevents caching of index.html (stale CSP prevention)', () => {
        const htmlRule = vercelConfig.headers.find(h => h.source === '/index.html')
        const cc = htmlRule?.headers.find(h => h.key === 'Cache-Control')?.value
        expect(cc).toContain('no-store')
        expect(cc).toContain('must-revalidate')
    })

    it('sets immutable cache on hashed assets', () => {
        const assetRule = vercelConfig.headers.find(h => h.source === '/assets/(.*)')
        const cc = assetRule?.headers.find(h => h.key === 'Cache-Control')?.value
        expect(cc).toContain('immutable')
        expect(cc).toContain('max-age=31536000')
    })
})
