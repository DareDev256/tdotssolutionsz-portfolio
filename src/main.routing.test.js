import { describe, it, expect } from 'vitest'

/**
 * Tests for main.jsx routing logic — pure decision functions extracted
 * from RouteCleanup and VideosRoute without needing React Router mocks.
 *
 * Covers:
 * - Legacy deep-link redirect: /?v=xxx → /videos?v=xxx
 * - Body class cleanup on non-video routes
 * - Device-based component selection (phone vs desktop vs tablet)
 */

// ── RouteCleanup redirect logic ──

/**
 * Determines if a legacy deep-link redirect is needed.
 * Mirrors main.jsx: if pathname is "/" and search contains "v=",
 * redirect to /videos with the same search params.
 * @returns {string|null} redirect path or null
 */
function getRedirectPath(pathname, search) {
    if (pathname === '/' && search.includes('v=')) {
        return `/videos${search}`
    }
    return null
}

/**
 * Determines if body classes should be cleaned up.
 * On non-/videos routes, mobile-mode and desktop-mode should be removed.
 */
function shouldCleanupBodyClasses(pathname) {
    return pathname !== '/videos'
}

describe('RouteCleanup — legacy deep-link redirect', () => {
    it('redirects /?v=xxx to /videos?v=xxx', () => {
        expect(getRedirectPath('/', '?v=dQw4w9WgXcQ')).toBe('/videos?v=dQw4w9WgXcQ')
    })

    it('preserves additional query params in redirect', () => {
        expect(getRedirectPath('/', '?v=dQw4w9WgXcQ&t=120')).toBe('/videos?v=dQw4w9WgXcQ&t=120')
    })

    it('does not redirect / without v= param', () => {
        expect(getRedirectPath('/', '')).toBeNull()
        expect(getRedirectPath('/', '?other=value')).toBeNull()
    })

    it('does not redirect /videos with v= (already correct)', () => {
        expect(getRedirectPath('/videos', '?v=dQw4w9WgXcQ')).toBeNull()
    })

    it('does not redirect other paths even with v= param', () => {
        expect(getRedirectPath('/photos', '?v=dQw4w9WgXcQ')).toBeNull()
        expect(getRedirectPath('/about', '?v=test')).toBeNull()
    })

    it('does not false-positive on params that look similar to v=', () => {
        expect(getRedirectPath('/', '?preview=true')).toBeNull()
        expect(getRedirectPath('/', '?view=gallery')).toBeNull()
    })

    it('does trigger on non-standard v= positions (substring match)', () => {
        // The code uses search.includes('v='), so ?other=1&v=abc triggers
        expect(getRedirectPath('/', '?other=1&v=abc')).toBe('/videos?other=1&v=abc')
    })
})

describe('RouteCleanup — body class cleanup', () => {
    it('cleans up on hub page /', () => {
        expect(shouldCleanupBodyClasses('/')).toBe(true)
    })

    it('does not clean up on /videos', () => {
        expect(shouldCleanupBodyClasses('/videos')).toBe(false)
    })

    it('cleans up on /photos and other routes', () => {
        expect(shouldCleanupBodyClasses('/photos')).toBe(true)
        expect(shouldCleanupBodyClasses('/unknown')).toBe(true)
    })
})

// ── VideosRoute device selection ──

/**
 * Mirrors VideosRoute component selection and body class logic.
 * @param {'phone'|'tablet'|'desktop'} deviceType
 * @returns {{ component: string, bodyClass: string, reducedEffects: boolean }}
 */
function getVideoRouteConfig(deviceType) {
    const isPhone = deviceType === 'phone'
    return {
        component: isPhone ? 'MobileApp' : 'App',
        bodyClass: isPhone ? 'mobile-mode' : 'desktop-mode',
        reducedEffects: deviceType === 'tablet',
    }
}

describe('VideosRoute — device-based rendering', () => {
    it('renders MobileApp with mobile-mode class for phone', () => {
        const config = getVideoRouteConfig('phone')
        expect(config.component).toBe('MobileApp')
        expect(config.bodyClass).toBe('mobile-mode')
        expect(config.reducedEffects).toBe(false)
    })

    it('renders App with desktop-mode class for desktop', () => {
        const config = getVideoRouteConfig('desktop')
        expect(config.component).toBe('App')
        expect(config.bodyClass).toBe('desktop-mode')
        expect(config.reducedEffects).toBe(false)
    })

    it('renders App with reduced effects for tablet', () => {
        const config = getVideoRouteConfig('tablet')
        expect(config.component).toBe('App')
        expect(config.bodyClass).toBe('desktop-mode')
        expect(config.reducedEffects).toBe(true)
    })
})
