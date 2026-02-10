/**
 * YouTube URL/ID utilities — single source of truth for video ID extraction
 * and shareable link generation across desktop, mobile, and theater mode.
 */

/**
 * Extract YouTube video ID from a full URL or return the input if already an ID.
 * Handles ?v=ID, ?v=ID&extra, and bare IDs.
 */
export function extractVideoId(urlOrId) {
    if (!urlOrId) return ''
    const vParam = urlOrId.split('v=')[1]
    if (!vParam) return urlOrId
    return vParam.split('&')[0]
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
