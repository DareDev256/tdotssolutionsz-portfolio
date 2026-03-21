/**
 * Shared security constants — single source of truth for defense-in-depth
 * primitives used across the sanitization, URL safety, and search modules.
 *
 * Centralizing these prevents silent divergence:
 *   - POISON_KEYS was duplicated in apiSanitizer.js and urlSafety.js
 *   - Control char regexes had two scopes (ASCII-only vs Unicode-aware)
 *     with no documentation explaining the intentional difference
 *
 * Addresses:
 *   CWE-1321 — Prototype pollution via __proto__/constructor/prototype keys
 *   CWE-20   — Improper input validation (control character injection)
 *   CWE-79   — XSS via HTML tags embedded in API/user strings
 *
 * @module securityConstants
 */

/**
 * Keys that enable prototype pollution when present in parsed JSON.
 * Used by both build-time API sanitization and runtime JSON parsing.
 *
 * Any module that strips or rejects object keys for security reasons
 * MUST use this set — do not define a local copy.
 */
export const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * ASCII control characters (C0 range 0x00–0x08, 0x0B, 0x0C, 0x0E–0x1F;
 * C1 range 0x7F–0x9F). Strips characters that corrupt text rendering or
 * exploit parsers, while preserving tabs (0x09), newlines (0x0A), and
 * carriage returns (0x0D).
 *
 * Scope: API response data (YouTube Data API v3 string fields).
 * These payloads are pre-validated by Google, so ASCII coverage suffices.
 */
export const CONTROL_CHAR_ASCII_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g

/**
 * Extended control + zero-width Unicode characters. Includes everything in
 * CONTROL_CHAR_ASCII_RE plus:
 *   - Zero-width spaces/joiners (U+200B–U+200F)
 *   - Line/paragraph separators (U+2028–U+202F)
 *   - BOM (U+FEFF)
 *   - Specials block (U+FFF0–U+FFFF)
 *
 * Scope: User-typed input (search queries, form fields). User input can
 * contain any Unicode, so we strip the full zero-width/invisible range
 * to prevent fuzzy matching bypass and rendering corruption.
 */
export const CONTROL_CHAR_UNICODE_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\uFEFF\uFFF0-\uFFFF]/g

/**
 * HTML tags and script injection patterns. Strips any opening or closing
 * HTML tag from string fields to prevent stored XSS when API data is
 * rendered into the DOM.
 */
export const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi
