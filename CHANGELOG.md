# Changelog

All notable changes to TdotsSolutionsz Music Video Portfolio.

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
