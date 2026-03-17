import { describe, it, expect } from 'vitest'
import {
  validatePayloadSize,
  validateEnvelope,
  sanitizeYouTubeResponse,
  MAX_ITEMS,
  MAX_PAYLOAD_BYTES,
  EXPECTED_KIND,
  ETAG_RE,
} from './youtubeSanitizer'

// -- Helpers --

function makeEnvelope(overrides = {}) {
  return {
    kind: EXPECTED_KIND,
    etag: '"abc123def456"',
    pageInfo: { totalResults: 3, resultsPerPage: 3 },
    items: [
      {
        id: 'dQw4w9WgXcQ',
        snippet: {
          channelTitle: 'TestChannel',
          publishedAt: '2024-01-01T00:00:00Z',
          thumbnails: { high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' } },
        },
        statistics: { viewCount: '1000' },
      },
    ],
    ...overrides,
  }
}

// -- validatePayloadSize --

describe('validatePayloadSize', () => {
  it('accepts normal-sized payloads', () => {
    const result = validatePayloadSize('{"items":[]}')
    expect(result.ok).toBe(true)
  })

  it('rejects payloads exceeding the byte limit', () => {
    const huge = 'x'.repeat(MAX_PAYLOAD_BYTES + 1)
    const result = validatePayloadSize(huge)
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('exceeds')
  })

  it('rejects non-string input', () => {
    expect(validatePayloadSize(null).ok).toBe(false)
    expect(validatePayloadSize(42).ok).toBe(false)
    expect(validatePayloadSize(undefined).ok).toBe(false)
  })

  it('handles exact-limit payload (boundary)', () => {
    // Exactly at the limit should pass
    const atLimit = 'a'.repeat(MAX_PAYLOAD_BYTES)
    expect(validatePayloadSize(atLimit).ok).toBe(true)
  })
})

// -- validateEnvelope --

describe('validateEnvelope', () => {
  it('accepts a well-formed YouTube response envelope', () => {
    const result = validateEnvelope(makeEnvelope())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects non-object responses', () => {
    expect(validateEnvelope(null).valid).toBe(false)
    expect(validateEnvelope('string').valid).toBe(false)
    expect(validateEnvelope([]).valid).toBe(false)
    expect(validateEnvelope(42).valid).toBe(false)
  })

  it('flags unexpected kind', () => {
    const result = validateEnvelope(makeEnvelope({ kind: 'youtube#channelListResponse' }))
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('Unexpected kind')
  })

  it('flags malformed etag', () => {
    const result = validateEnvelope(makeEnvelope({ etag: 'no-quotes-here' }))
    expect(result.errors.some(e => e.includes('etag'))).toBe(true)
  })

  it('accepts missing etag (optional field)', () => {
    const env = makeEnvelope()
    delete env.etag
    expect(validateEnvelope(env).valid).toBe(true)
  })

  it('flags missing items array', () => {
    const result = validateEnvelope(makeEnvelope({ items: 'not-an-array' }))
    expect(result.errors.some(e => e.includes('items'))).toBe(true)
  })

  it('flags items exceeding count ceiling', () => {
    const bloated = Array.from({ length: MAX_ITEMS + 1 }, (_, i) => ({ id: `id${i}` }))
    const result = validateEnvelope(makeEnvelope({ items: bloated }))
    expect(result.errors.some(e => e.includes('ceiling'))).toBe(true)
  })

  it('flags suspicious pageInfo.totalResults', () => {
    const result = validateEnvelope(makeEnvelope({
      pageInfo: { totalResults: -1, resultsPerPage: 5 },
    }))
    expect(result.errors.some(e => e.includes('totalResults'))).toBe(true)
  })

  it('flags impossible resultsPerPage', () => {
    const result = validateEnvelope(makeEnvelope({
      pageInfo: { totalResults: 5, resultsPerPage: 999 },
    }))
    expect(result.errors.some(e => e.includes('resultsPerPage'))).toBe(true)
  })
})

// -- ETAG_RE --

describe('ETAG_RE', () => {
  it('matches standard quoted etags', () => {
    expect(ETAG_RE.test('"abc123"')).toBe(true)
    expect(ETAG_RE.test('"kJA4PkMDPJQ/kgr9mGo3MBc"')).toBe(true)
  })

  it('matches weak etags', () => {
    expect(ETAG_RE.test('W/"abc123"')).toBe(true)
  })

  it('rejects unquoted or empty etags', () => {
    expect(ETAG_RE.test('abc123')).toBe(false)
    expect(ETAG_RE.test('')).toBe(false)
    expect(ETAG_RE.test('""')).toBe(false) // empty between quotes
  })
})

// -- sanitizeYouTubeResponse (full pipeline) --

describe('sanitizeYouTubeResponse', () => {
  const requestedIds = ['dQw4w9WgXcQ']

  it('returns sanitized items from a valid response', () => {
    const { items, warnings } = sanitizeYouTubeResponse(makeEnvelope(), requestedIds)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('dQw4w9WgXcQ')
    // Envelope is valid, no warnings except possible missing IDs
    const envelopeWarnings = warnings.filter(w => w.startsWith('[envelope]'))
    expect(envelopeWarnings).toHaveLength(0)
  })

  it('filters out items with unrequested IDs', () => {
    const env = makeEnvelope({
      items: [
        { id: 'dQw4w9WgXcQ', snippet: { channelTitle: 'Ok' }, statistics: { viewCount: '1' } },
        { id: 'INJECTED_ID!', snippet: { channelTitle: 'Injected' }, statistics: { viewCount: '999' } },
      ],
    })
    const { items, warnings } = sanitizeYouTubeResponse(env, ['dQw4w9WgXcQ'])
    expect(items).toHaveLength(1)
    expect(warnings.some(w => w.includes('[mismatch]'))).toBe(true)
  })

  it('truncates items exceeding the ceiling', () => {
    const manyItems = Array.from({ length: MAX_ITEMS + 10 }, (_, i) => ({
      id: `id_${String(i).padStart(8, '0')}`,
      snippet: { channelTitle: 'Ch' },
      statistics: { viewCount: '0' },
    }))
    const env = makeEnvelope({ items: manyItems })
    // Don't pass requestedIds — just test truncation
    const { items, warnings } = sanitizeYouTubeResponse(env, [])
    expect(items.length).toBeLessThanOrEqual(MAX_ITEMS)
    expect(warnings.some(w => w.includes('[ceiling]'))).toBe(true)
  })

  it('returns empty items for null/undefined response', () => {
    expect(sanitizeYouTubeResponse(null, []).items).toHaveLength(0)
    expect(sanitizeYouTubeResponse(undefined, []).items).toHaveLength(0)
  })

  it('reports missing requested IDs as warnings', () => {
    const env = makeEnvelope({ items: [] })
    const { warnings } = sanitizeYouTubeResponse(env, ['abc12345678'])
    expect(warnings.some(w => w.includes('[missing]') && w.includes('abc12345678'))).toBe(true)
  })

  it('strips prototype pollution keys from items before processing', () => {
    const env = makeEnvelope({
      items: [JSON.parse('{"id":"dQw4w9WgXcQ","__proto__":{"admin":true},"snippet":{"channelTitle":"Safe"},"statistics":{"viewCount":"5"}}')],
    })
    const { items } = sanitizeYouTubeResponse(env, ['dQw4w9WgXcQ'])
    expect(items).toHaveLength(1)
    expect(items[0]).not.toHaveProperty('__proto__')
    expect(items[0]).not.toHaveProperty('admin')
  })

  it('collects envelope warnings without rejecting valid items', () => {
    const env = makeEnvelope({ kind: 'youtube#wrong', etag: 'bad-etag' })
    const { items, warnings } = sanitizeYouTubeResponse(env, ['dQw4w9WgXcQ'])
    // Items should still be processed despite envelope issues
    expect(items).toHaveLength(1)
    expect(warnings.filter(w => w.startsWith('[envelope]')).length).toBeGreaterThan(0)
  })
})
