/**
 * YouTube API response envelope sanitizer — validates the outer structure
 * of YouTube Data API v3 responses before individual items are processed.
 *
 * This module operates UPSTREAM of apiSanitizer.js. While apiSanitizer
 * handles per-item field sanitization (XSS, poison keys, origin validation),
 * this module validates the response envelope itself:
 *
 *   1. Schema shape — rejects responses missing required envelope fields
 *   2. Item count ceiling — prevents amplification attacks via inflated items[]
 *   3. Payload size guard — rejects oversized responses before JSON parsing
 *   4. Kind/etag format — validates YouTube-specific envelope metadata
 *   5. PageInfo bounds — detects impossible totalResults values
 *
 * Addresses:
 *   CWE-20   — Improper input validation (trusting API envelope shape)
 *   CWE-400  — Uncontrolled resource consumption (oversized responses)
 *   CWE-754  — Improper check for unusual conditions (malformed envelopes)
 *
 * @module youtubeSanitizer
 */

import { stripPoisonKeys, sanitizeVideoItem } from './apiSanitizer.js'

/** Maximum items[] length we'll process — YouTube batch limit is 50 */
const MAX_ITEMS = 50

/** Maximum raw JSON payload size (5 MB) — YouTube responses are typically <100 KB */
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024

/** Expected `kind` value for a YouTube video list response */
const EXPECTED_KIND = 'youtube#videoListResponse'

/** ETag format: YouTube uses quoted strings or W/ weak validators */
const ETAG_RE = /^(W\/)?"[^"]{1,256}"$/

/**
 * Validate raw response text size before JSON.parse.
 * Prevents DoS from megabyte-scale payloads that could stall the build.
 *
 * @param {string} rawText - Raw response body
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validatePayloadSize(rawText) {
  if (typeof rawText !== 'string') {
    return { ok: false, reason: 'Payload is not a string' }
  }
  const bytes = new TextEncoder().encode(rawText).byteLength
  if (bytes > MAX_PAYLOAD_BYTES) {
    return { ok: false, reason: `Payload ${bytes} bytes exceeds ${MAX_PAYLOAD_BYTES} limit` }
  }
  return { ok: true }
}

/**
 * Validate the YouTube API response envelope structure.
 * Checks `kind`, `etag`, `pageInfo`, and `items` shape without
 * inspecting individual item contents.
 *
 * @param {object} response - Parsed YouTube API response
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEnvelope(response) {
  const errors = []

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return { valid: false, errors: ['Response is not a plain object'] }
  }

  // kind — must be the expected video list response type
  if (response.kind !== EXPECTED_KIND) {
    errors.push(`Unexpected kind: "${response.kind}" (expected "${EXPECTED_KIND}")`)
  }

  // etag — if present, must match YouTube's quoted-string format
  if (response.etag !== undefined) {
    if (typeof response.etag !== 'string' || !ETAG_RE.test(response.etag)) {
      errors.push(`Malformed etag: "${String(response.etag).slice(0, 60)}"`)
    }
  }

  // items — must be an array within the count ceiling
  if (!Array.isArray(response.items)) {
    errors.push('Missing or non-array items field')
  } else if (response.items.length > MAX_ITEMS) {
    errors.push(`items[] length ${response.items.length} exceeds ceiling ${MAX_ITEMS}`)
  }

  // pageInfo — if present, totalResults must be sane
  if (response.pageInfo) {
    const total = response.pageInfo.totalResults
    const perPage = response.pageInfo.resultsPerPage
    if (typeof total === 'number' && (total < 0 || total > 10000)) {
      errors.push(`Suspicious totalResults: ${total}`)
    }
    if (typeof perPage === 'number' && (perPage < 0 || perPage > MAX_ITEMS)) {
      errors.push(`Suspicious resultsPerPage: ${perPage}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Full-pipeline sanitizer: validates the response envelope, strips poison
 * keys, then sanitizes each item. Returns only the clean items that survive.
 *
 * This is the single entry point the fetch script should call.
 *
 * @param {object} apiResponse - Raw parsed YouTube API response
 * @param {string[]} requestedIds - The video IDs we actually requested
 * @returns {{ items: object[], warnings: string[] }}
 */
export function sanitizeYouTubeResponse(apiResponse, requestedIds = []) {
  const warnings = []

  // Phase 1: Envelope validation
  const envelope = validateEnvelope(apiResponse)
  if (!envelope.valid) {
    warnings.push(...envelope.errors.map(e => `[envelope] ${e}`))
  }

  // If items is completely missing/invalid, bail with empty results
  if (!apiResponse || !Array.isArray(apiResponse.items)) {
    return { items: [], warnings }
  }

  // Phase 2: Enforce count ceiling (truncate, don't reject)
  let rawItems = apiResponse.items
  if (rawItems.length > MAX_ITEMS) {
    warnings.push(`[ceiling] Truncated ${rawItems.length} items to ${MAX_ITEMS}`)
    rawItems = rawItems.slice(0, MAX_ITEMS)
  }

  // Phase 3: Strip prototype pollution keys from the entire items array
  const decontaminated = stripPoisonKeys(rawItems)

  // Phase 4: Build a set of requested IDs for cross-referencing
  const requestedSet = new Set(requestedIds)

  // Phase 5: Per-item sanitization with unrequested-ID detection
  const cleanItems = []
  for (const item of decontaminated) {
    const itemId = item?.id
    if (requestedSet.size > 0 && itemId && !requestedSet.has(itemId)) {
      warnings.push(`[mismatch] Unexpected item ID "${itemId}" not in requested set`)
      continue
    }
    const sanitized = sanitizeVideoItem(item, itemId)
    if (sanitized) {
      cleanItems.push(sanitized)
    }
  }

  // Phase 6: Detect phantom items (requested but not returned — info only)
  if (requestedSet.size > 0) {
    const returnedIds = new Set(cleanItems.map(i => i.id))
    for (const id of requestedIds) {
      if (!returnedIds.has(id)) {
        warnings.push(`[missing] Requested ID "${id}" not in API response`)
      }
    }
  }

  return { items: cleanItems, warnings }
}

// Exported for testing
export { MAX_ITEMS, MAX_PAYLOAD_BYTES, EXPECTED_KIND, ETAG_RE }
