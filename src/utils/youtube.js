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
        if (!SHARE_HOSTS.has(parsed.hostname)) return false
        // Enforce noopener,noreferrer — never allow caller to weaken this
        window.open(url, '_blank', 'noopener,noreferrer')
        return true
    } catch {
        return false
    }
}

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
