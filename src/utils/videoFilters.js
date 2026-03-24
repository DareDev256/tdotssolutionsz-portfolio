/**
 * Video filtering and sorting utilities — single source of truth for ranking logic.
 *
 * Previously, 5+ components each reimplemented [...VIDEOS].sort((a, b) => b.viewCount - a.viewCount).slice(0, N).
 * Centralizing here means ranking strategy changes (e.g. weighting recency) propagate everywhere at once.
 *
 * All functions return new arrays (never mutate input). Accept any video-shaped array
 * so they work with pre-filtered subsets, not just the full VIDEOS export.
 */

/**
 * Sort videos by view count (highest first) and take the top N.
 * @param {Array} videos - Video objects with `viewCount` property
 * @param {number} [limit] - Max results (omit for all)
 * @returns {Array} New sorted array, never mutates input
 */
export function topByViews(videos, limit) {
    const sorted = [...videos].sort((a, b) => b.viewCount - a.viewCount)
    return limit != null ? sorted.slice(0, limit) : sorted
}

/**
 * Sort videos by upload date (newest first) and optionally cap results.
 * @param {Array} videos - Video objects with `uploadDate` string (ISO-ish)
 * @param {number} [limit] - Max results (omit for all)
 * @returns {Array} New sorted array
 */
export function latestFirst(videos, limit) {
    const sorted = [...videos].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    return limit != null ? sorted.slice(0, limit) : sorted
}

/**
 * Filter videos by artist name (exact match on the `artist` field).
 * @param {Array} videos - Full or pre-filtered video array
 * @param {string} artist - Artist name to match
 * @returns {Array} Matching videos (original order preserved)
 */
export function byArtist(videos, artist) {
    return videos.filter(v => v.artist === artist)
}

/**
 * Filter videos whose upload year falls within [startYear, endYear] inclusive.
 * @param {Array} videos - Video objects with `uploadDate` string
 * @param {number} startYear - Inclusive start
 * @param {number} endYear - Inclusive end
 * @returns {Array} Matching videos (original order preserved)
 */
export function byYearRange(videos, startYear, endYear) {
    return videos.filter(v => {
        const year = new Date(v.uploadDate).getFullYear()
        return year >= startYear && year <= endYear
    })
}

/**
 * Get the single most-viewed video for a given artist.
 * Returns null if no videos match.
 * @param {Array} videos - Full video catalog
 * @param {string} artist - Artist name
 * @returns {Object|null} Top video or null
 */
export function topVideoForArtist(videos, artist) {
    return topByViews(byArtist(videos, artist), 1)[0] ?? null
}
