import { describe, it, expect } from 'vitest'
import {
  POISON_KEYS,
  CONTROL_CHAR_ASCII_RE,
  CONTROL_CHAR_UNICODE_RE,
  HTML_TAG_RE,
} from './securityConstants'

/**
 * Verifies the shared security constants module — the single source of truth
 * for defense-in-depth primitives. Tests ensure:
 *   1. POISON_KEYS covers all prototype pollution vectors
 *   2. Control char regexes strip the correct scope (ASCII vs Unicode)
 *   3. HTML_TAG_RE catches common injection patterns
 *   4. Regex scopes don't accidentally overlap or leave gaps
 */

describe('POISON_KEYS', () => {
  it('blocks the three prototype pollution vectors', () => {
    expect(POISON_KEYS.has('__proto__')).toBe(true)
    expect(POISON_KEYS.has('constructor')).toBe(true)
    expect(POISON_KEYS.has('prototype')).toBe(true)
  })

  it('contains exactly 3 entries — no accidental additions', () => {
    expect(POISON_KEYS.size).toBe(3)
  })

  it('does not block legitimate keys', () => {
    expect(POISON_KEYS.has('id')).toBe(false)
    expect(POISON_KEYS.has('name')).toBe(false)
    expect(POISON_KEYS.has('toString')).toBe(false)
  })
})

describe('CONTROL_CHAR_ASCII_RE (API data scope)', () => {
  it('strips null bytes and C0 control chars', () => {
    expect('Clean\x00Data'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('CleanData')
    expect('Bell\x07Char'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('BellChar')
  })

  it('strips C1 control chars (0x7F–0x9F)', () => {
    expect('Delete\x7FChar'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('DeleteChar')
    expect('High\x8FControl'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('HighControl')
  })

  it('preserves tabs, newlines, and carriage returns', () => {
    expect('Tab\there'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('Tab\there')
    expect('Line\nFeed'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('Line\nFeed')
    expect('CR\rReturn'.replace(CONTROL_CHAR_ASCII_RE, '')).toBe('CR\rReturn')
  })

  it('does NOT strip zero-width Unicode (ASCII scope only)', () => {
    const zwsp = 'zero\u200Bwidth'
    expect(zwsp.replace(CONTROL_CHAR_ASCII_RE, '')).toBe(zwsp) // unchanged
  })

  it('preserves printable ASCII and emoji', () => {
    const safe = 'Drake ft. Future — Views 🔥 (2016)'
    expect(safe.replace(CONTROL_CHAR_ASCII_RE, '')).toBe(safe)
  })
})

describe('CONTROL_CHAR_UNICODE_RE (user input scope)', () => {
  it('strips everything the ASCII regex strips', () => {
    expect('Null\x00Byte'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('NullByte')
    expect('Delete\x7FChar'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('DeleteChar')
  })

  it('additionally strips zero-width spaces and joiners', () => {
    expect('zero\u200Bwidth'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('zerowidth')
    expect('dir\u200Fmark'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('dirmark')
  })

  it('strips line/paragraph separators', () => {
    expect('line\u2028sep'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('linesep')
    expect('para\u2029sep'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('parasep')
  })

  it('strips BOM character', () => {
    expect('\uFEFFDrake'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('Drake')
  })

  it('strips specials block (U+FFF0–U+FFFF)', () => {
    expect('bad\uFFF0char'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('badchar')
    expect('obj\uFFFCreplace'.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe('objreplace')
  })

  it('preserves normal Unicode text and emoji', () => {
    const safe = 'Café résumé naïve 日本語 🎵🔥'
    expect(safe.replace(CONTROL_CHAR_UNICODE_RE, '')).toBe(safe)
  })
})

describe('HTML_TAG_RE', () => {
  it('strips script tags', () => {
    expect('<script>alert(1)</script>'.replace(HTML_TAG_RE, '')).toBe('alert(1)')
  })

  it('strips common HTML elements', () => {
    expect('Hello <b>bold</b> world'.replace(HTML_TAG_RE, '')).toBe('Hello bold world')
    expect('<img src="x" onerror="evil()">'.replace(HTML_TAG_RE, '')).toBe('')
  })

  it('handles case-insensitive tags', () => {
    expect('<SCRIPT>xss</SCRIPT>'.replace(HTML_TAG_RE, '')).toBe('xss')
    expect('<Div class="x">text</DIV>'.replace(HTML_TAG_RE, '')).toBe('text')
  })

  it('preserves non-HTML angle brackets', () => {
    expect('5 < 10 and 10 > 5'.replace(HTML_TAG_RE, '')).toBe('5 < 10 and 10 > 5')
    expect('math: 3<4'.replace(HTML_TAG_RE, '')).toBe('math: 3<4')
  })
})
