/**
 * CSP Violation Monitor — runtime observability for Content Security Policy.
 *
 * CSP headers block attacks silently. This module captures `securitypolicyviolation`
 * events so blocked injection attempts, supply-chain changes in third-party deps,
 * and header misconfigurations surface in the console instead of vanishing.
 *
 * Rate-limited to prevent console flooding from repeated violation events
 * (e.g., a rogue ad script retrying blocked resource loads in a loop).
 *
 * @module cspMonitor
 */

/** Max violations logged per window to prevent console flooding */
const MAX_VIOLATIONS = 25

/** Cooldown between identical violations (same directive + blocked URI) */
const DEDUP_WINDOW_MS = 5000

/** @type {Map<string, number>} tracks last-seen timestamp per violation key */
const seen = new Map()

/** Total violation count this session */
let violationCount = 0

/**
 * Generate a dedup key from a CSP violation event.
 * Combines the violated directive with the blocked URI to collapse
 * repeated attempts from the same source.
 */
function violationKey(event) {
  return `${event.violatedDirective || 'unknown'}|${event.blockedURI || 'none'}`
}

/**
 * Handle a single CSP violation event.
 * Deduplicates, rate-limits, and logs structured info to console.
 *
 * @param {SecurityPolicyViolationEvent} event
 */
function handleViolation(event) {
  if (violationCount >= MAX_VIOLATIONS) return

  const key = violationKey(event)
  const now = Date.now()
  const lastSeen = seen.get(key)

  // Skip if we saw this exact violation recently
  if (lastSeen && (now - lastSeen) < DEDUP_WINDOW_MS) return
  seen.set(key, now)
  violationCount++

  // Structured log — easy to search in browser devtools or log aggregators
  console.warn('[CSP Violation]', {
    directive: event.violatedDirective,
    blocked: event.blockedURI || '(inline)',
    source: event.sourceFile ? `${event.sourceFile}:${event.lineNumber}:${event.columnNumber}` : '(unknown)',
    policy: event.originalPolicy?.slice(0, 120), // truncate for readability
  })

  if (violationCount === MAX_VIOLATIONS) {
    console.warn('[CSP Monitor] Rate limit reached — suppressing further violation logs this session')
  }
}

/**
 * Boot-time security assertions — validate runtime invariants that
 * static CSP headers can't enforce. Runs once on app initialization.
 *
 * Checks:
 * 1. document.domain hasn't been relaxed (same-origin policy bypass)
 * 2. No unexpected iframes injected (clickjacking / overlay attacks)
 * 3. window.opener is null (reverse tabnapping defense)
 */
function assertRuntimeIntegrity() {
  // Guard: skip in non-browser environments (Node tests, SSR)
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  // document.domain relaxation allows cross-subdomain DOM access.
  // Deprecated in modern browsers but still functional in some.
  // Our app never sets it — if it's changed, something tampered.
  try {
    const original = document.domain
    // In modern browsers, setting document.domain throws.
    // In older browsers, we verify it wasn't already relaxed to a parent domain.
    if (original && !original.includes('.') && original !== 'localhost') {
      console.warn('[Security] document.domain appears relaxed:', original)
    }
  } catch {
    // Expected in modern browsers — getter may throw after deprecation
  }

  // Check for injected iframes (browser extensions, XSS, clickjacking overlays).
  // Our app creates zero iframes at boot — YouTube iframes are added later by React.
  // Any iframe present at boot time is suspicious.
  const bootIframes = document.querySelectorAll('iframe')
  if (bootIframes.length > 0) {
    console.warn('[Security] Unexpected iframes at boot:', bootIframes.length,
      [...bootIframes].map(f => f.src || '(no src)'))
  }

  // window.opener should always be null. If our page was opened via window.open()
  // without noopener, the opener page can navigate us to a phishing page.
  if (window.opener !== null) {
    console.warn('[Security] window.opener is not null — potential tabnapping vector')
  }
}

/**
 * Initialize CSP violation monitoring and run boot-time security checks.
 * Safe to call multiple times — only attaches listener once.
 *
 * @returns {{ violationCount: () => number, destroy: () => void }}
 */
let initialized = false

export function initSecurityMonitor() {
  if (initialized) return { violationCount: () => violationCount, destroy: () => {} }
  initialized = true

  // Guard: only attach DOM listener in browser environments
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', handleViolation)
  }
  assertRuntimeIntegrity()

  return {
    /** Current violation count (for testing/diagnostics) */
    violationCount: () => violationCount,
    /** Remove listener (useful for tests) */
    destroy: () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('securitypolicyviolation', handleViolation)
      }
      initialized = false
      violationCount = 0
      seen.clear()
    },
  }
}

// Exported for testing only — not part of public API
export { handleViolation, assertRuntimeIntegrity, MAX_VIOLATIONS, DEDUP_WINDOW_MS }
