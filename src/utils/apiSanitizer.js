/**
 * Build-time API response sanitizer — defense-in-depth for external data
 * entering the client-side bundle via the YouTube API fetch pipeline.
 *
 * Problem: `fetch-youtube-data.js` calls the YouTube Data API v3 and writes
 * the response directly into `public/videos-enriched.json`. If the API response
 * were compromised (supply chain, MITM, CDN poisoning), malicious payloads would
 * be bundled into the client app unfiltered.
 *
 * Addresses:
 *   CWE-20   — Improper input validation (untrusted API data accepted as-is)
 *   CWE-79   — XSS via injected HTML/script in API string fields
 *   CWE-1321 — Prototype pollution via __proto__/constructor keys in JSON
 *
 * @module apiSanitizer
 */

/** Keys that enable prototype pollution when present in parsed JSON */
const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** HTML tags and script patterns — strip from string fields to prevent stored XSS */
const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi

/** Control characters that can corrupt rendering or exploit text processors */
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g

/** Allowed origins for thumbnail/image URLs from YouTube API responses */
const ALLOWED_IMG_ORIGINS = new Set([
  'https://img.youtube.com',
  'https://i.ytimg.com',
  'https://i9.ytimg.com',
  'https://yt3.ggpht.com',
  'https://yt3.googleusercontent.com',
])

/**
 * Sanitize a string value from an API response.
 * Strips HTML tags, control characters, and truncates to a safe length.
 *
 * @param {string} str - Raw string from API
 * @param {number} maxLen - Maximum allowed length (default 500)
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return ''
  return str
    .replace(HTML_TAG_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .slice(0, maxLen)
}

/**
 * Validate that a URL string points to an allowed image origin.
 * Rejects anything outside the YouTube/Google image CDN allowlist.
 *
 * @param {string} url - URL to validate
 * @returns {boolean} true if the URL origin is allowlisted
 */
export function isAllowedImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    return ALLOWED_IMG_ORIGINS.has(parsed.origin)
  } catch {
    return false
  }
}

/**
 * Recursively strip prototype pollution keys from an object tree.
 * Operates on plain objects and arrays — ignores primitives.
 *
 * @param {*} obj - Value to sanitize
 * @returns {*} Sanitized value with poison keys removed
 */
export function stripPoisonKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripPoisonKeys)

  const clean = {}
  for (const [key, value] of Object.entries(obj)) {
    if (POISON_KEYS.has(key)) continue
    clean[key] = stripPoisonKeys(value)
  }
  return clean
}

/**
 * Sanitize a single YouTube API video item before it enters the build output.
 * Validates and cleans all fields that will be rendered client-side.
 *
 * @param {object} item - A single item from YouTube API `items[]`
 * @param {string} fallbackId - The expected video ID (for cross-checking)
 * @returns {object|null} Sanitized item or null if critically malformed
 */
export function sanitizeVideoItem(item, fallbackId) {
  if (!item || typeof item !== 'object') return null

  const cleaned = stripPoisonKeys(item)

  // Cross-check: API item ID must match what we requested
  if (cleaned.id && cleaned.id !== fallbackId) return null

  const snippet = cleaned.snippet || {}
  const stats = cleaned.statistics || {}

  // Sanitize string fields that get rendered in the UI
  const channelTitle = sanitizeString(snippet.channelTitle || '', 100)
  const publishedAt = sanitizeString(snippet.publishedAt || '', 30)

  // Validate thumbnail URLs against allowlist
  const thumbnails = snippet.thumbnails || {}
  const safeThumbnails = {}
  for (const [quality, thumb] of Object.entries(thumbnails)) {
    if (thumb && isAllowedImageUrl(thumb.url)) {
      safeThumbnails[quality] = { url: thumb.url }
    }
  }

  // Validate numeric statistics — must be non-negative integers
  const viewCount = Math.max(0, parseInt(stats.viewCount, 10) || 0)

  return {
    id: fallbackId,
    snippet: {
      channelTitle,
      publishedAt,
      thumbnails: safeThumbnails,
    },
    statistics: { viewCount: String(viewCount) },
  }
}

// Exported for testing
export { POISON_KEYS, HTML_TAG_RE, CONTROL_CHAR_RE, ALLOWED_IMG_ORIGINS }
