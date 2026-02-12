/**
 * Shared formatting utilities for view counts, dates, and years.
 * Single source of truth — used by App.jsx, MobileApp.jsx, and VideoCard.jsx.
 */

/**
 * Format a view count into a compact string (e.g. 5200000 → "5.2M", 1500 → "2K").
 * @param {number} count - Raw view count
 * @returns {string} Compact display string with K/M suffix
 */
export function formatViews(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
}

/**
 * Extract the 4-digit year from an ISO date string.
 * @param {string} dateString - ISO 8601 date (e.g. "2024-03-15")
 * @returns {string} Four-digit year (e.g. "2024")
 */
export function formatYear(dateString) {
    return new Date(dateString).getFullYear().toString()
}

/**
 * Format a date as relative time (e.g. "3d ago", "2w ago", "5mo ago", "1y ago").
 * @param {string} dateString - ISO 8601 date
 * @returns {string} Human-readable relative time string
 */
export function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
}
