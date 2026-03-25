# Changelog

All notable changes to TdotsSolutionsz Music Video Portfolio.

## [3.38.2] - 2026-03-25

### Added
- **Deep test coverage for search scoring formula** — 15 new tests across 4 new describe blocks verifying prefix scoring (0.90 + coverage × 0.10), mid-string scoring (0.80 + coverage × 0.10), score tier boundaries (mid-string ceiling < prefix floor), and edge cases (null/undefined/empty inputs, no-match returns 0). Catches formula regressions that would silently break search ranking
- **`sanitizeSearchInput` direct test suite** — 6 tests covering C0 control character stripping, zero-width Unicode bypass prevention, truncation to MAX_QUERY_LENGTH, strip-then-truncate ordering (prevents bypass via control char padding), and null/non-string input handling. Previously only tested indirectly through `searchAll`
- Test suite now at **647 tests across 46 suites** (up from 632)

## [3.38.1] - 2026-03-24

### Fixed
- **Search ranking: prefix matches now outrank mid-string matches** — `fuzzyScore` previously returned a flat `1.0` for all substring matches, making "Drake" in `"Drake - God's Plan"` rank identically to "Drake" in `"feat. Drake"`. Now uses position-aware scoring: exact match = 1.0, prefix = 0.90–1.0, mid-string = 0.80–0.90 (scaled by coverage). Resolves search result ordering bugs where irrelevant mid-string hits tied with exact prefix matches. 13 tests updated/added, all 632 passing

## [3.38.0] - 2026-03-24

### Added
- **Latest Drops — Netflix-style "New Releases" row on HubPage** — Horizontally scrollable card rail showcasing the 8 most recent videos. Features drag-to-scroll with pointer capture (mouse + touch + pen), staggered scroll-reveal entrance animations, "NEW" badge with pulsing neon glow on videos from the last 6 months, cinematic hover effects (lift + scale + green accent border glow), play icon overlay, and responsive card sizing. Positioned between navigation cards and FilmStrip for maximum discovery impact. Fills the content discovery gap: TopHits = popular, FilmStrip = top viewed, EraTimeline = historical, **LatestDrops = recent**. Fully accessible with ARIA labels, `role="list"`, and `prefers-reduced-motion` support. Uses existing `latestFirst()`, `formatViews()`, `formatDate()`, and `getThumbnailUrl()` utilities — zero new dependencies

## [3.37.6] - 2026-03-24

### Changed
- **Extracted video filtering/sorting into `videoFilters.js`** — Five components (TopHits, VideoSpotlight, FilmStrip, EraTimeline, ArtistShowcase) and MobileApp each reimplemented `[...VIDEOS].sort((a, b) => b.viewCount - a.viewCount).slice(0, N)`. Centralized into `topByViews()`, `latestFirst()`, `byArtist()`, `byYearRange()`, and `topVideoForArtist()` utilities. Ranking strategy changes now propagate from one file instead of six
- **15 new tests** for videoFilters — covers sorting correctness, limit behavior, immutability guarantees, empty inputs, and composed filters. Test suite now at **631 tests across 46 suites**

## [3.37.5] - 2026-03-23

### Security
- **Full OWASP Top 10 audit — clean bill** — Comprehensive security review covering hardcoded secrets, dependency vulnerabilities, input validation, XSS vectors, injection attacks, access control, and security misconfiguration. Zero findings across all categories
- **Secret scanner false positive fixed** — `scan-secrets.js` Bearer token pattern triggered on README.md documentation prose ("catches Bearer tokens"). Added two surgical skip rules: backtick-wrapped code references and documentation prose describing scanner capabilities. Real Bearer token leaks (e.g. `Authorization: Bearer eyJ...`) still caught — verified with regression test. Scanner now returns clean on full codebase scan

### Audit Summary
- **npm audit**: 0 vulnerabilities across 226 dependencies (91 prod, 136 dev)
- **Secret scan**: Clean (30 patterns, 0 findings after false positive fix)
- **CSP headers**: Complete — no `unsafe-eval`, strict allowlists, `frame-ancestors 'none'`
- **Security headers**: 11 headers verified (HSTS preload, COOP, CORP, Permissions-Policy blocking 18 APIs)
- **Input validation**: All URL params (`?v=`, `?artist=`) validated via regex/allowlist before use
- **XSS prevention**: No `dangerouslySetInnerHTML`, API strings sanitized (HTML tag + control char stripping)
- **Prototype pollution**: `safeJsonParse` reviver on all localStorage reads, `stripPoisonKeys` on API data
- **Open redirect**: `safeReplaceState` blocks absolute URLs + dangerous schemes; `openShareWindow` enforces host allowlist + HTTPS
- **Reverse tabnapping**: All `target="_blank"` links use `rel="noopener noreferrer"`; `window.open` hardcodes the same
- **Runtime monitoring**: CSP violation listener, postMessage origin guard, iframe origin audit, boot-time integrity checks
- **Test suite**: 616 tests across 45 suites — all passing

## [3.37.4] - 2026-03-23

### Fixed
- **searchScoring test clarity** — Removed misleading comments that described `"abc"` in `"abcXXX"` as a "subsequence" match when it's actually a substring match (hits the `includes()` fast path → returns 1.0, never reaches the subsequence scorer). Added explicit test verifying the substring-vs-subsequence boundary: `fuzzyScore('abc', 'abcXXX') === 1.0` vs `fuzzyScore('abc', 'aXbXcX') < 1.0`. Cleaned up the consecutive-runs test to clearly document why it uses `"abd"` instead of `"abc"`. Test suite now at **616 tests across 45 suites**

## [3.37.3] - 2026-03-22

### Fixed
- **TopHits title extraction** — Song titles for featured-artist (`ft.`), multi-artist comma-separated, and X-collab formats now correctly extract only the song name instead of showing the full title with redundant artist text. Previous logic used `title.replace(\`${artist} - \`, '')` which silently failed when the title prefix didn't match the artist field exactly (e.g. `"Hypa, Sloc, M, Fresh - Deeper Than The Ocean"` with artist `"Hypa"`). Now splits on the first ` - ` delimiter — the universal YouTube title format — which works for all artist/collab patterns
- 4 new tests guarding title extraction: no artist duplication across real data, plus explicit cases for `ft.`, comma-collab, and X-collab formats

## [3.37.1] - 2026-03-21

### Changed
- **Shared security constants** (`securityConstants.js`) — Extracted duplicated security primitives (`POISON_KEYS`, control character regexes, `HTML_TAG_RE`) into a single source-of-truth module. Previously, `POISON_KEYS` was identically defined in both `apiSanitizer.js` and `urlSafety.js`, and two different-scope control character regexes existed without documentation explaining why they differed
  - `CONTROL_CHAR_ASCII_RE` — C0/C1 range for API response data (YouTube Data API v3)
  - `CONTROL_CHAR_UNICODE_RE` — Extended range including zero-width Unicode for user-typed input (search queries)
  - `apiSanitizer.js`, `urlSafety.js`, and `searchScoring.js` now import from the shared module instead of defining local copies
- 18 new tests for the shared constants module covering POISON_KEYS completeness, both regex scopes (ASCII vs Unicode), HTML tag stripping, and edge cases (emoji preservation, BOM, specials block). Test suite now at **611 tests across 45 suites**

## [3.37.0] - 2026-03-21

### Added
- **Cinematic Atmosphere** (`CinematicAtmosphere.jsx`) — Scroll-reactive ambient mood lighting system for HubPage inspired by the "Culture Chronicle" creative concept. Three fixed layers create an immersive, chapter-based narrative feel as users scroll through the portfolio:
  - **Scroll-reactive glow**: `useAtmosphereScroll` hook uses IntersectionObserver + rAF-throttled scroll to detect the dominant viewport section and smoothly transitions the ambient background color between moods (purple origins → pink artists → cyan spotlight → orange top hits → green eras). 1.4s cubic-bezier transition creates cinematic color shifts
  - **Film grain overlay**: CSS-only analog noise using SVG `feTurbulence` as a data URI background. Animated with stepped `transform` shifts for subtle grain movement. `mix-blend-mode: overlay` at 3.5% opacity — visible enough to feel authentic, light enough to never distract
  - **Cinematic vignette**: Radial gradient darkening the viewport edges like a camera lens, adding depth and focus to the center content
- All three layers respect `prefers-reduced-motion` (grain animation stops, glow transitions are instant, vignette remains static)
- Zero new dependencies — pure CSS + React hooks

## [3.36.4] - 2026-03-21

### Added
- **easeOutExpo test suite** (`easing.test.js`) — 15 tests covering the exponential ease-out curve used by `useCountUp` for animated counters. Validates boundary conditions (t=0→0, t=1→1 including the float precision guard), monotonicity (output never decreases), output range clamping [0,1], ease-out curve shape (85% at one-third, deceleration, concavity), formula correctness against `1 - 2^(-10t)`, and numerical stability at extreme values. Previously the only untested utility extracted in v3.35.0
- Test suite now at **593 tests across 44 suites** (up from 578/43)

## [3.36.3] - 2026-03-19

### Fixed
- **TopHits misleading link text** — Cards in the Top 10 ranked showcase displayed `video.description` as the song title, but the `description` field is inconsistent across the catalog (some entries contain featuring info, collaborator names, or wrong album titles instead of the actual song name). Swapped fallback priority to extract the song name from `video.title` first (via `title.replace(artist, '')`) and only fall back to `description` if the title extraction produces an empty string. Fixes misleading link text for #2 Casper TNG, #6 K Money collab, #7 Purple X BG, and #8 Hypa crew track

## [3.36.2] - 2026-03-17

### Security
- **YouTube API response envelope sanitizer** (`youtubeSanitizer.js`) — New defense-in-depth module that validates the outer structure of YouTube Data API v3 responses before individual items are processed. Operates upstream of `apiSanitizer.js` to catch structural attacks: malformed envelopes, item count amplification, oversized payloads, and unexpected response kinds
- **`validatePayloadSize()`** — Rejects raw API response text exceeding 5 MB before JSON.parse runs, preventing CWE-400 (uncontrolled resource consumption) at build time
- **`validateEnvelope()`** — Validates `kind`, `etag` format, `pageInfo` bounds, and `items[]` array shape against YouTube API v3 contract — detects MITM envelope swaps and impossible pagination values
- **`sanitizeYouTubeResponse()`** — Full-pipeline entry point: envelope validation → count ceiling enforcement → poison key stripping → per-item sanitization → unrequested-ID filtering. Replaces manual item processing in the fetch script
- **Fetch script hardened** — `fetch-youtube-data.js` now validates payload size before parsing and routes all items through the envelope sanitizer pipeline
- 23 new tests covering payload size limits, envelope shape validation, etag format, item count ceiling, unrequested ID filtering, prototype pollution, and graceful degradation
- Test suite now at **578 tests across 43 suites** (up from 555/42)

## [3.36.1] - 2026-03-15

### Security
- **Dependency audit & remediation** — Patched HIGH severity Rollup path traversal vulnerability (GHSA-mw96-cpmx-2vgc) affecting `rollup@4.0.0–4.58.0`. Updated to `rollup@4.59.0+` via `npm audit fix`
- **Extraneous package cleanup** — Removed 44 orphaned packages (legacy Mux, Vimeo, react-player, TikTok/Twitch/Wistia video elements, and associated utilities) that were no longer declared in `package.json` but persisted in `node_modules`, reducing supply-chain attack surface
- **Full OWASP Top 10 audit** — Verified all 10 categories; zero code-level vulnerabilities found. Existing defenses confirmed: two-layer prototype pollution guards, build-time API response sanitizer, runtime CSP monitor, strict YouTube ID validation, URL scheme blocking, postMessage origin whitelisting, and iframe auditing
- **npm audit result: 0 vulnerabilities** (was 1 HIGH)
- All 555 tests passing across 42 suites (including 21 video playback regression tests and 29 security header tests)

## [3.35.2] - 2026-03-14

### Added
- **CSP Monitor documentation** (`docs/CSP_MONITOR.md`) — Portfolio-grade technical README for the runtime security observability module (`src/utils/cspMonitor.js`). Covers all 5 subsystems: CSP violation listener with dedup/rate-limiting, postMessage origin monitor, boot-time integrity assertions, runtime iframe audit, and test cleanup. Includes ASCII architecture diagram, subsystem interaction table, integration examples, export reference, relationship map to other security modules, and protected-config warnings to prevent repeat regressions
- Updated README.md with cross-links to the new security deep-dive doc

## [3.35.1] - 2026-03-14

### Security
- **Build-time API response sanitizer** (`apiSanitizer.js`) — New defense-in-depth module that sanitizes all YouTube API response data before it enters `public/videos-enriched.json`. Addresses CWE-20 (improper input validation), CWE-79 (stored XSS via injected HTML in API fields), and CWE-1321 (prototype pollution via `__proto__`/`constructor` keys in external JSON)
- **`sanitizeString()`** — Strips HTML tags and control characters from API string fields (channelTitle, publishedAt) before they're bundled into client-side data
- **`isAllowedImageUrl()`** — Validates thumbnail URLs against an origin allowlist (img.youtube.com, i.ytimg.com, yt3.ggpht.com, yt3.googleusercontent.com) — rejects non-HTTPS and untrusted CDN origins
- **`stripPoisonKeys()`** — Recursive prototype pollution prevention for nested API response objects, complementing the client-side `safeJsonParse()` in urlSafety.js
- **`sanitizeVideoItem()`** — Per-item sanitizer that cross-checks API response item IDs against requested IDs (detects MITM response swaps), clamps negative view counts, and filters thumbnails through origin validation
- **Integrated into `fetch-youtube-data.js`** — All YouTube API responses now pass through `stripPoisonKeys()` + `sanitizeVideoItem()` before being written to the build output
- 19 new tests covering HTML stripping, control char removal, origin allowlisting, prototype pollution, ID mismatch detection, negative view count clamping, and graceful degradation
- Test suite now at **555 tests across 42 suites** (up from 536/41)

## [3.35.0] - 2026-03-14

### Changed
- **Search scoring extraction** — Moved `fuzzyScore()`, `searchAll()`, `sanitizeSearchInput()`, and constants (`MAX_QUERY_LENGTH`, `CONTROL_CHAR_RE`) from hook file (`useSearch.js`) into dedicated utility module (`src/utils/searchScoring.js`). The hook now imports from the utility and re-exports for backward compatibility. Aligns with the project convention: pure algorithms live in `utils/`, hooks manage React state only
- **Easing extraction** — Extracted `easeOutExpo()` from inline definition in `useCountUp.js` into `src/utils/easing.js`. The test suite now imports the canonical function instead of duplicating the formula. Single source of truth for animation curves
- Updated 5 consumer imports (`MobileApp.jsx`, `SearchBar.jsx`, `searchScoring.test.js`, `dataIntegrity.test.js`, `useCountUp.test.js`) to import directly from utility modules

## [3.34.0] - 2026-03-13

### Changed
- **Shader factory utility** (`shaderFactory.js`) — New shared module centralizing `THREE.ShaderMaterial` creation for atmospheric 3D effects. Provides `createAtmosphericMaterial()` factory with sensible defaults (transparent, no depth write, additive blending) and reusable GLSL snippets: `GLSL_SIMPLEX_NOISE` (2D simplex noise, Ashima Arts implementation) and `GLSL_FBM` (fractal Brownian motion + domain warping)
- **ProceduralNebula** — Replaced 48 lines of inline GLSL noise functions (mod289, permute, snoise, fbm, warpedFbm) with shared `GLSL_SIMPLEX_NOISE` + `GLSL_FBM` imports from shaderFactory; switched from raw `new THREE.ShaderMaterial()` to `createAtmosphericMaterial()`
- **EnhancedStarField** — Switched from raw `new THREE.ShaderMaterial()` to `createAtmosphericMaterial()`, eliminating duplicate transparent/depthWrite/blending boilerplate
- **SoftParticles** — Same factory extraction as EnhancedStarField, consistent material creation pattern across all 3D atmosphere components

## [3.33.3] - 2026-03-13

### Security
- **URL safety utility** (`urlSafety.js`) — New defense-in-depth module with three guards: `isDangerousScheme()` blocks `javascript:`, `data:`, `vbscript:`, `blob:` protocol attacks (CWE-79); `safeReplaceState()` enforces same-origin relative URLs only, preventing open redirect via `history.replaceState` (CWE-601); `safeJsonParse()` strips `__proto__`/`constructor`/`prototype` keys during JSON parsing to prevent prototype pollution from tampered localStorage (CWE-1321)
- **useVideoDeepLink** now uses `safeReplaceState` instead of raw `window.history.replaceState` — blocks absolute URL injection and dangerous scheme writes to the address bar
- **useFavorites** now uses `safeJsonParse` instead of raw `JSON.parse` — prevents prototype pollution if an attacker tampers with localStorage `tdots-favorites` payload
- 31 new tests: 12 dangerous scheme detection (case/whitespace bypass vectors), 9 replaceState origin-pinning (absolute/protocol-relative/scheme blocking), 10 JSON prototype pollution prevention (nested `__proto__`, `constructor`, `prototype` key stripping)
- Test suite now at **524 tests across 41 suites** (up from 493/40)

## [3.33.2] - 2026-03-13

### Added
- **useModalKeyboard test suite** (11 tests) — Validates the shared keyboard dispatch hook extracted in v3.33.0: correct Escape/ArrowLeft/ArrowRight routing, no cross-triggering between keys, graceful handling of missing callbacks (escape-only and nav-only usage patterns), no-op when `active` is false, and rapid sequential press counting
- **useOutsideClick test suite** (9 tests) — Validates the click-outside-to-dismiss hook extracted in v3.33.0: outside-target detection, inside-target (self + child) rejection, sibling element distinction, null `ref.current` guard (unmounted component safety), `active` flag gating, and multi-click accumulation
- Test suite now at **493 tests across 40 suites** (up from 473/38)
## [3.33.2] - 2026-03-11

### Security
- **postMessage origin monitor** — Logs unexpected `postMessage` origins from rogue extensions or injected iframes. Trusted origins (YouTube, Google) are allowlisted; same-origin messages pass silently. Rate-limited to 10 warnings per session to prevent console flooding. Data payloads are intentionally never logged (credential leak prevention)
- **Runtime iframe origin audit** — New `auditIframes()` validates all current iframes point to allowed origins (youtube.com, youtube-nocookie.com, google.com). Catches rogue iframes injected after React mounts YouTube players — the existing boot-time check only counted iframes before mount
- Both monitors integrated into `initSecurityMonitor()` with full cleanup on `destroy()`
- Added 12 new tests covering origin allowlisting, rate limiting, data-type-only logging, destroy/reset cycle, iframe audit in non-browser env, and configuration bounds (485 total tests across 38 suites)
## [3.34.0] - 2026-03-13

### Added
- **Culture Canvas — cinematic spotlight focus** on the mobile video grid. When hovering (desktop) or long-pressing (mobile) a video card, the entire grid enters "theater mode": surrounding cards dim and desaturate while the focused card lifts with a dramatic cyan-pink accent bloom, pulsing glow halo, and enhanced play icon visibility. Creates the Netflix browse-and-spotlight interaction pattern — like the lights going down in a theater when you point at a poster
- **`useCinematicFocus` hook** — reusable hook managing spotlight state with 120ms hover entry delay (prevents flicker on mouse traversal), instant exit, 400ms long-press threshold for mobile, and tap-away-to-dismiss. Exposes `gridProps` and `cardProps` for zero-config wiring into any grid layout
- Full `prefers-reduced-motion` support — spotlight dims opacity only (no transforms, no bloom animation) when reduced motion is preferred
- Now-playing cards stay semi-visible during canvas mode so users never lose track of the active video

## [3.33.1] - 2026-03-11

### Fixed
- **useCopyLink timer leak** — The 2-second "copied" indicator timeout was never cleaned up on unmount (timer leak / setState on dead component) and rapid re-copies caused the indicator to disappear too early because stale timeouts from previous clicks weren't cleared. Added `useRef`-tracked timer with proper cleanup on unmount and `clearTimeout` before each new copy so the indicator always stays visible for a full 2 seconds from the last click
- Added 2 new tests covering rapid re-copy timer reset and unmount cleanup behavior (473 total tests across 38 suites)

## [3.33.0] - 2026-03-10

### Changed
- **Extract `useModalKeyboard` hook** — Centralizes Escape/ArrowLeft/ArrowRight handling for all modal and overlay components. Replaces 4 separate `useEffect` + `addEventListener` blocks across TheaterMode, ArtistPanel, PhotoGallery Lightbox, and SearchBar with a single composable hook. Accepts `{ onClose, onPrev, onNext }` with an optional `active` gate
- **Extract `useOutsideClick` hook** — Centralizes click-outside-to-dismiss pattern. Listens on `mousedown` (fires before focus shift) for correct popover/dropdown behavior. Used by SearchBar, available for future dropdown/panel components
- **SearchBar** refactored: 22-line `useEffect` replaced with two 1-line hook calls (`useModalKeyboard` + `useOutsideClick`)
- **ArtistPanel** refactored: 7-line escape handler replaced with single `useModalKeyboard({ onClose }, isOpen)` call
- **TheaterMode** refactored: 10-line keyboard handler (useCallback + useEffect) replaced with 3-line hook usage with guarded prev/next callbacks
- **PhotoGallery Lightbox** refactored: 8-line keyboard handler replaced with single `useModalKeyboard({ onClose, onPrev, onNext })` call
- Removed unused imports (`useEffect` from ArtistPanel/TheaterMode) — cleaner dependency trees

## [3.32.1] - 2026-03-10

### Added
- **useSwipe test suite** (11 tests) — Validates touch gesture detection: left/right swipe direction, 50px threshold boundary (> not >=), ghost swipe prevention after touchEnd reset, graceful handling of missing/empty `changedTouches`, null callback tolerance, and consecutive independent swipes
- **useCinematicScroll test suite** (12 tests) — Validates scroll progress math: correct 0→1 mapping from viewport bottom to top, clamping at extremes, monotonic increase guarantee, zero/negative window height guards (prevents NaN), and consistent behavior across viewport sizes
- Test suite now at **471 tests across 38 suites** (up from 448/36)

## [3.32.0] - 2026-03-10

### Added
- **Cinematic Entrance** — Movie-premiere opening sequence on HubPage. Dark theater curtain overlay splits apart horizontally via CSS pseudo-elements, revealing the page beneath. Logo blooms in from scaled-down with neon flare burst. Title lines slide in from opposing sides with motion blur (`filter: blur`). Header line expands from center. Tagline and nav cards cascade up with staggered delays. All animations use `cubic-bezier(0.16, 1, 0.3, 1)` (spring-out) for snappy, premium feel
- **Ambient Light Orbit** — Background glow orbs (`hub-bg-glow`) now slowly drift position over a 20-second cycle, making the page atmosphere feel alive and cinematic rather than static
- Full `prefers-reduced-motion` support — all entrance animations and ambient drift disabled for users who prefer reduced motion

## [3.31.1] - 2026-03-09

### Fixed
- **diverseShuffle: back-to-back repeat on exhausted pool** — When history covered the entire pool, the fallback path picked from ALL items including the most recently played one. Users hitting "NEXT" on VideoSpotlight could get the same video they just watched. Fallback now excludes the last-played item, guaranteeing a different pick
- **diverseShuffle: history over-retention on maxHistory shrink** — `if (history.length > maxHistory)` only removed one entry per call. If `maxHistory` decreased between calls (e.g. `useShufflePlay` historySize prop change), history stayed bloated for many iterations, over-excluding candidates and degrading diversity. Replaced with `while` loop that trims to target size immediately

### Added
- 3 new test cases for diverseShuffle: back-to-back repeat prevention, oversized history trimming, single-item pool edge case
- Test suite now at **448 tests across 36 suites** (up from 445/36)
## [3.32.0] - 2026-03-09

### Added
- **Film Strip** — Cinematic 35mm film strip component on HubPage between navigation cards and ArtistShowcase. Continuously scrolling marquee of the top 14 most-viewed video thumbnails styled as celluloid film frames with sprocket holes, dark film borders, and vignette edge fades. Hover pauses the strip, scales the frame, and reveals the artist name in neon cyan. Clicking any frame navigates to that video's standalone page. Respects `prefers-reduced-motion`, responsive on mobile (smaller frames, faster scroll). Adds the "film projector lobby" ambient motion that fits a video production portfolio

### New Files
- `src/components/FilmStrip.jsx` — Film strip React component (14 top videos, duplicated for seamless loop, accessible button frames)
- `src/components/FilmStrip.css` — 35mm film aesthetic with sprocket holes, continuous `film-scroll` keyframes, hover-to-pause, mobile breakpoint, reduced-motion support

## [3.31.0] - 2026-03-09

### Changed
- **ArtistShowcase: eliminated duplicate `useCountUp` hook** — `ArtistShowcase.jsx` contained its own inline 22-line `useCountUp` implementation (easeOutCubic) plus a 30-line `StatCounter` component with hand-rolled IntersectionObserver logic. Replaced with the shared `useCountUp` hook (easeOutExpo, proper RAF cleanup) and `useScrollReveal` hook — the same pair `ImpactNumbers` already uses. Removes ~50 lines of duplicated logic
- **Unified easing curve** — Stats counters in both `ArtistShowcase` and `ImpactNumbers` now use the same `easeOutExpo` curve, creating consistent animation feel across the HubPage
- **Reduced observer count** — Previously each `StatCounter` instance created its own IntersectionObserver (4 observers for 4 stats). Now a single `useScrollReveal` observer triggers all four counters simultaneously via a shared `isVisible` prop

## [3.30.0] - 2026-03-08

### Changed
- **Extracted shared `diverseShuffle` utility** — Both `VideoSpotlight` (hub hero shuffle) and `useShufflePlay` (video page queue) independently implemented the same sliding-window random selection algorithm. Extracted to `src/utils/diverseShuffle.js` — a single pure function that takes a pool, mutable history array, max history size, and key extractor. Zero behavior change; both consumers now delegate to the same code path
- **Test files use real implementation** — `VideoSpotlight.test.js` and `useShufflePlay.test.js` previously duplicated the shuffle algorithm in test setup functions. Now they import and test the actual `diverseShuffle` utility, eliminating the risk of test copies drifting from production code

### Added
- `src/utils/diverseShuffle.js` — Shared sliding-window shuffle with configurable pool, history, and key extraction
- `src/utils/diverseShuffle.test.js` — 7 tests covering index validity, history mutation, eviction, exhaustion fallback, full rotation guarantee, and custom key functions
- Test suite now at **445 tests across 36 suites** (up from 438/35)

## [3.29.2] - 2026-03-08

### Security
- **CSP violation monitoring** — Added runtime `securitypolicyviolation` event listener (`src/utils/cspMonitor.js`) that captures, deduplicates, and rate-limits CSP violation events. Previously, blocked injection attempts and supply-chain changes in third-party dependencies were completely invisible — violations now surface as structured `console.warn` logs with directive, blocked URI, source location, and truncated policy. Rate-limited to 25 events/session with 5-second dedup window to prevent console flooding
- **Runtime integrity assertions** — Boot-time checks verify `document.domain` hasn't been relaxed (same-origin bypass), no unexpected iframes exist at startup (clickjacking overlays), and `window.opener` is null (reverse tabnapping defense). Guards with `typeof document` checks for SSR/Node safety
- **Browser environment guards** — All DOM-touching security code wrapped in `typeof document !== 'undefined'` checks, preventing crashes if the module is imported in SSR or test environments without jsdom

### Added
- `src/utils/cspMonitor.js` — Security monitor module with `initSecurityMonitor()` lifecycle API (init/destroy), exported test helpers
- 12 new security tests in `cspMonitor.test.js` covering violation logging (structured output, inline violations, unknown sources, policy truncation), configuration bounds, runtime integrity no-ops in Node, and monitor lifecycle (destroy/re-init, idempotency)
- Test suite now at **438 tests across 35 suites** (up from 426/34)

## [3.29.1] - 2026-03-08

### Security
- **Prototype pollution defense** — All exported data objects (`VIDEOS`, `ALL_ARTISTS`, `ARTIST_STATS`, `PORTFOLIO_STATS`, `NEON_COLORS`, `DECEASED_ARTISTS`) are now deep-frozen via `Object.freeze()`. Third-party scripts (YouTube IFrame API, Troika font loader, Three.js) share the same execution context — if any are compromised via supply-chain attack, frozen objects prevent mutation of content that React renders into the DOM
- **Search input sanitization** — Added `sanitizeSearchInput()` that strips C0/C1 control characters, NUL bytes, zero-width Unicode (U+200B–U+200F), byte order marks (U+FEFF), and line/paragraph separators before fuzzy matching. Prevents display corruption and text-processing edge case exploitation
- **Permissions-Policy hardening** — Added `browsing-topics=()` (blocks Google Topics API, the FLoC successor for ad tracking), `local-fonts=()` (blocks Local Font Access API, a high-entropy fingerprinting vector), and `window-management=()` (blocks multi-screen enumeration fingerprinting)

### Added
- 20 new security tests in `dataIntegrity.test.js` covering immutability enforcement, input sanitization edge cases (NUL bytes, zero-width chars, BOM, emoji preservation), and Permissions-Policy anti-fingerprinting directives
- Test suite now at **426 tests across 34 suites** (up from 406/33)

## [3.29.0] - 2026-03-06

### Added
- **Impact Numbers** — Scroll-triggered animated stat counter section on the HubPage landing. Four portfolio metrics (videos, artists, total views, years active) count up from zero using `requestAnimationFrame` with `easeOutExpo` easing for a cinematic "slot machine" feel. Each stat card has its own neon accent color (pink, cyan, gold, green), staggered entrance animation, sliding neon underline bar, and hover glow intensification. Uses `tabular-nums` to prevent layout jank during counting. Responsive 2x2 grid on mobile, `prefers-reduced-motion` respected
- **`useCountUp` hook** (`src/hooks/useCountUp.js`) — Reusable animation hook for counting numbers. Uses `requestAnimationFrame` for 60fps smoothness, `easeOutExpo` curve (front-loads 87% of progress in first 30% of duration), fires-once guard to prevent re-animation on re-render
- **Dynamic card subtitle** — HubPage music videos card now reads from `PORTFOLIO_STATS` instead of hardcoded "101 VIDEOS — 54 ARTISTS", so it auto-updates when videos are added
- 8 new tests for the easeOutExpo counting algorithm (monotonicity, boundary values, curve correctness, large/small targets)
- Test suite now at **406 tests across 33 suites** (up from 398/32)

## [3.28.1] - 2026-03-06

### Fixed
- **Search dropdown dismiss** — Mobile search dropdown now closes on outside click (mousedown + touchstart) and Escape key. Previously the only way to close it was clicking the search icon again, which was undiscoverable on mobile
- **Filter transition jank** — Switching tabs or artist filters caused an inconsistent mix of animated and non-animated cards. Cards whose IDs were already in the `useBatchReveal` revealed set from a previous filter would flash in instantly while new cards animated. Fixed by resetting the revealed set on every filter change so all cards get fresh staggered entrance animations
- **Card entrance refinement** — Entrance animation now includes a subtle scale (0.97 -> 1) alongside the translateY for a more cinematic spring-in feel. Hidden cards get a CSS transition fallback so they fade out smoothly when removed from the grid

### Added
- **Search dropdown entrance animation** — `dropdown-enter` keyframe with scaleY + translateY for a polished reveal instead of instant pop-in

## [3.28.0] - 2026-03-06

### Added
- **Vibrancy Pulse** — Cinematic neon light sweep effect on hover across all video card surfaces. A diagonal streak of pink/cyan/purple races across the thumbnail on hover, combined with a chromatic border flare that cycles through the synthwave palette (pink -> cyan -> purple -> settle). Applied to mobile VideoCards, VideoPage related cards, and Top Hits ranked cards. Each surface uses its own color context (Top Hits cards inherit their per-rank `--rank-color` for the sweep). All animations are GPU-accelerated (`transform`-only), fire once per hover, and fully respect `prefers-reduced-motion`

## [3.27.2] - 2026-03-06

### Fixed
- **Theater mode close race condition** — Rapid F-key toggles during the 300ms close animation could cause ProximityTracker to overwrite `activeProject`, making the user see a different video on reopen. Added `useClosingGuard` hook that introduces a `closing` phase between open and unmounted, blocking re-entry until the animation completes and cancelling stale timers on re-open
- **Missing theater close animation** — TheaterMode had a fade-in/scale-in animation but no exit animation; it just unmounted instantly. Added `theater-closing` CSS class with matched `theater-fade-out` and `theater-scale-out` keyframes (0.3s ease-in) for a polished cinematic exit
- **Accessibility: reduced motion** — Added `prefers-reduced-motion: reduce` media query to TheaterMode, disabling all open/close animations for users who prefer reduced motion

### Added
- **`useClosingGuard` hook** (`src/hooks/useClosingGuard.js`) — Reusable state machine for guarding panel/modal close animations. Prevents double-close, blocks focus on doomed elements, and force-cancels stale timers on re-open. 8 new tests
- Test suite now at **398 tests across 32 suites** (up from 390/31)

## [3.27.1] - 2026-03-05

### Added
- **Cross-module data integrity tests** (`src/data/crossModuleIntegrity.test.js`) — 14 tests verifying contracts between `videos.json`, `videoData.js`, and `youtube.js`. Catches invalid youtubeIds, duplicate IDs, broken artist references, thumbnail URL round-trips, ARTIST_STATS date range accuracy, popular lane neon color offset, and PORTFOLIO_STATS derived value consistency
- **Search scoring formula tests** (`src/utils/searchScoring.test.js`) — 11 tests verifying fuzzyScore mathematical properties (weight coefficients, coverage ranking, consecutive bonus, case insensitivity, score bounds) and searchAll security boundaries (100-char query truncation, null/undefined resilience, minimum query length, title-vs-artist ranking, result caps)
- Test suite now at **390 tests across 31 suites** (up from 365/29)

## [3.27.0] - 2026-03-01

### Added
- **Reusable SVG Icon component** (`src/components/ui/Icon.jsx`) — 12 inline stroke-based SVG icons (film, camera, lightning, delorean, cyberbike, search, dice, link, maple, dove, chat, cityscape). Uses `currentColor` for theme-aware color cascading. No external dependencies
- **Neon glow on SVG icons** — `drop-shadow(0 0 6px currentColor)` filter applied to all icon contexts (hub cards, vehicle selector, share buttons, search, memorial)

### Changed
- **Replace all UI emojis with SVG icons** — 15 emoji-to-SVG replacements across 7 files (HubPage, App, MobileApp, VideoPage, SearchBar, VideoOverlay, TheaterMode). Tweet text emojis intentionally preserved since they render in external platforms
- **Hub card icon sizing** — Switched from `font-size` to flexbox + explicit width/height for consistent SVG rendering
- **Vehicle selector icons** — Changed from emoji strings to Icon component references

## [3.26.0] - 2026-02-25

### Added
- **Top Hits — Netflix Top 10-style ranked showcase** — New `TopHits` component on the Hub landing page displays the 10 most-viewed productions in a horizontally scrollable strip. Features oversized hollow neon rank numbers with `-webkit-text-stroke` and per-rank color theming (#1 gold, #2 neon pink, #3 cyan, etc.), cinematic YouTube thumbnails with hover zoom + tinted glow shadows via `color-mix()`, animated view count badges with play icon, and staggered IntersectionObserver reveal animations with CSS custom property delays. Each card links to `/video/:youtubeId` for instant deep-linking. Responsive: 200px cards on desktop, 160px on mobile. Respects `prefers-reduced-motion`. 12 new tests guard ranking order, data integrity, and format correctness
- All 365 tests passing (29 suites), including 21 video playback guardrails

## [3.25.1] - 2026-02-24

### Changed
- **Refactor MobileApp.jsx — eliminate inline IIFEs and conditional hooks** — Replaced two inline IIFE patterns in JSX (grid playback index computation and queue indicator) with named `useMemo` hooks (`queuePosition`, `gridPlayingIndex`). Hoisted `heroVideo` and `gridVideos` from render body to `useMemo` hooks above early returns, fixing a latent Rules of Hooks violation. Extracted inline styles on share actions row and artist spotlight button into CSS classes (`modal-share-actions`, updated `mobile-spotlight-artist`). Removed unused `useRef` import. All 353 tests passing (28 suites), 21 video playback guardrails green

## [3.25.0] - 2026-02-24

### Added
- **3D portal frame for VideoSpotlight** — New `SpotlightPortal` component renders a lightweight Three.js Canvas behind the Now Playing hero, featuring rotating neon torus rings and drifting particle field that create an "Astroworld gate" atmosphere. Portal color cycles through the neon palette (`#ff2a6d`, `#05d9e8`, `#d300c5`, `#7700ff`) based on the current video index. Uses additive blending for natural glow overlap, `powerPreference: 'low-power'` to avoid GPU contention with the main 3D city scene, and `:has()` CSS selector to fade the portal out during video playback. Hidden on mobile (<768px) and when `prefers-reduced-motion` is active. 3 new unit tests for portal color cycling logic
- All 353 tests passing (28 suites), including 21 video playback guardrails

## [3.24.3] - 2026-02-24

### Added
- **AnythingLLM RAG platform research brief** — New `docs/research/anythingllm-rag-platform.md` analyzing Mintplex-Labs' 54,900-star open-source AI application: self-hosted RAG with 30+ LLM providers, built-in agent framework with MCP compatibility, LanceDB default vector storage for privacy-by-architecture, and embeddable chat widget. Competitive positioning mapped against LangChain, Flowise, and Open WebUI. Five relevance signals assessed for this project's autonomous pipeline — including local-first knowledge base, MCP agent interop, workspace isolation per repo, and an interactive portfolio chat concept using the embed module

## [3.24.2] - 2026-02-24

### Changed
- **Portfolio-grade README rewrite** — Added cinematic ASCII art banner matching synthwave aesthetic, "Jump In" quick-link table with direct URLs to Hub, 3D City, and Video Page experiences, new "Security & Performance" section showcasing 11 HTTP headers, 30-pattern secret scanning, 21 playback tests, and Lighthouse scores. Fixed stale version reference (was v3.23.7, now tracks current). Enhanced footer with tech stack tagline and album-campaign design motif

## [3.24.1] - 2026-02-24

### Added
- **AI coding tools market intel brief** — New `docs/research/cursor-devin-market-shift.md` analyzing the competitive reshuffling across Cursor ($29.3B valuation, Graphite acquisition), Devin/Cognition (Windsurf acquisition, 30-person layoff, 15% task success rate), Claude Code ($2.5B ARR, 4% of GitHub commits), and OpenAI Codex (macOS app launch, multi-agent architecture). Each player assessed on strategy, vulnerability, and direct relevance to this project's autonomous AI pipeline. Five actionable signals mapped to specific pipeline decisions

## [3.24.0] - 2026-02-23

### Changed
- **CSS design token system** — Added RGB channel custom properties (`--neon-pink-rgb`, `--neon-cyan-rgb`, `--neon-purple-rgb`, `--dark-bg-rgb`, `--dark-surface-rgb`) to `:root`, enabling alpha compositing via `rgb(var(--token) / α)` instead of hardcoded `rgba()` values. Added `--dark-surface` token for the `#0a0015` background variant used across pages
- **VideoSpotlight.css token migration** — Replaced all 10 hardcoded `#ff2a6d`/`#05d9e8` hex values and `rgba(255, 42, 109, ...)` / `rgba(5, 217, 232, ...)` patterns with design token references. Replaced 5 raw `font-family: 'Orbitron'` declarations with `var(--font-display)` and 2 `'Rajdhani'` with `var(--font-body)`. Overlay gradients now use `--dark-surface-rgb` token
- **VideoPage.css token migration** — Replaced 9 hardcoded color values and 15 raw `font-family` declarations with design system tokens. Background, nav bar, player border glow, section titles, footer, glitch animation, and 404 state all now reference the centralized palette
- **HubPage.css token migration** — Replaced 4 hardcoded hex colors and all raw `font-family` stacks with token references. Card background/hover states, glow effects, and footer links now use RGB channel tokens for alpha variants
- **KeyboardGuide.css token migration** — Replaced all `rgba(5, 217, 232, ...)` and `rgba(13, 2, 33, ...)` patterns with `rgb(var(--neon-cyan-rgb) / α)` and `rgb(var(--dark-bg-rgb) / α)` token syntax
- All 350 tests passing (28 suites), including 21 video playback guardrails

## [3.23.7] - 2026-02-23

### Added
- **AI weekly intel brief** — New `docs/research/what-to-watch-ai.md` covering three signals for the week of Feb 23: Samsung Galaxy S26 on-device AI launch (Tuesday), Claude 5 frontier model race (prediction markets at 83% Anthropic leads), and Agenti live agent intelligence platform (relevance score 75). Each signal analyzed for direct impact on this project's autonomous AI pipeline — from mobile video consumption patterns to Claude Code upgrade implications to Passion Agent intel feed expansion

## [3.23.6] - 2026-02-23

### Changed
- **Portfolio-grade README rewrite** — Transformed README from technical documentation into a cinematic portfolio piece that matches the site's dark aesthetic. New creative tagline ("If a music video label had its own streaming platform"), Design Philosophy section documenting visual references (Migos Culture III, Travis Scott Astroworld, Director X, Thriller-era visuals) and implementation principles (cinematic dark, vibrant accents, full-bleed media, hover-to-play, moody lighting). Section headers use block element markers (▌) for editorial rhythm. Added 25.3M+ views badge, ✝ markers for deceased artists in roster table, and expanded footer with career stats. Reframed every section description to emphasize the streaming-platform experience over technical implementation

## [3.23.5] - 2026-02-23

### Security
- **Permissions-Policy: block device sensor fingerprinting** — Added `accelerometer=()`, `gyroscope=()`, `magnetometer=()`, `ambient-light-sensor=()`, `idle-detection=()`, and `clipboard-read=()` to Permissions-Policy header. Motion/orientation sensors enable cross-origin device fingerprinting via hardware noise patterns — particularly dangerous with embedded YouTube iframes that load third-party scripts. Idle detection reveals user presence patterns. Clipboard read could exfiltrate clipboard contents. None of these APIs have any legitimate use in a video portfolio
- **Secret scanner: 6 new cloud provider patterns** — Added detection for Cloudflare API tokens, Firebase server keys, Azure connection strings, Heroku API keys, DigitalOcean personal access tokens, and Datadog API keys (30 total patterns, up from 24). These are common in Node.js projects and were blind spots in the previous scanner
- **CSP `style-src` guard test** — New regression test explicitly documents why `unsafe-inline` must stay in `style-src` (React inline styles + Three.js canvas sizing). Prevents future agents from removing it in the name of hardening, which would break all rendering

### Changed
- Test count: 350 passing (28 suites) — added 4 new Permissions-Policy regression tests + 1 CSP style-src documentation test

## [3.23.4] - 2026-02-23

### Changed
- **Architecture guide overhaul** — Updated `docs/ARCHITECTURE.md` to reflect the current state of the codebase: added 4 missing hooks (`useCinematicScroll`, `useScrollReveal`, `useBatchReveal`, `useSwipe`) bringing documented count from 9 to 13; added 4 missing HubPage sub-components (`VideoSpotlight`, `ArtistShowcase`, `EraTimeline`, `VideoPage`) to the project structure tree; added `/video/:id` route to the routing table; corrected test count from 267 to 346 (28 suites); updated system overview diagram to show the full HubPage component hierarchy
- **Scroll-driven animation docs** — New architecture section documenting the `useCinematicScroll` → CSS custom property pipeline: IntersectionObserver gating, passive scroll listeners, compositor-thread animation via `--scroll-progress`/`--parallax-y`/`--dolly-scale`/`--info-offset`, and `prefers-reduced-motion` handling
- **Architecture decisions expanded** — Added JS→CSS scroll bridge rationale and IO-gated scroll listener pattern to the key decisions table

## [3.23.3] - 2026-02-22

### Added
- **Claude vs ChatGPT programming research brief** — New `docs/CLAUDE-VS-CHATGPT-PROGRAMMING.md` analyzing Claude Code's 5.5× token efficiency advantage over competing AI coding tools, head-to-head benchmark data (SWE-bench 80.9%, 4/5 real-world tasks won), pricing breakdown across Haiku/Sonnet/Opus tiers, and how three-tier model routing + prompt caching delivers 90%+ cost savings on this project's autonomous agent workflows. Includes honest assessment of ChatGPT's strengths (math precision, IDE integrations)

## [3.23.2] - 2026-02-22

### Fixed
- **Video playback guardrail gap** — VideoSpotlight.jsx's hover-to-play iframe was missing from the `videoPlayback.test.js` regression suite. Added 3 new tests: referrerPolicy validation, sandbox attribute guard, and embed URL format check. All 3 iframe-bearing components (VideoOverlay, VideoPage, VideoSpotlight) are now fully covered. The broad-sweep no-referrer check also now includes VideoSpotlight. Test count: 18 → 21

## [3.23.1] - 2026-02-22

### Added
- **System prompts research brief** — New `docs/SYSTEM-PROMPTS-RESEARCH.md` analyzing the `x1xhlol/system-prompts-and-models-of-ai-tools` repository (117K+ stars, 30+ AI tools documented). Covers system prompt architecture patterns, tool definition schemas, competitive intelligence across Claude Code / Cursor / Devin, and how this project's `CLAUDE.md` aligns with the emerging industry-standard prompt layering structure. Validates that the repo-level agent configuration powering this portfolio follows the same patterns used by all major AI coding tools

## [3.23.0] - 2026-02-21

### Added
- **Scroll-driven cinematic animation system** — New `useCinematicScroll` hook provides continuous scroll progress (0→1) for any element, gated by IntersectionObserver to avoid unnecessary scroll listeners. The VideoSpotlight "Now Playing" hero now features: parallax thumbnail shift (20px travel), dolly zoom scale (1→1.04×), staggered info panel slide-up, and a reactive neon aura border glow that intensifies as the section enters the viewport. All effects are driven by CSS custom properties (`--scroll-progress`, `--parallax-y`, `--dolly-scale`, `--info-offset`) for GPU-accelerated performance. Fully respects `prefers-reduced-motion`. Zero new dependencies

## [3.22.1] - 2026-02-20

### Added
- **Prompt caching research brief** — New `docs/PROMPT-CACHING-RESEARCH.md` documenting how Anthropic's prompt caching powers the AI agent workflows used to build and maintain this project. Covers KV caching mechanics, pricing math (90% cost reduction on cache reads), cache hierarchy (`tools` -> `system` -> `messages`), TTL options (5-min default / 1-hour extended), workspace isolation, and concrete savings estimates for multi-turn agent sessions operating on this repo

## [3.22.0] - 2026-02-19

### Added
- **"Now Playing" cinematic hero** — VideoSpotlight redesigned as a full-bleed, ultra-wide (21:9) hero section on the HubPage. Hover triggers an auto-playing YouTube preview (muted by default) with a cinematic dual-gradient overlay, pulsing NOW PLAYING badge, mute/unmute toggle, and a prominent WATCH NOW CTA. Shuffle rotates through top-20 videos with the existing no-repeat history buffer. Responsive breakpoints step down to 16:9 (tablet) and 16:10 (mobile). Respects `prefers-reduced-motion`

### Changed
- Thumbnail quality upgraded from `hqdefault` (480×360) to `maxresdefault` (1920×1080) for the spotlight hero
- Spotlight section uses BEM-style `.now-playing__*` class naming instead of `.spotlight-*`

## [3.21.2] - 2026-02-19

### Security
- **CSP `connect-src` tightened** — Removed `cdn.jsdelivr.net` from allowed fetch origins. It was never used in source code but created an unnecessary data exfiltration surface via `fetch()` to any jsdelivr-hosted endpoint
- **HTTPS protocol enforcement on share windows** — `openShareWindow()` now rejects non-HTTPS URLs at the protocol level before hostname checking. Previously, `http://twitter.com/...` would pass the host allowlist but allow MITM interception of the share payload
- **Permissions-Policy expanded** — Added `display-capture=()`, `screen-wake-lock=()`, `xr-spatial-tracking=()` to block screen capture, wake lock, and XR tracking APIs that have no legitimate use in a video portfolio
- **Secret scanner expanded** — Added detection patterns for Stripe secret/restricted keys, Google API keys, Google OAuth secrets, SendGrid API keys, Twilio auth tokens, and Mailgun API keys (7 new patterns, 24 total)

### Changed
- Test count: 343 passing (28 suites) — added 3 new security regression tests (CSP connect-src, Permissions-Policy expansion, HTTPS share enforcement)

## [3.21.1] - 2026-02-19

### Changed
- **AudioVisualizer refactored** — Decomposed monolithic render loop into four isolated draw functions (`drawBars`, `drawParticles`, `drawBassRing`, `drawScanner`) each wrapped in `ctx.save()`/`ctx.restore()` for proper canvas state isolation. Eliminates cross-contamination of `globalAlpha` between visual layers
- **Bass ring redesigned** — Replaced minimal two-circle ring with concentric speaker-cone rings and 32 slowly rotating radial tick marks, evoking a bass speaker membrane / vinyl record aesthetic
- **Scanner sweep added** — Subtle horizontal sweep line moves down the canvas with a soft glow halo, adding a VHS tracking line / moody lighting feel aligned with the cinematic aesthetic
- **`prefers-reduced-motion` support** — Visualizer now respects the OS accessibility setting: static bars at fixed amplitude with no particles or scanner. CSS animations (fade-in, button glow, hover transform) also disabled under reduced motion
- **Configurable BPM** — New `bpm` prop (default 128) allows per-track tempo matching instead of hardcoded 128 BPM
- **JSDoc added** — Full `@param` documentation for the component and all draw functions

## [3.21.0] - 2026-02-19

### Added
- **Audio Visualizer Mode** — Toggle a procedural beat-synced visualizer overlay while watching any video. 48 frequency bars pulse with layered sine waves at 128 BPM, floating neon particles drift upward, and a center ring beats in time. Uses the synthwave palette (cyan → pink → purple → blue → orange). Activate via the equalizer button in the video overlay or press `V`
- Visualizer button with neon glow animation when active, integrated alongside Theater Mode and Copy Link controls
- `V` keyboard shortcut to toggle visualizer from anywhere when a video is playing

## [3.20.2] - 2026-02-18

### Added
- **Video playback guardrail tests** — 18 new tests in `videoPlayback.test.js` that catch every way video playback has been broken before: Trusted Types CSP, referrer policy, COEP, iframe sandbox, YouTube embed URLs, and video data integrity. If any agent's change fails these tests, the change is wrong — not the test
- **CLAUDE.md workflow guardrails** — Added protected configuration rules (#3–#8) documenting Trusted Types, referrer policy, removed features, and mandatory video playback test protocol. Any agent working on this project now sees the rules before writing code

### Changed
- Test count: 340 passing (28 suites)

> *"Quality is not an act, it is a habit."* — Aristotle

## [3.20.1] - 2026-02-18

### Fixed
- **YouTube Error 153 resolved** — Changed `referrerPolicy` from `"no-referrer"` to `"strict-origin-when-cross-origin"` on YouTube iframe embeds in VideoOverlay and VideoPage. YouTube requires the `Referer` header since late 2025 — stripping it entirely caused "Error 153: Video player configuration error" on all embedded videos. This was the second breakage from Passion's security hardening (first was Trusted Types CSP in v3.18.2)

> *"Fall seven times, stand up eight."* — Japanese proverb

## [3.20.0] - 2026-02-18

### Fixed
- **Video playback restored** — Removed `require-trusted-types-for 'script'` from CSP. This directive was blocking YouTube IFrame API (dynamic script injection in `ensureYTApi()`) and Three.js (innerHTML operations), causing videos to not play and the 3D experience to crash with "3D rendering failed"

### Removed
- **Culture Queue** — Horizontal scroll-snap video strip removed from hub page
- **Collab Web** — Artist collaboration network graph removed from hub page
- **Production Pulse** — Year-by-year neon bar chart removed from hub page
- **Now Playing Overlay** — Auto-rotating featured video bar removed from hub page (had no audio due to CSP blocking YouTube API)
- Deleted 10 files: 4 components (.jsx), 4 stylesheets (.css), 2 test files (.test.js)

### Changed
- **Hub page bundle reduced ~40%** — JS: 23.14KB → 13.83KB, CSS: 29.91KB → 16.30KB
- **Security test updated** — CSP test now asserts Trusted Types is absent (intentionally incompatible with YouTube + Three.js)
- Test count: 322 passing (27 suites), down from 343 (29 suites) after removing dead test files

> *"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away."* — Antoine de Saint-Exupery

## [3.19.0] - 2026-02-18

### Changed
- **Extracted `useSwipe` hook** — Moved the horizontal swipe gesture detection hook from an inline definition in `MobileApp.jsx` to its own reusable module at `src/hooks/useSwipe.js`. Same API, same 50px threshold, now importable by any component that needs touch gesture navigation
- **Extracted `useBatchReveal` hook** — Moved the batch IntersectionObserver scroll-reveal logic from `MobileApp.jsx` to `src/hooks/useBatchReveal.js`. This is distinct from the existing single-ref `useScrollReveal` hook — it observes all `[data-vid]` elements in the DOM at once and returns a `Set` of revealed IDs, making it purpose-built for grid/list reveal animations
- **MobileApp.jsx reduced by ~75 lines** — Component now imports both hooks instead of defining them inline, improving readability and establishing clear module boundaries

## [3.18.2] - 2026-02-18

### Security
- **Trusted Types CSP directive** — Added `require-trusted-types-for 'script'` to Content-Security-Policy. This is the strongest browser-level DOM XSS prevention available — it forces all dangerous DOM sinks (`innerHTML`, `document.write`, `eval`) to go through a Trusted Types policy instead of accepting raw strings. Any code (including third-party scripts) that tries to inject raw HTML into the DOM will throw a TypeError. Supported in Chrome 83+, Edge 83+, with graceful fallback in other browsers
- **Expanded secret scanner** — Added 7 new credential patterns to `scripts/scan-secrets.js`: GitHub fine-grained PATs (`github_pat_`), Anthropic API keys (`sk-ant-`), Vercel tokens (`verc_`), npm tokens (`npm_`), Discord webhooks, Discord bot tokens, and Supabase JWT keys. Total coverage: 17 patterns (up from 10)
- **4 new CSP regression tests** — Trusted Types enforcement, `form-action 'self'` restriction, `base-uri 'self'` restriction, and `unsafe-eval` absence guard. All 4 tests prevent future agents or contributors from accidentally weakening CSP. Total test count: 343 (29 suites)

## [3.18.1] - 2026-02-18

### Security
- **VideoPage iframe defense-in-depth** — iframe `src` now uses validated `video.youtubeId` (from catalog lookup) instead of raw `useParams()` value, ensuring only catalog-verified IDs ever reach the YouTube embed URL
- **Referrer suppression on all iframes** — Added `referrerPolicy="no-referrer"` to VideoPage iframe (was missing entirely) and corrected VideoOverlay from `"origin"` to `"no-referrer"`, preventing the portfolio domain from leaking as a Referer header to YouTube
- **Share URL hardening** — `handleShare` and "Watch in 3D" CTA in VideoPage now use validated `video.youtubeId` instead of raw route param, closing a theoretical URL injection vector in share links

## [3.18.0] - 2026-02-17

### Added
- **Video Detail Page** — New `VideoPage` component at `/video/:youtubeId` gives every video its own shareable, SEO-friendly page. Embedded YouTube player (privacy-enhanced `youtube-nocookie.com`), neon-bordered frame with CRT scanline overlay, metadata display (artist, title, views, year, artist video count), share bar (copy link, X/Twitter, WhatsApp), related videos grid (same-artist first, then popular), and "Watch in 3D" CTA linking to the synthwave highway. Only 6 kB gzipped — 150x lighter than loading the full Three.js experience
- **Branded 404 Page** — Glitch-animated 404 screen with neon text effect for invalid URLs and unknown routes. Inline in `main.jsx` for zero additional bundle cost
- **Social Footer on HubPage** — Upgraded minimal footer with YouTube channel link, Instagram link, and "Book a Session" email CTA with neon pill styling
- **Video Detail Footer** — Full footer on VideoPage with YouTube, Instagram, booking CTA, and gradient separator

### Changed
- **CultureQueue cards** now link to `/video/:youtubeId` (lightweight) instead of `/videos?v=` (heavy 3D). Users can still reach the 3D experience via the "Watch in 3D" CTA on the video page
- **VideoSpotlight card** similarly updated to link to the new video detail page
- **CSP updated** — Added `https://www.youtube-nocookie.com` to `frame-src` for privacy-enhanced embeds
- **Vercel rewrites** — Added `/video/:youtubeId` rewrite for SPA routing

## [3.17.0] - 2026-02-17

### Added
- **Now Playing Overlay** — Astroworld-inspired persistent bottom bar on the HubPage featuring a glowing portal thumbnail with equalizer animation, track title, artist name, and a looping progress bar that auto-rotates through the top 8 most-viewed videos every 30 seconds. Dismissible with close button, cycling neon accent colors per track, deep-link WATCH CTA to `/videos?v=`. Reduced-motion support, mobile-responsive layout, `role="complementary"` with dynamic `aria-label`

## [3.16.0] - 2026-02-17

### Added
- **Culture Queue** — New `CultureQueue` component on the HubPage: a horizontal scroll-snap video strip showcasing the top 12 most-viewed videos. Each card features a cinematic thumbnail with hover-activated neon purple glow, CRT scanline overlay, play icon reveal, and smooth scale-up transitions. Arrow navigation buttons for keyboard/mouse users, responsive layout (cards shrink on mobile, nav arrows hide for touch scrolling). Clicking any card deep-links to `/videos?v=` for instant 3D playback
- **Scroll-reveal animation** — Fades in and slides up when scrolled into view via `useScrollReveal`, with full `prefers-reduced-motion` support
- **WCAG accessible** — `role="list"` semantics, descriptive `aria-label` on all interactive elements, `focus-visible` outlines on cards and nav buttons, keyboard-navigable scroll track

## [3.15.0] - 2026-02-17

### Changed
- **Extract `useScrollReveal` hook** — New `src/hooks/useScrollReveal.js` replaces 6 identical IntersectionObserver copy-paste blocks across VideoSpotlight, ProductionPulse, CollabWeb, and EraTimeline. Accepts ref and threshold, fires once, auto-disconnects
- **Extract `useBodyScrollLock` hook** — New `src/hooks/useBodyScrollLock.js` replaces 3 duplicated body overflow toggle effects across TheaterMode, ArtistPanel, and PhotoGallery
- **Deduplicate CollabWeb color palette** — Replaced local `NEON` array with canonical `NEON_COLORS` import from `videoData.js`, eliminating a drifted copy missing `#ff00ff`
- **Remove unused imports** — Cleaned up `useEffect` imports from ProductionPulse and CollabWeb where the hook extraction made them unnecessary

## [3.14.2] - 2026-02-17

### Security
- **Remove `'unsafe-inline'` from CSP `script-src`** — Vite production builds use external module scripts only; `unsafe-inline` was unnecessary and weakened XSS protection. `style-src` retains `unsafe-inline` for React inline styles
- **Harden `openShareWindow` against reverse tabnapping** — Remove configurable `features` parameter; `noopener,noreferrer` is now always enforced, preventing callers from accidentally weakening the security posture
- **Cap search input length at 100 chars** — Both HTML `maxLength` attribute and server-side truncation in `searchAll()` prevent performance abuse via long fuzzy-match queries
- **Disable autocomplete on search input** — Prevents browser credential managers from populating the search field

### Added
- **CSP `unsafe-inline` regression test** — New test in `securityHeaders.test.js` asserts `script-src` never contains `'unsafe-inline'`, preventing future regressions

## [3.14.1] - 2026-02-17

### Added
- **VideoSpotlight tests** (9 tests) — Validates SPOTLIGHT_POOL construction (top-20 by views, sorted descending, valid youtubeIds), sliding-window diversity buffer guarantees (exclusion of recent picks, full 20-video rotation before repeats, graceful fallback on exhausted pool, window trimming at HISTORY_SIZE)
- **CollabWeb tests** (12 tests) — Validates `buildCollabGraph` ft. regex parsing (non-empty output, required fields, multi-artist splitting on comma/ampersand, trimmed names) and `buildNetwork` graph integrity (node structure, descending sort by collabCount, edge→node referential integrity, valid youtubeIds, `2× edges` structural invariant)
- **SectionLabel tests** (8 tests) — Validates prop-driven rendering logic: default span vs h2 element selection, CSS variable passthrough, className composition with proper trimming, text content preservation

## [3.14.0] - 2026-02-17

### Changed
- **Extract `SectionLabel` UI component** — New shared `src/components/ui/SectionLabel.jsx` replaces duplicated "line / text / line" neon divider pattern across VideoSpotlight, CollabWeb, ArtistShowcase, and EraTimeline. Accepts `text`, `color`, and `as` (element type) props with CSS custom property theming (`--label-color`). Eliminates ~55 lines of duplicated CSS and 16 lines of duplicated JSX across four components
- **CSS deduplication** — Removed identical `.{prefix}-label`, `.{prefix}-label-text`, and `.{prefix}-label-line` rule blocks from four component stylesheets. Per-component overrides (margin-bottom, font-size) retained as lightweight single-property rules
- **Barrel export** — `SectionLabel` added to `src/components/ui/index.js` for consistent import patterns

## [3.13.0] - 2026-02-17

### Added
- **Collab Web** — New `CollabWeb` component on the HubPage visualizing artist collaboration networks. Parses `ft.` credits from video titles and descriptions to build an interactive node map of 30+ collaborations across the roster
- **Interactive node filtering** — Click any artist node to highlight their connections and dim unrelated artists. Active state shows collaboration count and linked videos with thumbnails
- **Deep-link integration** — Each collaboration track card links directly to `/videos?v=` for instant playback in the 3D experience
- **Scroll-reveal animation** — Fades in on scroll via IntersectionObserver with full `prefers-reduced-motion` support
- **WCAG accessible** — `aria-pressed` toggle states, `focus-visible` outlines, `role="list"` semantics, descriptive `aria-label` on all interactive elements
- **Responsive design** — Adapts node sizing and thumbnail layout for mobile viewports

## [3.12.3] - 2026-02-16

### Changed
- **Portfolio-grade README refresh** — Corrected 8 stale data points: test count (267→309), test suites (23→26), hook count (10→9 shared + 3 inline), App.jsx line count (~1,040→~1,022), latest changelog reference (v3.11.0→v3.12.2). Expanded project structure tree to show all HubPage components (VideoSpotlight, ProductionPulse, EraTimeline, ArtistShowcase) and added `audioAttenuation` to utils listing. Rewrote Hub Landing Page section from flat bullet list to narrative analytics dashboard description with implementation details (IntersectionObserver, requestAnimationFrame, CSS custom properties, scroll-snap). Added suite count to test badge

## [3.12.2] - 2026-02-16

### Fixed
- **VideoSpotlight StrictMode safety** — Moved history buffer seed from `useState` initializer (impure side effect, double-invoked in StrictMode) into a guarded `useEffect` with `null` sentinel. Prevents potential double-seeding in development and future React concurrent features
- **Shuffle transition guard race condition** — Replaced `isTransitioning` state dependency in `handleShuffle` with a `transitionRef` for instant reads. The `setTimeout` callback previously closed over a potentially stale `isTransitioning` value; ref reads are always current. Also stabilizes `handleShuffle` identity (`[]` deps) so downstream consumers don't re-render on transition toggles

## [3.12.1] - 2026-02-16

### Fixed
- **VideoSpotlight diversity** — Replaced naive `randomIndex()` (only avoided immediate repeat) with a sliding-window history buffer matching the `useShufflePlay` pattern. Users now see all 20 top videos before any repeats, instead of potentially cycling through the same 3–4 picks. History seeds the initial pick so the very first shuffle is always fresh

## [3.12.0] - 2026-02-16

### Added
- **Video Spotlight** — New `VideoSpotlight` component on the HubPage showcasing a featured video from the top 20 most-viewed. Cinematic thumbnail card with play button overlay, vignette gradient, artist name, view count, and year. Clicking navigates to `/videos?v=` deep link for that video
- **Shuffle Pick button** — Rotates the spotlight to a different random top video with a smooth fade transition (no repeats). Disabled during transition to prevent rapid-fire clicks
- **Scroll-reveal animation** — Spotlight fades in and slides up when scrolled into view via IntersectionObserver, with full `prefers-reduced-motion` support
- **Responsive design** — Adapts to mobile with full-width layout and smaller play button
- **WCAG accessible** — Proper `aria-label` on all interactive elements, `focus-visible` outline on shuffle button, section landmark with descriptive label

## [3.11.1] - 2026-02-16

### Added
- **Audio attenuation tests** — 14 tests for `getVolumeFromDistance()` covering quadratic falloff curve, boundary values, monotonicity, integer output, and edge cases (NaN, Infinity, null, negative distances)
- **Production Pulse tests** — 9 tests for `buildYearData()` verifying year aggregation accuracy, chronological sorting, view count totals, artist count per year, and Set cleanup
- **Era Timeline tests** — 14 tests for era computation logic verifying video-to-era assignment, year range boundaries, view sort order, pinned video overrides, contiguous era ranges, and stat accuracy
- **Extracted `audioAttenuation.js`** — Pure audio math extracted from App.jsx into testable utility module

### Fixed
- **Negative distance audio bug** — `getVolumeFromDistance()` now clamps negative distances to 0 (previously produced volume > 80, exceeding YouTube API max). Could occur from floating-point imprecision in 3D distance calculations

## [3.11.0] - 2026-02-16

### Changed
- **Cityscape module extraction** — Extracted 5 tightly-coupled 3D scene components (CNTower, TronBuilding, HighwayArch, DataStream, Cityscape) from monolithic `App.jsx` into dedicated files under `src/components/3d/scene/` with barrel exports. App.jsx reduced from 1,533 → 1,039 lines (32% reduction) with zero behavior changes
- **Cityscape prop injection** — Converted Cityscape from reading module-scoped `TOTAL_DISTANCE` to accepting it via `totalDistance` prop, improving testability and eliminating implicit coupling to App.jsx internals
- **Seeded PRNG hoisted** — Moved the deterministic sin-hash PRNG function to module scope in Cityscape.jsx (was inside useMemo closure), making it reusable and easier to test independently

## [3.10.0] - 2026-02-16

### Added
- **Production Pulse Chart** — New `ProductionPulse` component on the HubPage showing an interactive year-by-year neon bar chart of video production volume. Each bar represents one year (2010–2026) with staggered scroll-reveal animation using IntersectionObserver
- **Hover detail strip** — Hovering or focusing any year bar reveals video count, total views (formatted), and unique artist count for that year via an `aria-live` polite region
- **Keyboard accessible bars** — Each bar is focusable with `role="button"`, proper `aria-label`, and `:focus-visible` outline for WCAG 2.1 compliance
- **Dynamic neon theming** — Bars cycle through the portfolio's NEON_COLORS palette with CSS custom property–driven gradients and `color-mix()` glow shadows
- **Responsive layout** — Chart scales down on mobile (100px height, tighter gaps, smaller labels) with full `prefers-reduced-motion` support

## [3.9.0] - 2026-02-15

### Added
- **Production Era Timeline** — New `EraTimeline` component on the HubPage grouping the 101-video catalog into four distinct eras (Origins 2010–2014, The Rise 2015–2017, Peak Era 2018–2020, New Wave 2021–2026). Each era card shows top video thumbnail, video count, unique artist count, and total views
- **Horizontal scroll era cards** — Swipeable/scrollable card track with scroll-snap alignment, thin custom scrollbar, and per-era color theming (purple → pink → cyan → green)
- **Timeline connector dots** — Visual timeline dots below the cards connecting the eras with color-coded glow effects
- **Scroll-reveal animations** — IntersectionObserver-triggered staggered fade-in for era cards with `prefers-reduced-motion` respect
- **Era top video showcase** — Each era card features the highest-viewed video with thumbnail, title, and view count overlay

## [3.8.3] - 2026-02-15

### Added
- **App.jsx module-level JSDoc** — File header documenting the desktop 3D "Infinite Drive" architecture: ScrollControls → CameraRig → ProximityTracker flow, FilterContext purpose, and Cityscape procedural generation strategy
- **BillboardFrame JSDoc** — Component docs with prop types, explains deceased artist halo logic and artist filter dimming behavior
- **CameraRig JSDoc** — Documents scroll-driven Z-axis movement, lateral lane switching via lerp, and why a ref (not state) is used for targetX to avoid per-frame re-renders
- **ProximityTracker JSDoc** — Explains the every-2nd-frame throttle strategy (30 checks/sec at 60fps) and lane-aware billboard scanning
- **Cityscape JSDoc** — Documents the seeded PRNG (sin-hash trick from GPU shader tradition), why deterministic generation prevents layout shifts, and dynamic building count scaling
- **Scene constants documentation** — Inline rationale for all magic numbers: SCROLL_PAGES divisor, ACTIVE_RANGE, AUDIO_SILENCE_DISTANCE, AUDIO_MAX_VOLUME, CANVAS_GL_OPTIONS, DPR caps, LANE_SWITCH_SPEED
- **getVolumeFromDistance JSDoc** — Parameter types and quadratic easing rationale
- **SearchBar JSDoc** — Component-level docs with prop types, dropdown behavior, and fuzzy-to-substring fallback logic
- **fuzzyScore formula documentation** — Breakdown of the 0.3/0.35/0.35 weighting: base floor, coverage ratio, and consecutive match bonus
- **useScrollReveal JSDoc** — Explains the `deps === null` guard, requestAnimationFrame DOM timing trick, and IntersectionObserver cleanup
- **useSwipe JSDoc** — Documents 50px threshold rationale and return type

## [3.8.2] - 2026-02-14

### Security
- **CSP script-src hardening** — Removed `blob:` from `script-src` directive, closing an XSS amplification vector where injected code could construct executable Blob URLs. `worker-src` retains `blob:` for Three.js Web Workers
- **Permissions-Policy expansion** — Added `usb=(), bluetooth=(), serial=(), hid=(), payment=()` to block hardware/payment API abuse, plus `autoplay=(self)` to restrict autoplay to same-origin only
- **YouTube iframe referrer leak** — Added `referrerPolicy="no-referrer"` to VideoOverlay iframe, preventing deep-link URLs from leaking to YouTube as Referer headers
- **Production source map suppression** — Explicitly set `build.sourcemap: false` in Vite config, preventing original source code exposure in production builds
- **YouTube API script error handling** — Added `crossOrigin="anonymous"` and `onerror` handler to YouTube IFrame API script tag with retry capability on load failure
- **Security header tests** — 5 new tests validating CSP blob: removal, Permissions-Policy hardware API blocks, payment block, and autoplay restriction (267 → 272 tests)

## [3.8.1] - 2026-02-14

### Fixed
- **SearchBar click-outside dismiss** — Desktop search dropdown had no way to close except selecting a result. Added click-outside-to-close and Escape key dismiss with proper event listener cleanup
- **Mobile search Escape key** — Mobile search dropdown now dismisses on Escape key press, matching standard dropdown behavior. Keyboard handler also resets the search query on dismiss
- **Hero card keyboard activation (WCAG 2.1.1)** — Hero card had `role="button"` and `tabIndex={0}` but no `onKeyDown` handler, making it unreachable for keyboard-only users. Added Enter/Space activation with `preventDefault()` to block page scroll on Space
- **Invalid dual ARIA on tabs** — Filter tabs used both `aria-selected` (correct for `role="tab"`) and `aria-pressed` (only valid on toggle buttons). Removed `aria-pressed` from all `role="tab"` elements and the search/filter buttons where it conflicted with `aria-expanded`. Fixes screen reader confusion where tabs were announced as both "selected" and "pressed"

## [3.8.0] - 2026-02-14

### Added
- **Artist Showcase Ticker** — New `ArtistShowcase` component on the HubPage featuring an infinite CSS marquee of top 12 artists with YouTube thumbnails, video counts, and total view stats. Hover to pause, seamless edge-fade masking, fully responsive
- **Animated Stats Counter** — Four count-up stats (Videos, Artists, Total Views, Years Active) with ease-out cubic animation triggered by IntersectionObserver. Gradient text with synthwave glow effect
- **`useCountUp` hook** — requestAnimationFrame-powered count animation with configurable duration and custom formatting

### Changed
- **HubPage** — Now imports and renders ArtistShowcase between the navigation cards and footer, transforming the static landing page into a dynamic portfolio showcase
- README updated with Hub Landing Page feature list, version bumped to v3.8.0

## [3.7.8] - 2026-02-13

### Changed
- **ARCHITECTURE.md refresh** — Fixed stale test count (153 → 267), updated project structure tree to include `3d/vehicles/`, `3d/effects/`, all 9 hooks with descriptions, `formatters.js`, `proceduralTextures.js`, and `secret-scanner.js`. Added `prescan` and `audit:security` to commands reference
- **Security model correction** — Replaced incorrect COEP `credentialless` reference with accurate "No COEP" note explaining it breaks YouTube embeds (matches protected configuration in CLAUDE.md)
- **Vehicle component JSDoc** — Added module-level documentation to TronLightCycle, DeLorean, and CyberBike describing geometry composition, material strategy, and `@param` for the color prop
- **README sync** — Updated test count badges (223 → 267, 19 → 23 suites), version badge to v3.7.8, latest changelog reference

## [3.7.7] - 2026-02-13

### Added
- **useSwipe gesture detection tests** — 13 tests covering the mobile swipe handler's direction detection (left/right), 50px threshold boundary math, and the `changedTouches` null guard added in v3.7.6. Includes full touch lifecycle simulation (start → end) validating callback dispatch
- **main.jsx routing logic tests** — 13 tests covering the `RouteCleanup` legacy deep-link redirect (`/?v=xxx → /videos?v=xxx`), body class cleanup on non-video routes, `VideosRoute` device-based component selection (phone → MobileApp, tablet → App with reduced effects, desktop → App full), and false-positive resistance for the `v=` param detection
- Test count: 241 → 267 (+26 tests across 2 new test files, 23 total test files)

## [3.7.6] - 2026-02-13

### Fixed
- **YouTubePlayer race condition** — Rapid video switching could orphan player instances when `ensureYTApi()` promises resolved after cleanup. Now tracks each effect's player locally and only clears shared refs when they still point to the current instance. Also defers `currentVideoRef` update to `onReady` callback and guards `onStateChange`/`onReady` with `destroyed` flag
- **Theater mode stale closure** — `handleActiveChange` callback captured `theaterMode` state in its closure, but the `useFrame`-based ProximityTracker could read a stale value during rapid toggles. Switched to a `useRef` mirror for instant reads without re-render dependency
- **IntersectionObserver DOM timing** — `useScrollReveal` queried `[data-vid]` elements synchronously before React committed new cards to the DOM after filter/tab changes. Deferred observer setup to `requestAnimationFrame` and added proper per-element `unobserve()` cleanup to prevent observer accumulation
- **Swipe gesture null guard** — Added optional chaining for `e.changedTouches` in mobile swipe handler to prevent `TypeError` on devices where `changedTouches` may be empty

## [3.7.5] - 2026-02-12

### Added
- **videos.json schema validation tests** — 9 tests enforcing raw JSON data integrity: required fields with correct types, unique positive integer IDs, YouTube ID format (`[A-Za-z0-9_-]{11}`), unique YouTube IDs, ISO date format (YYYY-MM-DD), non-negative view counts, non-empty title/artist strings, and schema guard against unexpected fields. Mirrors the established `photos.test.js` pattern
- **isDeceasedArtist + DECEASED_ARTISTS tests** — 9 tests covering the deceased artist detection logic: Set integrity, cross-reference validation (every deceased name appears in at least one video), comma-separated multi-artist parsing, whitespace trimming, null/undefined/empty guards, partial name rejection (no substring matching), and case sensitivity. Protects the golden halo billboard feature from silent regressions
- Test count: 223 → 241 (+18 tests across 2 new test files)

## [3.7.4] - 2026-02-12

### Changed
- **Portfolio-grade README overhaul** — Restructured README.md from feature-dump format to experience-first showcase. Added shields.io badges (live site, video count, test count, version), reorganized features into Desktop/Mobile/Hub experience sections, replaced artist bullet list with formatted table, added Tech Stack and Architecture Highlights tables, added project structure map with annotations, consolidated inline changelog into a link to CHANGELOG.md (eliminated ~160 lines of duplication). README now reads as a portfolio piece rather than a development log

## [3.7.3] - 2026-02-12

### Security
- **Secret-proof `.gitignore`** — Added `.env`, `.env.*`, `.env.local`, `.env.production` patterns to prevent accidental credential commits. No `.env` files exist today (API key loaded from Vercel environment), but this blocks future accidents
- **Secret scanner script** — New `scripts/scan-secrets.js` scans source files for 10 high-confidence credential patterns (AWS keys, GitHub tokens, private keys, database URIs, etc.). Zero dependencies, supports `--staged` flag for pre-commit hooks. Run via `npm run prescan`
- **Dependency audit script** — New `npm run audit:security` command runs `npm audit --audit-level=high` for CI/build-time vulnerability scanning
- **Full security audit** — Verified: no secrets in git history, no `.env` files on disk, 0 npm vulnerabilities, all security headers enforced (CSP, HSTS, COOP, CORP), 55 security-focused tests passing, YouTube ID validation at all 5 entry points, localStorage hardened with 6 guards

## [3.7.2] - 2026-02-12

### Changed
- **Extract 3D effects from App.jsx** — Moved StarField (39 lines) and SynthwaveSun (22 lines) into `src/components/3d/effects/` with barrel export, following the established `3d/vehicles/` pattern
- **Remove dead Phase 1 components** — Deleted FloatingParticles (73 lines), LaserBeams (43 lines), and NebulaClouds (18 lines) which were superseded by Phase 2 atmosphere components (SoftParticles, EnhancedStarField, ProceduralNebula) but never cleaned up
- **Remove dead imports** — Cleaned up unused GroundFog, DistanceHaze, ProceduralNebula imports from App.jsx (imported but never rendered in Scene)
- **Fix duplicate comment header** — Removed stale "CN Tower - Toronto landmark" comment that duplicated the current "CN Tower - Tron Energy Spire" header
- App.jsx reduced from 1648 → 1435 lines (−213)

## [3.7.1] - 2026-02-12

### Changed
- **Extract UI overlays from App.jsx** — Moved SearchBar (84 lines), PortfolioStats (42 lines), and VideoOverlay (76 lines) into `src/components/ui/` as standalone modules with barrel exports. Reduces App.jsx from 1895 → 1647 lines (-248). Each component now owns its own imports (videoData, youtube utils, formatters, useCopyLink) — no dependency on parent scope
- **New `useKeyboardShortcuts` hook** — Consolidated 3 identical `useEffect` keyboard handlers (F, ?, S) into a single declarative hook that takes a key→action map. Eliminates duplicated input-field guard logic and reduces App.jsx by an additional 25 lines. Single `keydown` listener instead of 3
- **Dead import cleanup** — Removed unused `VIDEOS`, `ALL_ARTISTS`, `ARTIST_STATS`, `PORTFOLIO_STATS`, `formatViews`, `searchAll`, `isValidYouTubeId`, `useCopyLink` imports and dead `PROJECTS` constant from App.jsx
- **8 new tests** (223 total) — Keyboard shortcut dispatch logic: key mapping, case-insensitive matching, INPUT/TEXTAREA guard, unmapped key rejection, special characters, multi-handler dispatch, non-input element passthrough

## [3.7.0] - 2026-02-12

### Added
- **Shuffle play** — Discover random videos with a single tap/click. Available on both mobile (dice button in filter tabs) and desktop (SHUFFLE button in UI overlay, or press `S`). Uses a sliding-window history to avoid repeating the last 10 picks, ensuring genuine discovery across the 101-video catalog
- **New hook** — `useShufflePlay` in `hooks/` with configurable history size, sliding-window no-repeat logic, and automatic pool reset when history exhausts catalog
- **6 new tests** (215 total) — Covers selection validity, no-repeat guarantees, diversity across multiple calls, graceful history exhaustion, sliding window maintenance, and null safety
- **Keyboard shortcut `S`** — Shuffles to a random video and opens theater mode (desktop). Added to KeyboardGuide shortcuts list

## [3.6.1] - 2026-02-12

### Changed
- **Extract vehicle components from App.jsx** — Moved TronLightCycle (136 lines), DeLorean (48 lines), CyberBike (55 lines), and Vehicle selector into `src/components/3d/vehicles/` with individual files and barrel export. Reduces App.jsx from 2138 → 1862 lines (−276). Removed dead `VEHICLES` constant that was never referenced. No behavior changes — pure structural refactor

## [3.6.0] - 2026-02-12

### Added
- **Keyboard shortcuts guide** — Press `?` anywhere to toggle a modal showing all keyboard shortcuts (lane switching, theater mode, navigation, video playback). Matches existing overlay/glassmorphism design language with synthwave-styled `<kbd>` keys, context labels, and responsive layout. Integrated into both desktop 3D (`App.jsx`) and mobile grid (`MobileApp.jsx`) experiences. Closes on `Esc` or backdrop click
- **New UI component** — `KeyboardGuide` added to `components/ui/` with dedicated CSS, exported via barrel (`index.js`)

## [3.5.3] - 2026-02-12

### Added
- **Unit tests for shared hooks** — 32 new tests (209 total, up from 177) covering the three hooks extracted in v3.5.1:
  - `useVideoNavigation` (14 tests) — Circular next/prev index math, wrap-around boundaries, single-item lists, empty/null edge cases. Extracted `findVideoIndex`, `getNextIndex`, `getPrevIndex` as named exports for direct testing
  - `useVideoDeepLink` (14 tests) — Deep-link resolution (`?v=` → video lookup), XSS rejection, invalid/too-short/too-long IDs, empty catalog, URL building for history sync, fallback URL extraction
  - `useCopyLink` (4 tests) — Clipboard write with mocked `navigator.clipboard`, null video guard, share URL generation

### Changed
- **Refactored hooks for testability** — Extracted pure logic from `useVideoNavigation` and `useVideoDeepLink` into named-exported functions (following existing `getDeviceType`/`readFavorites` pattern), keeping React hook wrappers thin

## [3.5.2] - 2026-02-12

### Fixed
- **Stale portfolio counts across SEO metadata** — Updated hardcoded "87 videos, 49 artists" to actual "101 videos, 54 artists" in 7 locations: `index.html` meta description, Open Graph, Twitter Card, LocalBusiness JSON-LD, ProfilePage JSON-LD, VideoObject ItemList `numberOfItems`, and `manifest.json` PWA description. Also corrected "53 artists" → "54 artists" in README.md (4 locations) and "87 entries" / "49 artists" in `docs/ARCHITECTURE.md` (3 locations). These counts drifted as videos were added in v3.2.0–v3.3.0 without updating the static metadata

## [3.5.1] - 2026-02-12

### Changed
- **Extract shared hooks** — Pulled duplicated logic out of App.jsx (2176 lines) and MobileApp.jsx (562 lines) into three reusable hooks:
  - `useVideoDeepLink` — URL deep-link read (`?v=`) on mount + URL sync as active video changes. Replaces ~30 lines of duplicated `useEffect` logic
  - `useVideoNavigation` — Circular next/prev navigation over a video list with memoized index tracking. Replaces ~20 lines duplicated across desktop lane navigation and mobile filtered list navigation
  - `useCopyLink` — Clipboard copy with 2-second "copied" indicator and auto-reset on video change. Replaces ~12 lines duplicated in VideoOverlay (desktop) and MobileApp (mobile)
- **Cleaner imports** — Removed unused `getShareUrl` import from App.jsx, unused `isValidYouTubeId`/`useCallback` imports from MobileApp.jsx
- **Net reduction** — ~62 lines of duplicated imperative code replaced by 3 focused hooks (~65 lines total), establishing reusable primitives for future features

## [3.5.0] - 2026-02-11

### Added
- **Fuzzy search across artists & video titles** — Search now matches video titles (e.g. "Freestyle", "Glock") in addition to artist names. Custom zero-dependency fuzzy scoring algorithm handles typos via subsequence matching (e.g. "Msicka" finds "Masicka"). Results ranked by relevance with popular artists/videos weighted higher
- **Unified search hook** (`src/hooks/useSearch.js`) — Shared `searchAll()` and `fuzzyScore()` utilities used by both desktop SearchBar and mobile search. Returns categorized `{ artists, videos }` results capped at 8 video matches for UI clarity
- **Search result sections** — Dropdown now shows "VIDEOS" and "ARTISTS" sections when video title matches are found. Clicking a video result directly opens playback (desktop: activates billboard, mobile: opens modal)
- **13 new unit tests** for fuzzy scoring edge cases and search behavior (177 total, up from 164)

## [3.4.0] - 2026-02-11

### Changed
- **Extract shared formatters module** — Consolidated `formatViews`, `formatYear`, and `formatDate` from 3 separate files (App.jsx, MobileApp.jsx, VideoCard.jsx) into `src/utils/formatters.js`. Eliminates triple-maintained formatting logic and aligns with existing `src/utils/` convention
- **App.jsx** — Removed inline `formatNumber` (duplicate of `formatViews`), now imports from shared module
- **MobileApp.jsx** — Removed inline `formatViews`, now imports from shared module
- **VideoCard.jsx** — Removed 33 lines of inline formatter definitions, now imports from shared module
- **Test consolidation** — MobileApp.test.js no longer re-implements `formatViews` locally; imports from shared module. New `formatters.test.js` provides canonical unit tests (164 total tests, up from 153)

## [3.3.1] - 2026-02-11

### Fixed
- **Hero card thumbnail (mobile)** — Switched from `maxresdefault` to `hqdefault` thumbnail. YouTube returns a tiny 120x90 placeholder (HTTP 200) when `maxresdefault` doesn't exist, so `onError` never fires. `hqdefault` (480x360) is always available
- **Theater mode crash ("3D rendering failed")** — ProximityTracker was overwriting `activeProject` every animation frame, racing with theater mode navigation. Added `theaterMode` guard to `handleActiveChange` so proximity detection pauses during theater/fullscreen playback. Also fixes the wrong-video-on-fullscreen bug (same root cause)
- **RoadKidd "Back 2 Work" missing from popular lane** — Video has 58K views, threshold was 60K. Lowered `popularThreshold` from 60,000 to 55,000
- **Desktop video controls** — VideoOverlay iframe had `controls=0`, preventing scrubbing/seeking outside fullscreen. Changed to `controls=1`
- **Null safety for `isDeceasedArtist()`** — Added guard for undefined `artist` field to prevent TypeError

## [3.3.0] - 2026-02-11

### Added
- **Golden angel halos (desktop)** — Deceased artists (Murda, BG) honored with golden torus halo above their 3D billboards, golden border bars, and ambient golden pointLight. Double-torus technique (solid ring + transparent bloom ring) with `toneMapped={false}` creates ethereal glow through Bloom post-processing. `isDeceasedArtist()` helper handles multi-artist strings like "BG, Banks, LV, Arez, FreshBoy"
- **Artist Panel (mobile)** — Wired `ArtistPanel` component into mobile experience. Tap artist name in video modal to open bottom-sheet panel showing all videos by that artist with stats. `mobileModal` prop bumps z-index above the modal overlay (1001/1000)
- **Mobile floating particles** — 15 CSS-only particles (8 cyan, 7 pink) drifting upward with staggered durations (12-20s) and delays. Respects `prefers-reduced-motion: reduce`
- **Mobile scanline overlay** — Subtle 4px repeating gradient scrolling downward over 8s. Respects `prefers-reduced-motion: reduce`
- **Card entrance animations** — `useScrollReveal` hook (IntersectionObserver, threshold 0.1, rootMargin 50px) triggers `card-reveal` animation. Right column staggered 100ms via inline `animationDelay`
- **Hero card (mobile)** — Full-width featured video card above the grid with `hqdefault` thumbnail, gradient overlay, "LATEST"/"MOST POPULAR" label, and PLAY button. Only renders when not searching/filtering; grid shows `slice(1)` to avoid duplicate
- **Swipe gestures (mobile)** — `useSwipe` hook detects left/right touch gestures (>50px threshold) on modal content div. Swipe left = next video, swipe right = previous
- **Card glassmorphism** — `backdrop-filter: blur(8px)` on `.video-card` for frosted glass effect
- **Badge glow pulse** — `.card-views-badge` animates box-shadow cyan glow on 2s cycle
- **Now-playing pulse** — `.video-card.now-playing` gets animated cyan box-shadow pulse (2s cycle)
- **Video #101** — Big Surp ft. Cutthroat - New Glock 30 (54K views)

## [3.2.0] - 2026-02-11

### Added
- **13 new music videos** (IDs 88–100) — Dundas Dolla (Yuck, Foreign Cars Remix), Arez ft. BG (Hug The 3's), M & Hypa (The Ride), Cboz (Making Sales), Jr Tuffy (Trap Talk), JoJizzle (Check A Bag), Scooby Blacks (Ya Know), Young Blitz (Resume), Daz Dinero (Rockstar), M-Dot (I Don't Trust), Da Kid Bluntz (Back to Back Freestyle), K Getta (Who Dat). Portfolio now at **100 videos, 53 artists**
- **Protected configuration section** in CLAUDE.md — Prevents automated agents from re-adding COEP headers, iframe sandbox, or unlocking Photography page
- **Guard test** — `securityHeaders.test.js` now asserts COEP is absent, blocking accidental re-addition

### Fixed
- **YouTube video playback** — Removed `Cross-Origin-Embedder-Policy: credentialless` header from `vercel.json` and `sandbox` attribute from YouTube iframe in `App.jsx`. COEP was blocking YouTube embed credentialed requests (same issue as v2.2.7 fix, re-introduced in v3.0.3)
- **Photography page re-locked** — Reverted HubPage to "Coming Soon" locked state and disabled `/photos` route. Passion Agent had re-enabled it in v3.1.0

## [3.1.1] - 2026-02-11

### Added
- **Architecture documentation** — Comprehensive `docs/ARCHITECTURE.md` covering system overview (ASCII diagrams), project structure, routing & code-splitting table, data flow pipeline, state management patterns, security model (headers, input validation, caching), setup & dev commands, deployment pipeline, testing matrix, and key architecture decisions with rationale
- **README docs section** — New "Documentation" section linking to architecture guide

## [3.1.0] - 2026-02-11

### Added
- **Photography Gallery live** — Unlocked the `/photos` route, replacing the redirect-to-home with the full `PhotoGallery` component (25 photos, 4 categories, lightbox viewer, lazy loading, keyboard navigation). The gallery was fully built and tested in v3.0.0 but blocked behind a `<Navigate>` redirect; now accessible from the hub landing page
- **Hub Photography card active** — Converted the "Coming Soon" locked button into a live `<Link to="/photos">` with "25 PHOTOS — 4 CATEGORIES" subtitle and matching "ENTER →" CTA, consistent with the Music Videos card

### Changed
- **Hub simplification** — Removed `useState` hook, toast notification, and locked card state from `HubPage.jsx` (component is now stateless). Removed corresponding CSS (~45 lines: locked card styles, toast animation)
- **Route architecture** — `/photos` route now lazy-loads `PhotoGallery` directly instead of redirecting to `/`. Removed unused `Navigate` import from `react-router-dom`

## [3.0.5] - 2026-02-11

### Added
- **17 PhotoGallery logic tests** — New `PhotoGallery.test.js` covers `getPhotoSrc` path construction (per-category, full dataset validation), category filtering (all/individual, count summation, CATEGORIES↔CATEGORY_DIRS consistency), lightbox prev/next wrap-around navigation (forward/backward cycling, single-item edge case, full-cycle return), and data consistency checks (total count, non-empty tabs)
- **9 imageFallback utility tests** — New `imageFallback.test.js` validates SVG data URI structure (format, 320×180 16:9 dimensions, play triangle, "No Preview" text), synthwave theme colors (#0a0a1a background, #ff6ec7 pink play icon), self-containment (no external references beyond SVG namespace), XSS safety (no script tags or event handlers), and HTML attribute compatibility
- **Tests** — 153 total (up from 127): 17 PhotoGallery logic tests + 9 imageFallback tests, covering two previously untested modules

## [3.0.4] - 2026-02-11

### Fixed
- **Production build failure** — `react-router-dom` was declared in `package.json` but missing from `node_modules`, causing Rollup to fail on `npm run build`. Ran `npm install` to sync the dependency tree; build now succeeds and outputs all chunks correctly
- **Broken thumbnail fallback** — VideoCard and MobileApp related-video thumbnails had no `onError` handler, showing the browser's default broken-image icon when YouTube thumbnails failed to load (deleted videos, private videos, CDN issues). Added SVG data-URI fallback placeholder with synthwave-styled play icon and "No Preview" text

### Added
- **`imageFallback.js` utility** — Shared 16:9 SVG data-URI thumbnail placeholder used by VideoCard and MobileApp; inline data URI prevents cascading load failures

## [3.0.3] - 2026-02-11

### Security
- **Cross-Origin-Embedder-Policy header** — Added `credentialless` COEP header to vercel.json, completing the Spectre-class isolation trifecta (COOP + CORP + COEP). Uses `credentialless` instead of `require-corp` to remain compatible with YouTube embeds and Google Fonts. Previously removed in v2.3.0 when `same-origin` broke embeds; `credentialless` solves this
- **Desktop iframe embed guard** — Added `isValidYouTubeId()` check before rendering the desktop video overlay iframe in App.jsx, preventing requests to `youtube.com/embed/` with empty or invalid IDs. Matches the existing guard pattern in YouTubePlayer.jsx (defense-in-depth)
- **index.html Cache-Control hardened** — Changed from `public, max-age=0, must-revalidate` to `no-cache, no-store, must-revalidate`, ensuring browsers never serve stale HTML with outdated CSP or security headers

### Added
- **13 security header tests** — New `securityHeaders.test.js` validates vercel.json headers at test time: CSP enforcement (not report-only), HSTS with preload, X-Frame-Options DENY, COEP credentialless, COOP, CORP, Permissions-Policy, X-Permitted-Cross-Domain-Policies, CSP directives (object-src, frame-ancestors, upgrade-insecure-requests), index.html no-store cache, and immutable asset caching (127 total tests, up from 114)

## [3.0.2] - 2026-02-11

### Added
- **9 photo data integrity tests** — New `src/data/photos.test.js` validates photos.json schema: required fields, unique IDs/filenames, valid categories, .webp extension enforcement, ID prefix convention (p/a/e/s), category coverage, and schema guard against unexpected fields
- **5 lane processing tests** — Extended `videoData.test.js` with Z-position spacing formula verification, Y-height consistency, neon color palette cycling, popular lane ID uniqueness (`popular-{id}` format), and popular-lane subset validation
- **Tests** — 114 total (up from 100): 9 photo data tests + 5 lane position/metadata tests

## [3.0.1] - 2026-02-10

### Security
- **Cross-Origin-Resource-Policy header** — Added `cross-origin` CORP header to vercel.json, restoring Spectre-class isolation that was removed in v2.3.0 (previously `same-origin` which blocked YouTube embeds; `cross-origin` is compatible with third-party embeds)
- **X-Permitted-Cross-Domain-Policies header** — Added `none` to block Flash/Acrobat cross-domain policy lookups, preventing legacy plugin exploitation
- **Social share host allowlist** — New `openShareWindow()` utility validates target hostname against an allowlist (twitter.com, x.com, wa.me, api.whatsapp.com) before opening popups, preventing open redirect if share URLs are ever constructed from untrusted input. Replaces raw `window.open()` in MobileApp and TheaterMode
- **Build-time YouTube ID validation** — `fetch-youtube-data.js` now validates all video IDs against the 11-char YouTube pattern and checks for duplicates before processing, catching data corruption before it reaches the client bundle

### Added
- **5 new `openShareWindow` tests** — Covers allowed hosts, blocked hosts (open redirect), javascript:/data: protocols, malformed URLs, and feature string passthrough (100 total tests, up from 95)

## [3.0.0] - 2026-02-10

### Added
- **Hub Landing Page** — New `HubPage` component at `/` with two-card navigation linking to Music Videos (`/videos`) and Photography (`/photos`) sections. Synthwave aesthetic with animated gradient borders and backdrop blur
- **Photography Gallery** — New `PhotoGallery` component at `/photos` with 25 curated photos across 4 categories (Portraits, Artist/Music, Events, Street). Features category tab filtering, lightbox modal with prev/next navigation, keyboard support (Escape, Arrow keys), and IntersectionObserver-based lazy loading
- **Photo Data** — `src/data/photos.json` with 25 entries containing title, category, subject, description, and camera metadata
- **25 Optimized Photos** — WebP images in `public/photos/` organized by category subdirectories (portraits, artist, events, street). Source photos resized to max 2000px width and converted from JPG to WebP
- **Client-Side Routing** — Added `react-router-dom` v7.13.0 with `BrowserRouter`, three lazy-loaded routes, and `RouteCleanup` component for body class management
- **Legacy Deep Link Redirect** — `/?v=youtubeId` at root automatically redirects to `/videos?v=youtubeId`
- **ImageGallery Schema** — JSON-LD structured data for the photography section
- **SPA Rewrites** — Vercel config updated with rewrites for `/videos` and `/photos` to `index.html`
- **Sitemap Routes** — Added `/videos` and `/photos` to sitemap.xml; updated all video deep links from `/?v=` to `/videos?v=`

### Changed
- **Root Route** — `/` now renders `HubPage` instead of the video experience directly. Music videos moved to `/videos`
- **Title & Meta** — Updated to "TdotsSolutionsz — Toronto Creative Production | Music Videos & Photography"
- **Open Graph** — Updated descriptions to include photography portfolio
- **Version** — Major bump from 2.4.0 to 3.0.0 (new navigation architecture, new section)

### Dependencies
- Added `react-router-dom` ^7.13.0

## [2.4.0] - 2026-02-10

### Added
- **Portfolio Stats Dashboard** — New stats overlay on desktop (click "STATS" button, bottom-right) showing total videos, artists, aggregate view count, year range, and top artist by views. Mobile shows a compact stats banner below the header with video count, artist count, and total views
- **`PORTFOLIO_STATS` export** — Pre-computed aggregate portfolio metrics in `videoData.js` (totalVideos, totalArtists, totalViews, earliestDate, latestDate, topArtist), shared between desktop and mobile via the existing single-source-of-truth pattern
- **4 new PORTFOLIO_STATS tests** — Verifies totalVideos/totalArtists match source, totalViews equals sum, date range covers all videos, topArtist has highest views (95 total tests, up from 91)

## [2.3.2] - 2026-02-10

### Security
- **`extractVideoId()` origin guard** — Replaced naive `split('v=')` parser with `new URL()` + hostname whitelist, so only YouTube-origin URLs (`youtube.com`, `youtu.be`, `m.youtube.com`, `music.youtube.com`) are accepted. Previously, `https://evil.com/watch?v=dQw4w9WgXcQ` would extract a valid ID; now it returns empty string. Also adds support for `youtu.be/ID` short links
- **`toggleFavorite()` write-side validation** — Added `isValidYouTubeId()` guard before writing to localStorage, preventing invalid strings from being persisted even if a caller passes unsanitized input. Read-side validation already existed but defense-in-depth requires validating at the boundary

### Added
- **URL origin guard tests** — 4 new tests: non-YouTube origins rejected even with valid `v=` IDs, `youtu.be` short links accepted, `m.youtube.com`/`music.youtube.com` accepted, `youtu.be` with XSS payloads rejected (91 total tests, up from 87)

## [2.3.1] - 2026-02-10

### Fixed
- **YouTubePlayer cleanup on invalid videoId** — Restructured `useEffect` so the cleanup function (which destroys the iframe player) always runs on unmount/re-render, even when `videoId` is invalid. Previously, an early `return` skipped cleanup entirely, which could leak iframes and event listeners if a valid videoId transitioned to invalid
- **App crash on WebGL failure** — Added `AppErrorBoundary` in `main.jsx` wrapping the root `<ResponsiveApp>`. If Three.js or the GPU driver crashes, users now see a styled fallback with a reload button instead of a blank white screen

### Changed
- **Removed unused `react-player` dependency** — The project uses a custom `YouTubePlayer` component via the IFrame API; `react-player` was listed in `package.json` but never imported, adding unnecessary install weight

## [2.3.0] - 2026-02-10

### Added
- **CN Tower at start of journey** — Duplicate CN Tower landmark placed at the beginning of the drive (z=-100, around the 3rd-4th billboard), so Toronto bookends the entire experience — one tower greeting you at the start, one waiting at the end

### Fixed
- **YouTube embeds broken** — Removed `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Resource-Policy: same-origin` headers that were blocking YouTube iframes from loading (showed "refused to connect"). These headers are designed for sites needing `SharedArrayBuffer`, not portfolio sites with embedded videos
- **Three.js 3D scene not rendering** — Added `blob:` to CSP `script-src` directive so Three.js Web Workers can load via `importScripts()`. Without this, all 24 workers failed silently and the 3D cityscape was invisible
- **3D text labels missing** — Added `cdn.jsdelivr.net` and `fonts.gstatic.com` to CSP `connect-src` so Troika (used by drei's `Text` component) can fetch font data inside Web Workers. Font `fetch()` calls in workers are governed by `connect-src`, not `font-src`

## [2.2.8] - 2026-02-10

### Security
- **Thumbnail URL consolidation** — Replaced 2 inline `img.youtube.com/vi/${id}/...` template literals in `VideoCard.jsx` and `MobileApp.jsx` with validated `getThumbnailUrl()` calls, closing a path where a tampered `youtubeId` property could inject arbitrary URLs into `<img src>` attributes
- **YouTubePlayer videoId guard** — Added `isValidYouTubeId()` check before initializing YouTube IFrame API, preventing invalid or malicious strings from reaching the API as a defense-in-depth measure
- **README security claims corrected** — Removed inaccurate CORP + COEP claims from README; these headers were removed in v2.2.3 to unblock YouTube embeds

### Added
- **Consolidated thumbnail tests** — 4 new tests verifying `getThumbnailUrl()` produces correct URLs for VideoCard (mqdefault) and MobileApp (default) callers, and blocks injection payloads in both contexts

## [2.2.7] - 2026-02-10

### Added
- **Procedural texture tests** — 14 tests covering all 4 texture generators (`createSoftCircleTexture`, `createHexBokehTexture`, `createStreakTexture`, `createDustTexture`) with Canvas 2D API mocking: gradient creation, color stops, composite operations, hexagonal drawing, canvas dimensions, and `needsUpdate` flag
- **MobileApp logic tests** — 17 tests covering video filtering (`latest`/`popular`/`favorites` tabs with artist filter combos), artist search (case-insensitive partial matching, empty/no-match), related videos (same-artist exclusion, 4-item cap, view-count sort, solo-artist edge case), and `formatViews` formatter (M/K/raw thresholds)

## [2.2.6] - 2026-02-10

### Security
- **Deep link `?v=` validation** — Both `App.jsx` and `MobileApp.jsx` now validate the `?v=` URL parameter through `isValidYouTubeId()` before use, preventing crafted URLs with XSS payloads from being written back to the address bar via `replaceState`
- **`getShareUrl()` injection fix** — Share URL builder now validates the video ID before embedding into the URL template, closing a path where a malformed `youtubeId` property could inject arbitrary content into share links and clipboard output
- **Iframe `sandbox` attribute** — Desktop VideoOverlay YouTube embed now includes `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"`, restricting the iframe to minimum required capabilities
- **`noopener,noreferrer` on popups** — All `window.open()` calls for X/Twitter and WhatsApp sharing (TheaterMode + MobileApp) now include `noopener,noreferrer` to prevent reverse tabnabbing and Referer header leakage

### Added
- **Share URL tests** — 3 new tests for `getShareUrl()` covering youtubeId preference, URL fallback, and XSS payload rejection
- **Deep link validation tests** — 2 new tests verifying that common XSS payloads are rejected by `isValidYouTubeId()` in the deep link context, and that real video IDs from the dataset pass validation

## [2.2.5] - 2026-02-10

### Added
- **JSDoc documentation** — Added comprehensive JSDoc with `@param`, `@returns`, and `@module` annotations to `VideoCard.jsx` (component props + 3 formatter functions), `useFavorites.js` (module doc, hook return type, security-relevant `readFavorites`/`writeFavorites` docs), `main.jsx` (module doc, lazy-load chunk descriptions, component docs), `useDeviceType.js` (`getDeviceType` pure function + hook return type), and `useFresnelMaterial.js` (`createRimGlowMaterial` params/return)

## [2.2.4] - 2026-02-10

### Added
- **VideoCard formatter tests** — 11 tests covering `formatViews` (K/M boundary thresholds), `formatYear` (ISO date parsing), and `formatDate` (relative time: days/weeks/months/years with fake timers)
- **Fresnel material tests** — 7 tests covering `updateFresnelMaterial` null-safety guards and `createRimGlowMaterial` construction (blending, transparency, shader content, uniform initialization)
- **Exported VideoCard helpers** — `formatViews`, `formatYear`, `formatDate` now exported with `@internal` annotation for testability

## [2.2.3] - 2026-02-10

### Security
- **Cross-Origin-Embedder-Policy** — Added `credentialless` COEP header, completing the Spectre isolation trifecta (COOP + CORP + COEP) while remaining compatible with YouTube embeds and thumbnail images
- **CSP `upgrade-insecure-requests`** — Added directive to auto-upgrade any HTTP subresource requests to HTTPS, providing defense-in-depth alongside HSTS
- **`getThumbnailUrl()` input validation** — Now validates videoId against the YouTube ID pattern and restricts quality parameter to a whitelist of 5 valid presets, preventing URL path injection via crafted quality strings
- **localStorage favorites hardening** — `readFavorites()` now validates that parsed data is an array, filters entries through `isValidYouTubeId()`, and caps at 500 items to prevent storage abuse, prototype pollution via crafted JSON, and XSS via tampered localStorage

### Added
- **Favorites validation tests** — 6 new tests covering localStorage corruption, prototype pollution guard, XSS filtering, and storage cap enforcement
- **Thumbnail URL injection tests** — 3 new tests for invalid videoId rejection and quality parameter path traversal prevention

## [2.2.2] - 2026-02-09

### Added
- **Test infrastructure** — Added Vitest test framework with `npm test` and `npm run test:watch` scripts
- **YouTube utility tests** — 11 tests covering `isValidYouTubeId`, `extractVideoId`, and `getThumbnailUrl`, including XSS/injection prevention assertions
- **Video data tests** — 6 tests verifying video data integrity (unique IDs, valid dates, artist stats accuracy) and lane processing (chronological sorting, popular threshold filtering, position assignments)
- **Device type tests** — 4 tests for responsive breakpoint classification (`getDeviceType`) with boundary value coverage at 768px and 1024px

## [2.2.1] - 2026-02-09

### Security
- **YouTube ID validation** — `extractVideoId()` now validates extracted IDs against the strict 11-character YouTube ID pattern (`[A-Za-z0-9_-]{11}`), rejecting malformed `?v=` deep link parameters that could inject arbitrary strings into share URLs and clipboard output
- **Cross-Origin-Resource-Policy header** — Added `same-origin` CORP header via Vercel to prevent cross-origin hotlinking of site assets and mitigate Spectre-class side-channel data leaks
- **Font stylesheet CORS** — Added `crossorigin="anonymous"` to Google Fonts stylesheet link for consistent cross-origin resource handling alongside existing preconnect directives

## [2.2.0] - 2026-02-09

### Changed
- **Extracted shared video data module** — Created `src/utils/videoData.js` as single source of truth for video processing, artist stats, lane configuration, and neon colors; eliminates 30 lines of duplicated logic between App.jsx and MobileApp.jsx
- **Extracted YouTube utilities** — Created `src/utils/youtube.js` with `extractVideoId()`, `getShareUrl()`, and `getThumbnailUrl()` helpers; replaces 6+ inline `url.split('v=')[1]?.split('&')[0]` patterns across App.jsx, MobileApp.jsx, and TheaterMode.jsx
- **Refactored App.jsx imports** — Replaced 75 lines of inline data processing with imports from shared modules
- **Refactored MobileApp.jsx imports** — Replaced 30 lines of duplicated data processing (including try/catch wrapper) with imports from shared modules
- **Refactored TheaterMode.jsx share buttons** — Replaced 4 inline YouTube ID extractions with `extractVideoId()` and `getShareUrl()` calls

## [2.1.4] - 2026-02-09

### Fixed
- **COOP breaking social sharing & YouTube** — Changed `Cross-Origin-Opener-Policy` from `same-origin` to `same-origin-allow-popups`; `same-origin` severed cross-origin popup communication, silently breaking X/Twitter and WhatsApp share buttons in both mobile modal and desktop theater mode, and could interfere with YouTube IFrame API initialization

## [2.1.3] - 2026-02-09

### Security
- **CSP enforced** — Switched from `Content-Security-Policy-Report-Only` to enforcing `Content-Security-Policy`; policy now actively blocks unauthorized scripts, styles, and connections
- **Removed `unsafe-eval`** — Eliminated `eval()` and `new Function()` from allowed script sources, blocking code injection attacks (Three.js WebGL shaders use `compileShader`, not JS eval)
- **Tightened CSP whitelist** — Removed `googletagmanager.com` and `google-analytics.com` from `script-src`, `connect-src`, and `img-src` (dead GA4 placeholder removed)
- **X-Frame-Options DENY** — Changed from `SAMEORIGIN` to `DENY` to prevent all iframe embedding (clickjacking protection)
- **`frame-ancestors 'none'`** — Added CSP v2 clickjacking protection alongside X-Frame-Options for full browser coverage
- **Cross-Origin-Opener-Policy** — Added `same-origin` header to prevent cross-origin window.opener attacks (Spectre, tabnabbing)

### Removed
- **GA4 placeholder** — Removed non-functional `G-XXXXXXXXXX` Google Analytics script and GTM DNS prefetch that widened attack surface for zero benefit

## [2.1.2] - 2026-02-07

### Changed
- **Building body color** — Dark body material `#06060f` → `#0a1228` (dark cobalt blue) so buildings read as solid forms against the void instead of invisible wireframes
- **Rooftop caps on all buildings** — Added subtle emissive plane on top of every building type, not just towers. Defines where buildings end and catches bloom for soft rooftop halos

## [2.1.1] - 2026-02-07

### Fixed
- **Mobile blank screen on "next"** — Removed explicit `muted` prop from YouTubePlayer that broke unmount/remount cycle on iOS/Android
- **Desktop video playback** — Switched CSP from enforcing to report-only mode; enforcing policy was blocking YouTube IFrame API resources

### Changed
- **VideoCard rendering** — Moved `currentIdx` computation outside `.map()` to eliminate O(n^2) `findIndex` calls
- **CSP header** — `Content-Security-Policy` → `Content-Security-Policy-Report-Only` (will re-enforce after auditing violations)

## [2.1.0] - 2026-02-07

### Added
- **Now Playing indicator** — Animated equalizer badge on currently playing video card with cyan glow border
- **Up Next indicator** — Pink badge on the next video in the queue
- **Queue position display** — "Now Playing (3/87)" counter and "Up Next: Song Title" preview in mobile modal and desktop theater mode
- **Social sharing buttons** — X/Twitter and WhatsApp share in mobile player modal and desktop theater mode
- **Copy link button** — Quick-copy video URL in theater mode
- **LocalBusiness schema** — JSON-LD with Toronto geo-coordinates, 80km GTA service area, business category
- **VideoObject ItemList schema** — Top 5 videos with view counts, thumbnails, upload dates, production company attribution
- **Geo-targeted meta tags** — `geo.region=CA-ON`, `geo.placename=Toronto`, `ICBM=43.6532,-79.3832`
- **Toronto SEO keywords** — Title updated to "Toronto Music Video Director", comprehensive keyword meta tag
- **Google Analytics 4** — GA4 scaffold ready for measurement ID activation
- **DNS prefetch & preconnect** — youtube.com, img.youtube.com, i.ytimg.com, googletagmanager.com
- **Branded footer** — "Toronto, Ontario" location, "Music Video Production & Direction" tagline

### Changed
- **Mobile YouTube player** — Now starts muted for autoplay compliance on iOS/Android
- **Title tag** — "Toronto Music Video Director | TdotsSolutionsz — 87 Videos, 49 Artists"
- **Meta description** — Updated with "GTA's premier hip-hop videographer" positioning
- **Open Graph** — `og:locale=en_CA`, `og:image:alt` added, Toronto-focused descriptions
- **Twitter Cards** — Updated with Toronto hip-hop positioning
- **Video thumbnail alt text** — Now includes artist name and "Toronto music video by TdotsSolutionsz"
- **PNG images** — Now served with 1-year immutable cache headers

### Security
- **Content-Security-Policy** — Whitelist-only policy for YouTube, Google Fonts, GA
- **Strict-Transport-Security** — 2-year max-age with preload flag
- **X-Content-Type-Options** — nosniff
- **X-Frame-Options** — SAMEORIGIN
- **Referrer-Policy** — strict-origin-when-cross-origin
- **Permissions-Policy** — Disabled camera, microphone, geolocation, interest-cohort
- **Dependencies** — 0 vulnerabilities (npm audit clean)

## [2.0.0] - 2026-02-06

### Added
- Favorites system with localStorage persistence and dedicated filter tab
- Related videos section in mobile modal
- SEO sitemap with 87 video deep links
- JSON-LD structured data, Open Graph image, canonical URLs
- PWA manifest for installability
- Skip-to-content link for keyboard accessibility
- `prefers-reduced-motion` support

### Changed
- Toronto skyline compressed from 2.8MB PNG to 185KB WebP (93% reduction)
- OG image optimized to 42KB
- Vercel caching headers for immutable assets
- YouTube API key moved to Vercel environment variable

## [1.9.0] - 2026-02-06

### Added
- Auto-advance playback with loop
- Prev/next navigation in modal and theater mode
- Arrow key controls in theater mode
- YouTube IFrame API for end-detection
- Custom domain tdotssolutionsz.com

## [1.8.0] - 2026-02-06

### Added
- Tron cityscape with 200+ neon edge-outlined buildings
- Highway arches, data stream pillars, CN Tower energy spire
- Dynamic road length scaling
- Mobile logo with animated glow
- View count badges on mobile cards

## [1.7.0] - 2026-01-27

### Added
- Search/filter by artist
- Deep links via `?v=youtubeId`
- Artist spotlight stats
- Code splitting (React.lazy + vendor chunks)
- Video #87: "On Fleek" by Hypa ft Trouble Trouble
