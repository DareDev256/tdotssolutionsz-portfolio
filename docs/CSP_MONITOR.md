# CSP Monitor — Runtime Security Observability

```
 ╔═══════════════════════════════════════════════╗
 ║  src/utils/cspMonitor.js                      ║
 ║  The immune system of the portfolio           ║
 ╚═══════════════════════════════════════════════╝
```

CSP headers block attacks **silently**. Without runtime observability, you're flying blind — blocked injections, supply-chain changes in third-party deps, and header misconfigurations all vanish into the void. This module makes them visible.

---

## Architecture

`cspMonitor.js` runs five defense subsystems from a single `initSecurityMonitor()` entry point:

```
┌─────────────────────────────────────────────────────────┐
│                   initSecurityMonitor()                  │
│  Called once at app boot (main.jsx)                      │
├──────────────┬──────────────┬───────────────────────────┤
│ ① CSP        │ ② postMessage│ ③ Boot-Time Integrity     │
│ Violation    │ Origin       │ Assertions                │
│ Listener     │ Monitor      │                           │
│              │              │ • document.domain check   │
│ dedup map    │ trusted set  │ • iframe injection scan   │
│ rate limiter │ rate limiter │ • window.opener guard     │
├──────────────┴──────────────┴───────────────────────────┤
│ ④ Runtime Iframe Audit     │ ⑤ Destroy / Cleanup       │
│ auditIframes() — on-demand │ Removes all listeners,    │
│ origin validation           │ resets counters, clears   │
│                             │ dedup map (for tests)     │
└─────────────────────────────┴───────────────────────────┘
```

### Why five subsystems?

Each covers a different attack surface that the others can't:

| Subsystem | What It Catches | When It Runs |
|-----------|----------------|--------------|
| **CSP Violation Listener** | Blocked script injection, unauthorized resource loads, inline eval attempts | Continuously — fires on every `securitypolicyviolation` event |
| **postMessage Origin Monitor** | Rogue browser extensions, injected iframes, XSS payloads sending messages to the app window | Continuously — fires on every `message` event |
| **Boot-Time Integrity** | `document.domain` relaxation (same-origin bypass), pre-mount iframe injection (clickjacking), `window.opener` tabnapping | Once at boot — before React mounts |
| **Runtime Iframe Audit** | Iframes injected **after** React mounts YouTube players — extensions, XSS, clickjacking overlays | On-demand — call `auditIframes()` anytime |
| **Destroy** | Test isolation — prevents cross-test pollution from persistent event listeners | Called by test teardown |

---

## Integration

```jsx
// main.jsx — the only place this should be initialized
import { initSecurityMonitor } from './utils/cspMonitor'

const monitor = initSecurityMonitor()
// monitor.violationCount()  → current CSP violation count
// monitor.auditIframes()    → returns string[] of suspicious iframe src values
// monitor.destroy()         → cleanup (tests only)
```

**Idempotent** — calling `initSecurityMonitor()` multiple times is safe. Only the first call attaches listeners. Subsequent calls return a no-op handle.

---

## Subsystem Details

### ① CSP Violation Listener

Captures `securitypolicyviolation` events from the browser and logs structured info:

```
[CSP Violation] {
  directive: "script-src",
  blocked: "https://evil.example.com/inject.js",
  source: "https://cdn.example.com/widget.js:42:13",
  policy: "default-src 'self'; script-src 'self' https://www.youtube.com..."
}
```

**Deduplication**: Violations keyed by `${violatedDirective}|${blockedURI}`. Same key suppressed for 5 seconds (`DEDUP_WINDOW_MS`). Prevents console flooding when a blocked resource retries in a loop (common with rogue ad scripts).

**Rate limiting**: Hard cap at 25 violations per session (`MAX_VIOLATIONS`). After hitting the cap, logs a final suppression notice and stops.

### ② postMessage Origin Monitor

YouTube's IFrame API communicates via `postMessage`. So do browser extensions, rogue iframes, and XSS payloads. This monitor separates signal from noise:

| Origin | Action |
|--------|--------|
| Same-origin (`window.location.origin`) | Pass silently — React devtools, HMR, internal |
| `https://www.youtube.com` | Pass — legitimate API traffic |
| `https://www.youtube-nocookie.com` | Pass — privacy-enhanced embed |
| `https://www.google.com` | Pass — YouTube API infrastructure |
| Everything else | Log origin + data type (never the data itself — credential leak prevention) |

Rate-limited to 10 warnings per session (`MAX_MSG_VIOLATIONS`).

### ③ Boot-Time Integrity Assertions

Three checks that run once before React mounts:

1. **`document.domain` relaxation** — Detects if a script has relaxed the same-origin policy by setting `document.domain` to a parent domain. Deprecated in modern browsers but still exploitable in some.

2. **Iframe injection scan** — Our app creates zero iframes at boot. YouTube iframes are added later by React. Any iframe present at boot is suspicious (browser extension, XSS, clickjacking overlay).

3. **`window.opener` guard** — If the page was opened via `window.open()` without `noopener`, the opener can navigate this tab to a phishing page (reverse tabnapping).

All three are environment-safe — they skip gracefully in Node.js (tests, SSR).

### ④ Runtime Iframe Audit

```js
import { auditIframes } from './utils/cspMonitor'

const suspicious = auditIframes()
// Returns: string[] of iframe src values with unauthorized origins
// Empty array = all clear
```

Validates every `<iframe>` in the DOM against the allowed origin set:
- `https://www.youtube.com`
- `https://www.youtube-nocookie.com`
- `https://www.google.com`

Iframes with no `src`, unparseable URLs, or unauthorized origins are flagged.

---

## Relationship to Other Security Modules

```
vercel.json (CSP headers)      ← Static defense — blocks at the HTTP level
        │
        ▼
cspMonitor.js (this file)      ← Runtime observability — sees what headers blocked
        │
        ├── urlSafety.js        ← Client-side guards (scheme blocking, replaceState pinning)
        ├── apiSanitizer.js     ← Build-time defense (XSS stripping, prototype pollution)
        └── videoPlayback.test  ← Regression guard (21 tests protecting embed config)
```

**cspMonitor** doesn't *prevent* attacks — that's the job of CSP headers and the other security modules. It provides **visibility** into what's being blocked, so misconfigurations and novel attack patterns surface instead of failing silently.

---

## ⚠️ What Not to Change

These constraints come from hard-won production incidents:

1. **Don't add Trusted Types CSP** — `require-trusted-types-for 'script'` blocks YouTube IFrame API (`document.head.appendChild(script)`) and Three.js (`innerHTML`). Broke video playback in v3.18.2.

2. **Don't remove `cdn.jsdelivr.net` from CSP `connect-src`** — Troika (drei's `<Text>`) fetches fonts from jsdelivr inside Web Workers. Worker `fetch()` is governed by `connect-src`. Broke 3D text labels twice.

3. **Don't log `event.data` in the postMessage handler** — Could contain credentials, session tokens, or massive blobs. Only log origin and data type.

4. **Don't increase `MAX_VIOLATIONS` beyond 50** — Console flooding degrades DevTools performance, which makes debugging the actual problem harder.

---

## Testing

```bash
npx vitest run src/utils/cspMonitor.test.js
```

The test suite covers:
- CSP violation dedup (same key within window suppressed)
- Rate limit enforcement (violations past MAX_VIOLATIONS ignored)
- postMessage origin filtering (trusted origins pass, unknown logged)
- Boot-time integrity assertions (document.domain, iframes, opener)
- `destroy()` cleanup (counter reset, listener removal)
- Environment safety (no crash in Node.js / non-browser)

**Always run after touching `vercel.json` security headers or CSP config.**

---

## Exports

| Export | Type | Public API? | Purpose |
|--------|------|-------------|---------|
| `initSecurityMonitor()` | function | ✅ Yes | Boot the entire monitoring stack |
| `auditIframes()` | function | ✅ Yes | On-demand iframe origin validation |
| `handleViolation` | function | 🧪 Test only | CSP violation handler (testing internals) |
| `assertRuntimeIntegrity` | function | 🧪 Test only | Boot-time checks (testing internals) |
| `handleMessage` | function | 🧪 Test only | postMessage handler (testing internals) |
| `TRUSTED_MSG_ORIGINS` | Set | 🧪 Test only | YouTube/Google origin allowlist |
| `ALLOWED_IFRAME_ORIGINS` | Set | 🧪 Test only | Iframe src origin allowlist |
| `MAX_VIOLATIONS` | number | 🧪 Test only | CSP rate limit cap (25) |
| `DEDUP_WINDOW_MS` | number | 🧪 Test only | Dedup cooldown (5000ms) |
| `MAX_MSG_VIOLATIONS` | number | 🧪 Test only | postMessage rate limit cap (10) |

---

<sub>Part of the TdotsSolutionsz security stack · See also: <a href="../src/utils/urlSafety.js">urlSafety.js</a> · <a href="../src/utils/apiSanitizer.js">apiSanitizer.js</a> · <a href="ARCHITECTURE.md">ARCHITECTURE.md</a></sub>
