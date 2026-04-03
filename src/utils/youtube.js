/**
 * YouTube URL/ID utilities — single source of truth for video ID extraction
 * and shareable link generation across desktop, mobile, and theater mode.
 */

/** YouTube video IDs are exactly 11 chars: alphanumeric plus - and _ */
const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/

/**
 * Validate a string looks like a legitimate YouTube video ID.
 * Rejects anything that doesn't match the 11-char alphanumeric pattern,
 * preventing reflected content injection via the ?v= deep link param.
 */
export function isValidYouTubeId(id) {
    return typeof id === 'string' && YT_ID_RE.test(id)
}

/** Hostnames accepted as YouTube origins for URL parsing */
const YT_HOSTS = new Set([
    'youtube.com', 'www.youtube.com', 'm.youtube.com',
    'youtu.be', 'www.youtu.be',
    'music.youtube.com',
])

/**
 * Extract YouTube video ID from a full URL or return the input if already an ID.
 * Only accepts YouTube-origin URLs (youtube.com, youtu.be, music.youtube.com).
 * Handles ?v=ID, ?v=ID&extra, youtu.be/ID, and bare IDs.
 * Returns empty string if the extracted value doesn't pass validation.
 */
export function extractVideoId(urlOrId) {
    if (!urlOrId) return ''
    // Bare ID (no protocol/slash) — validate directly
    if (!urlOrId.includes('/')) {
        return isValidYouTubeId(urlOrId) ? urlOrId : ''
    }
    // URL — only accept YouTube origins
    try {
        const url = new URL(urlOrId)
        if (!YT_HOSTS.has(url.hostname)) return ''
        // youtu.be/ID short links
        if (url.hostname === 'youtu.be' || url.hostname === 'www.youtu.be') {
            const candidate = url.pathname.slice(1).split('/')[0]
            return isValidYouTubeId(candidate) ? candidate : ''
        }
        // Standard ?v= parameter
        const candidate = url.searchParams.get('v') || ''
        return isValidYouTubeId(candidate) ? candidate : ''
    } catch {
        // Not a valid URL and not a bare ID — reject
        return ''
    }
}

/**
 * Build a shareable deep-link URL for a video.
 * Prefers youtubeId property, falls back to extracting from url.
 * Validates the ID before embedding to prevent URL injection.
 */
export function getShareUrl(video) {
    const candidate = video.youtubeId || extractVideoId(video.url)
    const vid = isValidYouTubeId(candidate) ? candidate : ''
    return `${window.location.origin}${window.location.pathname}?v=${vid}`
}

/** Allowed social share target hosts */
const SHARE_HOSTS = new Set([
    'twitter.com', 'x.com',
    'wa.me', 'api.whatsapp.com',
])

/**
 * Open a social share popup with host allowlisting.
 * Only navigates to pre-approved share targets, preventing open redirect
 * if share URLs are ever constructed from untrusted input.
 * Always enforces noopener,noreferrer regardless of caller input to prevent
 * reverse tabnapping (window.opener access from opened page).
 * @param {string} url - Full share URL to open
 * @returns {boolean} true if the popup was opened, false if blocked
 */
export function openShareWindow(url) {
    try {
        const parsed = new URL(url)
        // Enforce HTTPS — block http:, javascript:, data:, and other protocol attacks
        if (parsed.protocol !== 'https:') return false
        if (!SHARE_HOSTS.has(parsed.hostname)) return false
        // Enforce noopener,noreferrer — never allow caller to weaken this
        window.open(url, '_blank', 'noopener,noreferrer')
        return true
    } catch {
        return false
    }
}

// ── Embed URL builder ──

/** Allowed embed parameter keys (allowlist prevents injection via option keys) */
const EMBED_PARAM_ALLOWLIST = new Set([
    'autoplay', 'mute', 'controls', 'showinfo', 'rel',
    'modestbranding', 'loop', 'playlist', 'enablejsapi',
    'playsinline', 'origin', 'start', 'end',
])

/**
 * Build a YouTube embed URL with validated parameters.
 *
 * Centralizes embed URL construction that was previously duplicated across
 * VideoSpotlight, VideoOverlay, and VideoPage with inconsistent parameters.
 * Uses URLSearchParams for safe encoding instead of raw string interpolation.
 *
 * @param {string} videoId - 11-char YouTube video ID
 * @param {Object} [options]
 * @param {boolean} [options.privacyEnhanced=false] - Use youtube-nocookie.com domain
 * @param {boolean} [options.autoplay=false] - Start playing immediately
 * @param {boolean} [options.muted=false] - Start muted
 * @param {boolean} [options.controls=true] - Show player controls
 * @param {boolean} [options.loop=false] - Loop playback (sets playlist=videoId automatically)
 * @param {Object} [options.extra] - Additional allowlisted params (e.g. { showinfo: 0, enablejsapi: 1 })
 * @returns {string} Full embed URL, or empty string if videoId is invalid
 */
export function buildEmbedUrl(videoId, options = {}) {
    if (!isValidYouTubeId(videoId)) return ''

    const {
        privacyEnhanced = false,
        autoplay = false,
        muted = false,
        controls = true,
        loop = false,
        extra = {},
    } = options

    const domain = privacyEnhanced
        ? 'https://www.youtube-nocookie.com'
        : 'https://www.youtube.com'

    const params = new URLSearchParams()
    if (autoplay) params.set('autoplay', '1')
    if (muted) params.set('mute', '1')
    if (!controls) params.set('controls', '0')
    params.set('rel', '0')
    params.set('modestbranding', '1')
    if (loop) {
        params.set('loop', '1')
        params.set('playlist', videoId)
    }

    // Merge extra params — only allowlisted keys, values coerced to string
    for (const [key, val] of Object.entries(extra)) {
        if (EMBED_PARAM_ALLOWLIST.has(key)) {
            params.set(key, String(val))
        }
    }

    return `${domain}/embed/${videoId}?${params.toString()}`
}

// ── Thumbnail URL builder ──

/** Allowed YouTube thumbnail quality presets */
const VALID_QUALITIES = new Set([
    'default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault'
])

/**
 * Build a YouTube thumbnail URL (hqdefault is always available).
 * Validates both videoId and quality to prevent URL path injection.
 */
export function getThumbnailUrl(videoId, quality = 'hqdefault') {
    if (!isValidYouTubeId(videoId)) return ''
    const safeQuality = VALID_QUALITIES.has(quality) ? quality : 'hqdefault'
    return `https://img.youtube.com/vi/${videoId}/${safeQuality}.jpg`
}
