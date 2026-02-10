# Changelog

All notable changes to TdotsSolutionsz Music Video Portfolio.

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
