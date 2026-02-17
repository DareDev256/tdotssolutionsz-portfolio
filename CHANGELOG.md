# Changelog

All notable changes to TdotsSolutionsz Music Video Portfolio.

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
