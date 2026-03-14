import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  isAllowedImageUrl,
  stripPoisonKeys,
  sanitizeVideoItem,
} from './apiSanitizer'

describe('sanitizeString', () => {
  it('strips HTML tags from API strings', () => {
    expect(sanitizeString('Drake <script>alert(1)</script>')).toBe('Drake alert(1)')
    expect(sanitizeString('Vevo <b>Official</b>')).toBe('Vevo Official')
  })

  it('strips control characters', () => {
    expect(sanitizeString('Clean\x00Channel\x0EName')).toBe('CleanChannelName')
  })

  it('truncates to maxLen', () => {
    expect(sanitizeString('a'.repeat(600), 500)).toHaveLength(500)
    expect(sanitizeString('short', 10)).toBe('short')
  })

  it('returns empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(42)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })
})

describe('isAllowedImageUrl', () => {
  it('accepts YouTube CDN origins', () => {
    expect(isAllowedImageUrl('https://img.youtube.com/vi/abc/maxresdefault.jpg')).toBe(true)
    expect(isAllowedImageUrl('https://i.ytimg.com/vi/abc/hqdefault.jpg')).toBe(true)
    expect(isAllowedImageUrl('https://yt3.ggpht.com/channel-photo')).toBe(true)
  })

  it('rejects non-YouTube origins', () => {
    expect(isAllowedImageUrl('https://evil.com/image.jpg')).toBe(false)
    expect(isAllowedImageUrl('https://cdn.example.com/thumb.jpg')).toBe(false)
  })

  it('rejects non-HTTPS protocols', () => {
    expect(isAllowedImageUrl('http://img.youtube.com/vi/abc/default.jpg')).toBe(false)
    expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedImageUrl('data:image/png;base64,abc')).toBe(false)
  })

  it('rejects invalid inputs', () => {
    expect(isAllowedImageUrl('')).toBe(false)
    expect(isAllowedImageUrl(null)).toBe(false)
    expect(isAllowedImageUrl('not-a-url')).toBe(false)
  })
})

describe('stripPoisonKeys', () => {
  it('removes __proto__ at any depth', () => {
    const input = { name: 'test', __proto__: { isAdmin: true }, nested: { __proto__: { evil: true } } }
    // Use Object.create(null) approach to test — __proto__ is special on regular objects
    const crafted = JSON.parse('{"name":"test","__proto__":{"isAdmin":true},"nested":{"__proto__":{"evil":true}}}')
    const result = stripPoisonKeys(crafted)
    expect(result).toEqual({ name: 'test', nested: {} })
  })

  it('removes constructor and prototype keys', () => {
    const input = JSON.parse('{"constructor":{"prototype":{"polluted":true}},"safe":"value"}')
    const result = stripPoisonKeys(input)
    expect(result).toEqual({ safe: 'value' })
  })

  it('handles arrays with poison keys in elements', () => {
    const input = JSON.parse('[{"__proto__":{"bad":true},"ok":"yes"},{"clean":1}]')
    const result = stripPoisonKeys(input)
    expect(result).toEqual([{ ok: 'yes' }, { clean: 1 }])
  })

  it('passes through primitives unchanged', () => {
    expect(stripPoisonKeys('hello')).toBe('hello')
    expect(stripPoisonKeys(42)).toBe(42)
    expect(stripPoisonKeys(null)).toBe(null)
    expect(stripPoisonKeys(true)).toBe(true)
  })
})

describe('sanitizeVideoItem', () => {
  const validItem = {
    id: 'dQw4w9WgXcQ',
    snippet: {
      channelTitle: 'RickAstleyVEVO',
      publishedAt: '2009-10-25T06:57:33Z',
      thumbnails: {
        high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
        maxres: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' },
      },
    },
    statistics: { viewCount: '1500000000' },
  }

  it('sanitizes a valid YouTube API item', () => {
    const result = sanitizeVideoItem(validItem, 'dQw4w9WgXcQ')
    expect(result.id).toBe('dQw4w9WgXcQ')
    expect(result.snippet.channelTitle).toBe('RickAstleyVEVO')
    expect(result.statistics.viewCount).toBe('1500000000')
    expect(result.snippet.thumbnails.high.url).toContain('ytimg.com')
  })

  it('rejects item with mismatched ID (MITM swap)', () => {
    const result = sanitizeVideoItem(validItem, 'DIFFERENT_ID')
    expect(result).toBeNull()
  })

  it('strips XSS from channelTitle', () => {
    const item = { ...validItem, snippet: { ...validItem.snippet, channelTitle: 'Evil<script>steal()</script>Channel' } }
    const result = sanitizeVideoItem(item, 'dQw4w9WgXcQ')
    expect(result.snippet.channelTitle).toBe('Evilsteal()Channel')
  })

  it('rejects thumbnail URLs from untrusted origins', () => {
    const item = {
      ...validItem,
      snippet: {
        ...validItem.snippet,
        thumbnails: {
          high: { url: 'https://evil.com/tracking-pixel.jpg' },
          maxres: { url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' },
        },
      },
    }
    const result = sanitizeVideoItem(item, 'dQw4w9WgXcQ')
    expect(result.snippet.thumbnails.high).toBeUndefined()
    expect(result.snippet.thumbnails.maxres.url).toContain('img.youtube.com')
  })

  it('clamps negative view counts to zero', () => {
    const item = { ...validItem, statistics: { viewCount: '-999' } }
    const result = sanitizeVideoItem(item, 'dQw4w9WgXcQ')
    expect(result.statistics.viewCount).toBe('0')
  })

  it('returns null for non-object input', () => {
    expect(sanitizeVideoItem(null, 'abc')).toBeNull()
    expect(sanitizeVideoItem('string', 'abc')).toBeNull()
  })

  it('handles missing snippet/statistics gracefully', () => {
    const result = sanitizeVideoItem({ id: 'abc12345678' }, 'abc12345678')
    expect(result.snippet.channelTitle).toBe('')
    expect(result.statistics.viewCount).toBe('0')
  })
})
