# Changelog

All notable changes to TdotsSolutionsz Music Video Portfolio.

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
