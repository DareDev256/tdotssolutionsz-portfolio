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

/**
 * Extract YouTube video ID from a full URL or return the input if already an ID.
 * Handles ?v=ID, ?v=ID&extra, and bare IDs.
 * Returns empty string if the extracted value doesn't pass validation.
 */
export function extractVideoId(urlOrId) {
    if (!urlOrId) return ''
    const vParam = urlOrId.split('v=')[1]
    const candidate = vParam ? vParam.split('&')[0] : urlOrId
    return isValidYouTubeId(candidate) ? candidate : ''
}

/**
 * Build a shareable deep-link URL for a video.
 * Prefers youtubeId property, falls back to extracting from url.
 */
export function getShareUrl(video) {
    const vid = video.youtubeId || extractVideoId(video.url)
    return `${window.location.origin}${window.location.pathname}?v=${vid}`
}

/**
 * Build a YouTube thumbnail URL (hqdefault is always available).
 */
export function getThumbnailUrl(videoId, quality = 'hqdefault') {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}
