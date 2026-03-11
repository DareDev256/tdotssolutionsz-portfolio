import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleViolation, assertRuntimeIntegrity, handleMessage, auditIframes, TRUSTED_MSG_ORIGINS, ALLOWED_IFRAME_ORIGINS, MAX_VIOLATIONS, DEDUP_WINDOW_MS, MAX_MSG_VIOLATIONS, initSecurityMonitor } from './cspMonitor'

// ── CSP Violation Handler ───────────────────────────────────────────

describe('CSP violation handler', () => {
  let warnSpy
  let monitor

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Ensure clean state — destroy any previous monitor to reset dedup + count
    monitor = initSecurityMonitor()
    monitor.destroy()
    monitor = initSecurityMonitor()
  })

  afterEach(() => {
    monitor?.destroy()
    warnSpy.mockRestore()
  })

  /** Create a minimal CSP violation event with unique URI to avoid dedup */
  function fakeViolation(directive = 'script-src', blockedURI) {
    const uri = blockedURI ?? `https://evil.com/inject-${Date.now()}-${Math.random()}.js`
    return {
      violatedDirective: directive,
      blockedURI: uri,
      sourceFile: 'https://tdotssolutionsz.com/assets/index.js',
      lineNumber: 42,
      columnNumber: 10,
      originalPolicy: "default-src 'self'; script-src 'self' blob:",
    }
  }

  it('logs structured violation info to console.warn', () => {
    handleViolation(fakeViolation())
    const cspCalls = warnSpy.mock.calls.filter(c => c[0] === '[CSP Violation]')
    expect(cspCalls.length).toBeGreaterThanOrEqual(1)
    expect(cspCalls[cspCalls.length - 1][1].directive).toBe('script-src')
  })

  it('includes source file location in log', () => {
    handleViolation(fakeViolation('style-src'))
    const cspCalls = warnSpy.mock.calls.filter(c => c[0] === '[CSP Violation]')
    expect(cspCalls[cspCalls.length - 1][1].source).toContain('index.js:42:10')
  })

  it('shows (inline) for violations with no blocked URI', () => {
    handleViolation(fakeViolation('script-src', ''))
    const cspCalls = warnSpy.mock.calls.filter(c => c[0] === '[CSP Violation]')
    expect(cspCalls[cspCalls.length - 1][1].blocked).toBe('(inline)')
  })

  it('shows (unknown) for violations with no source file', () => {
    const event = {
      ...fakeViolation('img-src'),
      sourceFile: '',
      lineNumber: 0,
      columnNumber: 0,
    }
    handleViolation(event)
    const cspCalls = warnSpy.mock.calls.filter(c => c[0] === '[CSP Violation]')
    expect(cspCalls[cspCalls.length - 1][1].source).toBe('(unknown)')
  })

  it('truncates long CSP policy strings for readability', () => {
    const longPolicy = 'x'.repeat(200)
    handleViolation({ ...fakeViolation(), originalPolicy: longPolicy })
    const cspCalls = warnSpy.mock.calls.filter(c => c[0] === '[CSP Violation]')
    expect(cspCalls[cspCalls.length - 1][1].policy.length).toBeLessThanOrEqual(120)
  })
})

// ── Configuration Constants ─────────────────────────────────────────

describe('CSP monitor configuration', () => {
  it('rate limits at a reasonable threshold', () => {
    expect(MAX_VIOLATIONS).toBeGreaterThanOrEqual(10)
    expect(MAX_VIOLATIONS).toBeLessThanOrEqual(100)
  })

  it('dedup window prevents console flooding', () => {
    expect(DEDUP_WINDOW_MS).toBeGreaterThanOrEqual(1000)
    expect(DEDUP_WINDOW_MS).toBeLessThanOrEqual(30000)
  })
})

// ── Runtime Integrity Assertions ────────────────────────────────────
// assertRuntimeIntegrity() guards with typeof document/window checks,
// so it safely no-ops in Node test environment (no jsdom needed).

describe('runtime integrity assertions', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('runs without throwing in Node (no-DOM) environment', () => {
    expect(() => assertRuntimeIntegrity()).not.toThrow()
  })

  it('does not log security warnings in non-browser environment', () => {
    assertRuntimeIntegrity()
    const securityWarnings = warnSpy.mock.calls.filter(c =>
      typeof c[0] === 'string' && c[0].startsWith('[Security]')
    )
    expect(securityWarnings).toHaveLength(0)
  })
})

// ── Security Monitor Lifecycle ──────────────────────────────────────

describe('initSecurityMonitor lifecycle', () => {
  it('returns an API with violationCount and destroy', () => {
    const monitor = initSecurityMonitor()
    expect(typeof monitor.violationCount).toBe('function')
    expect(typeof monitor.destroy).toBe('function')
    monitor.destroy()
  })

  it('destroy resets state for clean re-initialization', () => {
    const m1 = initSecurityMonitor()
    m1.destroy()

    const m2 = initSecurityMonitor()
    expect(m2.violationCount()).toBe(0)
    m2.destroy()
  })

  it('idempotent — calling initSecurityMonitor twice returns same API shape', () => {
    const m1 = initSecurityMonitor()
    const m2 = initSecurityMonitor()
    expect(typeof m2.violationCount).toBe('function')
    expect(typeof m2.destroy).toBe('function')
    m1.destroy()
  })

  it('exposes auditIframes on the returned API', () => {
    const monitor = initSecurityMonitor()
    expect(typeof monitor.auditIframes).toBe('function')
    monitor.destroy()
  })
})

// ── postMessage Origin Monitor ──────────────────────────────────────

describe('postMessage origin monitor', () => {
  let warnSpy
  let monitor

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    monitor = initSecurityMonitor()
    monitor.destroy()
    monitor = initSecurityMonitor()
  })

  afterEach(() => {
    monitor?.destroy()
    warnSpy.mockRestore()
  })

  it('ignores same-origin messages', () => {
    // In Node test env, selfOrigin resolves to '' — use that for same-origin simulation
    handleMessage({ origin: '', data: 'test' })
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls).toHaveLength(0)
  })

  it('ignores empty-origin messages', () => {
    handleMessage({ origin: '', data: 'test' })
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls).toHaveLength(0)
  })

  it('ignores trusted YouTube origins', () => {
    for (const origin of TRUSTED_MSG_ORIGINS) {
      handleMessage({ origin, data: {} })
    }
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls).toHaveLength(0)
  })

  it('warns on unknown origin', () => {
    handleMessage({ origin: 'https://evil.com', data: 'payload' })
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls).toHaveLength(1)
    expect(secCalls[0][1].origin).toBe('https://evil.com')
  })

  it('logs data type but never the actual data', () => {
    handleMessage({ origin: 'https://attacker.io', data: { secret: 'stolen' } })
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls[0][1].dataType).toBe('object')
    expect(secCalls[0][1]).not.toHaveProperty('data')
  })

  it('rate-limits after MAX_MSG_VIOLATIONS', () => {
    for (let i = 0; i < MAX_MSG_VIOLATIONS + 5; i++) {
      handleMessage({ origin: `https://evil-${i}.com`, data: '' })
    }
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls).toHaveLength(MAX_MSG_VIOLATIONS)
  })

  it('destroy resets message violation count', () => {
    handleMessage({ origin: 'https://rogue.com', data: '' })
    monitor.destroy()
    monitor = initSecurityMonitor()
    // Should be able to log again after reset
    handleMessage({ origin: 'https://rogue2.com', data: '' })
    const secCalls = warnSpy.mock.calls.filter(c => c[0]?.includes?.('postMessage'))
    expect(secCalls.length).toBeGreaterThanOrEqual(2)
  })
})

// ── Iframe Origin Audit ─────────────────────────────────────────────

describe('iframe origin audit', () => {
  it('returns empty array in non-browser environment', () => {
    expect(auditIframes()).toEqual([])
  })

  it('trusts YouTube and Google iframe origins', () => {
    expect(ALLOWED_IFRAME_ORIGINS.has('https://www.youtube.com')).toBe(true)
    expect(ALLOWED_IFRAME_ORIGINS.has('https://www.youtube-nocookie.com')).toBe(true)
    expect(ALLOWED_IFRAME_ORIGINS.has('https://www.google.com')).toBe(true)
  })

  it('does not trust arbitrary origins', () => {
    expect(ALLOWED_IFRAME_ORIGINS.has('https://evil.com')).toBe(false)
    expect(ALLOWED_IFRAME_ORIGINS.has('http://www.youtube.com')).toBe(false)
  })

  it('configuration constants are reasonable', () => {
    expect(MAX_MSG_VIOLATIONS).toBeGreaterThanOrEqual(5)
    expect(MAX_MSG_VIOLATIONS).toBeLessThanOrEqual(50)
  })
})
