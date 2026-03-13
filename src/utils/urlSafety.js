/**
 * URL & data safety utilities — defense-in-depth guards for client-side
 * navigation, history state, and untrusted JSON parsing.
 *
 * Addresses:
 *   CWE-79  — XSS via javascript:/data: URLs in navigation contexts
 *   CWE-1321 — Prototype pollution via JSON.parse on untrusted input
 *   CWE-601  — Open redirect via unvalidated replaceState targets
 *
 * @module urlSafety
 */

/**
 * Dangerous URI schemes that execute code or embed arbitrary content
 * when used in navigation (window.open, location.href, anchor href,
 * history.replaceState followed by popstate handlers).
 *
 * Case-insensitive matching catches `JavaScript:`, `DATA:`, etc.
 */
const DANGEROUS_SCHEME_RE = /^(javascript|data|vbscript|blob)\s*:/i

/**
 * Test whether a URL string uses a dangerous protocol scheme.
 * Returns true if the URL would execute code or embed untrusted data
 * when used in a navigation or link context.
 *
 * @param {string} url - URL to check
 * @returns {boolean} true if the scheme is dangerous
 */
export function isDangerousScheme(url) {
    if (!url || typeof url !== 'string') return false
    // Trim leading whitespace — browsers normalize this, attackers exploit it
    return DANGEROUS_SCHEME_RE.test(url.trimStart())
}

/**
 * Safe wrapper around history.replaceState that enforces same-origin
 * relative URLs only. Blocks absolute URLs, protocol-relative URLs,
 * and dangerous schemes.
 *
 * Why: replaceState itself doesn't navigate, but the URL it writes
 * becomes the page's canonical location. A crafted absolute URL in
 * the address bar can confuse users (social engineering) or break
 * relative link resolution.
 *
 * @param {string} url - Relative URL to set (e.g., "?v=abc123" or "/")
 * @returns {boolean} true if replaceState was called, false if blocked
 */
export function safeReplaceState(url) {
    if (!url || typeof url !== 'string') return false
    // Block absolute URLs, protocol-relative URLs, and dangerous schemes
    if (url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return false
    if (isDangerousScheme(url)) return false
    try {
        window.history.replaceState(null, '', url)
        return true
    } catch {
        return false
    }
}

/**
 * JSON.parse with prototype pollution prevention.
 *
 * Strips __proto__, constructor, and prototype keys during parsing
 * using a reviver function. This prevents untrusted JSON stored in
 * localStorage (or received from postMessage/URL fragments) from
 * polluting Object.prototype via crafted payloads like:
 *   [{"__proto__": {"isAdmin": true}}]
 *
 * @param {string} raw - Raw JSON string to parse
 * @param {*} fallback - Return value if parsing fails (default: null)
 * @returns {*} Parsed value with dangerous keys stripped, or fallback on error
 */
const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function safeJsonParse(raw, fallback = null) {
    if (!raw || typeof raw !== 'string') return fallback
    try {
        return JSON.parse(raw, (key, value) => {
            if (POISON_KEYS.has(key)) return undefined // strip poisoned key
            return value
        })
    } catch {
        return fallback
    }
}
