# TdotsSolutionsz — Toronto Creative Production

An immersive synthwave-themed creative portfolio showcasing **101 music videos** by **54 artists**, by TdotsSolutionsz — Toronto's premier hip-hop video production and photography company. Hub landing page links to a 3D neon cityscape for music videos. Photography gallery coming soon.

**Live at [tdotssolutionsz.com](https://tdotssolutionsz.com)**

## Features

### Hub Landing Page (`/`)
- **Split Navigation** — Two-card layout: Music Videos (`/videos`) live, Photography coming soon
- **Music Videos Live** — 101 videos, 54 artists fully accessible
- **Synthwave Aesthetic** — Consistent neon-glow branding with animated gradient borders and backdrop blur
- **Responsive** — Grid on desktop, stacked on mobile

### Music Videos (`/videos`)
- **Tron-Style 3D Cityscape** — Drive through a neon metropolis with 200+ edge-lit buildings, highway arches, data stream pillars, and CN Towers bookending the journey
- **Dual Lane System** — Browse by date (chronological) or popular selections (60K+ views)
- **Dynamic Road** — Road, grid, buildings, and arches scale to match total video count
- **Fuzzy Search** — Search artists *and* video titles with typo-tolerant fuzzy matching; results categorized into VIDEOS and ARTISTS sections with relevance ranking
- **Deep Links** — Share direct links to any video via `/videos?v=youtubeId` URL params
- **Artist Spotlight** — View stats (video count, total views, date range) for each artist
- **Portfolio Stats** — Aggregate dashboard showing total videos, artists, views, year range, and top artist
- **Auto-Advance Playback** — Videos auto-advance with "Now Playing" indicator and "Up Next" preview
- **Golden Angel Halos** — Deceased artists (Murda, BG) honored with golden halo, golden billboard border, and ambient golden glow on their 3D billboards; Bloom post-processing creates ethereal shine
- **Artist Panel** — Slide-in sidebar (desktop right, mobile bottom sheet) showing all videos by an artist with stats; clickable from both desktop spotlight and mobile modal
- **YouTube Integration** — Embedded playback with real view counts via YouTube IFrame API
- **Theater Mode** — Fullscreen immersive viewing (press F), arrow keys to skip tracks, social sharing
- **Keyboard Shortcuts Guide** — Press `?` to see all keyboard shortcuts; context-labeled with synthwave-styled keys
- **Vehicle Selection** — Choose between Tron Light Cycle, DeLorean, or Cyber Bike
- **Shuffle Play** — Discover random videos with no repeats; dice button on mobile, SHUFFLE button + `S` key on desktop. Sliding-window history avoids the last 10 picks
- **Favorites** — Heart button to save videos; persist via localStorage with dedicated filter tab
- **Mobile Atmosphere** — Floating CSS particles (cyan/pink), subtle scanline overlay, card entrance animations with staggered scroll reveal
- **Hero Card** — Full-width featured video card at top of mobile grid with large thumbnail, gradient overlay, and PLAY button
- **Swipe Gestures** — Swipe left/right in mobile video modal to navigate between videos
- **Related Videos** — "More by this artist" section in mobile modal
- **Social Sharing** — Share to X/Twitter and WhatsApp with copy-link support

### Cross-Cutting
- **Client-Side Routing** — React Router v7 with lazy-loaded routes; legacy `/?v=` deep links redirect to `/videos?v=`
- **Responsive Design** — Full 3D on desktop, reduced effects on tablet, polished mobile grid
- **Toronto-Targeted SEO** — LocalBusiness + VideoObject + ImageGallery structured data, geo-targeted meta tags, sitemap with video deep links and photo routes
- **Security Hardened** — Enforced CSP, HSTS with preload, X-Frame-Options DENY, COOP, CORP, Referrer-Policy, Permissions-Policy; YouTube ID validation at all entry points; localStorage hardening; social share host allowlist; build-time ID validation; no-store HTML cache policy
- **PWA Ready** — Web app manifest for installability
- **Error Resilient** — React Error Boundary catches WebGL crashes; broken thumbnails gracefully fall back to SVG placeholder
- **Shared Hooks** — Deep-link URL sync, video navigation, and clipboard copy extracted into reusable hooks shared between desktop 3D and mobile grid experiences
- **Modular 3D Components** — Vehicle system (`components/3d/vehicles/`), scene effects (`components/3d/effects/` — StarField, SynthwaveSun) extracted with barrel exports
- **Modular UI Overlays** — SearchBar, PortfolioStats, VideoOverlay extracted into `components/ui/` alongside TheaterMode, ArtistPanel, and KeyboardGuide
- **Keyboard Shortcuts Hook** — Declarative `useKeyboardShortcuts` hook consolidates all keyboard bindings into a single listener with automatic input-field guards
- **Code-Split Bundle** — HubPage (1.89KB), PhotoGallery (8.17KB), Three.js vendor (1.1MB) only loads on `/videos`
- **Hub Landing** — Music Videos live, Photography locked with "Coming Soon" toast
- **Tested** — 223 unit tests via Vitest

## Tech Stack

- React 18 + Vite (code-split with React.lazy + manualChunks)
- React Router v7 (BrowserRouter with lazy routes)
- Three.js / React Three Fiber / Drei
- Post-processing (bloom, vignette, soft particles, enhanced star field)
- YouTube IFrame API for playback control and end-detection
- Vitest for unit testing
- Deployed on Vercel — [tdotssolutionsz.com](https://tdotssolutionsz.com)

## Notable Artists Featured

- **Masicka** — Everything Mi Want (5.7M views)
- **Casper TNG** — Dope Boy (5.2M), In My City (192K), Rich/Designer Preview with K Money (964K)
- **King Louie** — Made Drill (2.7M views)
- **Smiley** — Bumpin with Fresh & Homie (178K), Dead Homies with Blacka Da Don (52K) — early work before signing to OVO/Drake
- **Jose Guapo** — Don't Believe the Hype (393K, WSHH Exclusive), Where is the Love (430K, WSHH Exclusive), Osama Bin Guapo Vlog 7
- **Robin Banks** — Malis Off A Molly (986K)
- **Street Bud** — No Cap (1.1M)
- **BG** — 96 Days (503K), Wanna Ball with Banks/LV/Arez/FreshBoy (190K)
- **LV** — Check Remix (282K), Locked Up with YG & PURPLE (165K)
- **Shortiie Raw** — 10 videos including Drip ft. Molly Brazy (201K), Panda Freestyle
- **Seanpane** — 6 videos including Only 1s (70K)
- **Murda** — 4 videos including 6 God Remix (80K), The Sauce ft. Moshine (58K)

Plus Dundas Dolla, Moshine, Hypa, SLOC, Arez, RoadKidd, Da Kid Bluntz, Daz Dinero, Cboz, Scooby Blacks, OG Dre, Big Kitty, Purple, Soodope, H3RSH, ScaleBreakerBlo, Big Money, Yogi Savage, Flash Milla, Young Blitz, LP, Cuzzin Charlie, T-Dot, Baadass Bukk, Speng Don, Chinkz Rrahh, $ha, Leiffy Luciano, Jr Tuffy, Big Surp, and more — **54 artists** total.

## Documentation

- **[Architecture Guide](docs/ARCHITECTURE.md)** — System overview, project structure, data flow, security model, deployment pipeline, and key architecture decisions

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Build for production (fetches YouTube data first)
npm run preview    # Preview production build
npm test           # Run unit tests
npm run test:watch # Run tests in watch mode
```

## Changelog

### v3.7.1 (2026-02-12)
- **UI overlay extraction** — Moved SearchBar, PortfolioStats, VideoOverlay out of App.jsx into `components/ui/`. New `useKeyboardShortcuts` hook consolidates 3 duplicate keyboard handlers into one declarative map. App.jsx reduced from 1895 → 1647 lines

### v3.6.0 (2026-02-12)
- **Keyboard shortcuts guide** — Press `?` anywhere to toggle a modal showing all keyboard shortcuts with context labels. Works on both desktop 3D and mobile grid views

### v3.3.0 (2026-02-11)
- **Golden angel halos** — Deceased artists (Murda, BG) honored with golden torus halo, golden billboard border, and ambient golden light on 3D billboards; Bloom creates ethereal glow
- **Artist Panel** — Slide-in sidebar on desktop, bottom sheet on mobile; browse all videos by an artist with stats
- **Mobile atmosphere** — 15 floating CSS particles, scanline overlay, IntersectionObserver card reveal animations
- **Hero card** — Full-width featured video at top of mobile grid with large thumbnail and gradient overlay
- **Swipe gestures** — Left/right swipe in mobile modal navigates between videos
- **Card visual upgrades** — Glassmorphism, pulsing view badge glow, animated now-playing state
- **Video #101** — Big Surp ft. Cutthroat - New Glock 30 (54K views)

### v3.1.1 (2026-02-11)
- **Architecture documentation** — Comprehensive `docs/ARCHITECTURE.md` covering system overview, project structure, data flow, security model, deployment pipeline, and key architecture decisions

### v3.1.0 (2026-02-11)
- **Photography Gallery live** — Unlocked `/photos` route with full PhotoGallery component (25 photos, 4 categories, lightbox, lazy loading). Hub card upgraded from locked "Coming Soon" button to active navigation link
- **Hub simplification** — HubPage is now stateless (removed toast, locked state, ~45 lines of dead CSS)

### v3.0.5 (2026-02-11)
- **Tests** — 153 total (up from 127): 17 PhotoGallery logic tests (getPhotoSrc paths, category filtering, lightbox navigation wrapping, data consistency) + 9 imageFallback tests (SVG data URI validation, theme colors, self-containment, XSS safety)

### v3.0.4 (2026-02-11)
- **Fix: Production build** — Resolved missing `react-router-dom` in `node_modules` that broke `npm run build`
- **Fix: Broken thumbnails** — VideoCard and MobileApp related-video images now show styled SVG fallback instead of browser broken-image icon

### v3.0.3 (2026-02-11)
- **Security: COEP header** — Added `Cross-Origin-Embedder-Policy: credentialless` completing Spectre isolation trifecta (COOP + CORP + COEP), compatible with YouTube embeds
- **Security: Desktop iframe guard** — `isValidYouTubeId()` check before rendering desktop embed iframe (defense-in-depth)
- **Security: HTML cache hardened** — `no-store` on index.html prevents serving stale security headers
- **Tests** — 127 total (up from 114): 13 security header tests validating vercel.json configuration

### v3.0.2 (2026-02-11)
- **Tests** — 114 total (up from 100): 9 photo data integrity tests (photos.json schema validation, uniqueness, category coverage) + 5 lane position/metadata tests (Z-spacing, Y-height, color cycling, popular lane IDs)

### v3.0.1 (2026-02-10)
- **Security: CORP header** — Added `Cross-Origin-Resource-Policy: cross-origin` (Spectre isolation compatible with YouTube embeds)
- **Security: X-Permitted-Cross-Domain-Policies** — Blocks Flash/Acrobat cross-domain policy lookups
- **Security: Social share allowlist** — `openShareWindow()` validates target host before opening popups (prevents open redirect)
- **Security: Build-time ID validation** — YouTube IDs validated at build time before reaching client bundle
- **Tests** — 100 total (up from 95): 5 `openShareWindow` tests (host allowlist, protocol blocking, open redirect prevention)

### v3.0.0 (2026-02-10)
- **Hub Landing Page** — New root route (`/`) with two-card navigation to Music Videos and Photography sections
- **Photography Gallery** — 25 curated photos (portraits, artist, events, street) with category tabs, lightbox viewer, keyboard navigation, and lazy loading
- **Client-Side Routing** — React Router v7 with lazy-loaded routes (`/`, `/videos`, `/photos`); legacy `/?v=` deep links redirect to `/videos?v=`
- **25 Optimized Photos** — WebP format in `public/photos/` (portraits, artist, events, street subdirs)
- **SEO Updates** — ImageGallery structured data, updated title/meta/OG tags, sitemap with `/videos` and `/photos` routes
- **SPA Routing** — Vercel rewrites for `/videos` and `/photos`

### v2.4.0 (2026-02-10)
- **Portfolio Stats Dashboard** — Desktop: synthwave-styled overlay (STATS button) with total videos, artists, views, year range, and top artist. Mobile: compact stats banner below header
- **`PORTFOLIO_STATS` shared data** — Pre-computed aggregate metrics in `videoData.js`, follows existing single-source-of-truth pattern
- **Tests** — 95 total (up from 91): 4 portfolio stats consistency tests

### v2.3.2 (2026-02-10)
- **Security: URL origin guard** — `extractVideoId()` now only accepts YouTube-origin URLs via hostname whitelist, rejecting `evil.com?v=validId` spoofing. Also adds `youtu.be` short link support
- **Security: Favorites write-side validation** — `toggleFavorite()` validates videoId before persisting to localStorage (defense-in-depth alongside existing read-side validation)
- **Tests** — 91 total (up from 87): 4 URL origin guard tests (non-YouTube rejection, youtu.be support, mobile/music YouTube, short link XSS)

### v2.2.8 (2026-02-10)
- **Security: Thumbnail URL consolidation** — Replaced 2 inline thumbnail URL constructions in VideoCard and MobileApp with validated `getThumbnailUrl()`, blocking injection via tampered `youtubeId`
- **Security: YouTubePlayer guard** — Added `isValidYouTubeId()` check before YouTube IFrame API initialization
- **Security: README accuracy** — Corrected CORP/COEP header claims (removed in v2.2.3)
- **Tests** — 87 total (up from 83): 4 consolidated thumbnail URL injection tests

### v2.2.7 (2026-02-10)
- **Tests** — 83 total (up from 52): 14 procedural texture tests (Canvas 2D mocking for all 4 generators) + 17 MobileApp logic tests (filtering/sorting/search/relatedVideos/formatViews)

### v2.2.6 (2026-02-10)
- **Security: Deep link validation** — `?v=` parameter validated through `isValidYouTubeId()` before use in both App.jsx and MobileApp.jsx
- **Security: Share URL injection fix** — `getShareUrl()` now validates IDs before embedding, preventing payload injection via malformed `youtubeId` property
- **Security: Iframe sandbox** — Desktop YouTube embed restricted to `allow-scripts allow-same-origin allow-presentation allow-popups`
- **Security: Popup hardening** — All social share `window.open()` calls include `noopener,noreferrer`
- **Tests** — 52 total (up from 47): 3 share URL tests + 2 deep link validation tests

### v2.2.5 (2026-02-10)
- **Docs** — Added JSDoc with `@param`/`@returns` annotations across 5 source files: `VideoCard.jsx`, `useFavorites.js`, `main.jsx`, `useDeviceType.js`, `useFresnelMaterial.js` — enables IDE hover-docs for all public exports

### v2.2.4 (2026-02-10)
- **Tests** — 47 total (up from 29): added 11 VideoCard formatter tests (`formatViews` K/M boundaries, `formatYear` date parsing, `formatDate` relative time with fake timers) + 7 fresnel material tests (`updateFresnelMaterial` null-safety, `createRimGlowMaterial` construction)

### v2.2.3 (2026-02-10)
- **Security: COEP header** — Added `Cross-Origin-Embedder-Policy: credentialless` completing Spectre isolation (COOP + CORP + COEP)
- **Security: CSP upgrade-insecure-requests** — Auto-upgrades HTTP subresource requests to HTTPS
- **Security: Thumbnail URL validation** — `getThumbnailUrl()` now validates videoId and restricts quality to a 5-preset whitelist
- **Security: localStorage hardening** — Favorites validated through YouTube ID pattern, array-type check, and 500-item cap
- **Tests** — 29 total (up from 21): added 6 favorites validation tests + 3 thumbnail injection tests

### v2.2.2 (2026-02-09)
- **Test infrastructure** — Added Vitest with 21 unit tests covering YouTube ID validation (XSS prevention), video data integrity, lane processing, and responsive breakpoints
- **Dev scripts** — `npm test` and `npm run test:watch` commands

### v2.2.1 (2026-02-09)
- **Security: YouTube ID validation** — Deep link `?v=` parameter now validated against strict 11-char pattern, preventing injection of arbitrary strings into share URLs
- **Security: CORP header** — Added `Cross-Origin-Resource-Policy: same-origin` to block cross-origin asset hotlinking and Spectre-class side-channel leaks
- **Security: Font CORS** — Added `crossorigin="anonymous"` to Google Fonts stylesheet for consistent CORS handling

### v2.2.0 (2026-02-09)
- **DRY refactor** — Extracted shared `utils/videoData.js` and `utils/youtube.js` modules, eliminating duplicated video processing and YouTube ID parsing across App.jsx, MobileApp.jsx, and TheaterMode.jsx

### v2.1.4 (2026-02-09)
- **COOP fix** — Changed `Cross-Origin-Opener-Policy` from `same-origin` to `same-origin-allow-popups`, restoring X/Twitter and WhatsApp share popups and YouTube IFrame API compatibility

### v2.1.3 (2026-02-09)
- **CSP Enforced** — Switched from report-only to enforcing Content-Security-Policy; removed `unsafe-eval`, tightened whitelist
- **Clickjacking Protection** — X-Frame-Options upgraded to DENY, added `frame-ancestors 'none'`
- **Cross-Origin-Opener-Policy** — Added `same-origin` to prevent window.opener attacks
- **Removed dead GA4 placeholder** — Eliminated non-functional analytics script that widened attack surface

### v2.1.0 (2026-02-07)
- **Now Playing / Up Next Queue** — Animated equalizer badge on currently playing card, "Up Next" badge on the next card in sequence, queue position display (e.g. "3 / 87") in mobile modal and desktop theater mode
- **Social Sharing** — X/Twitter and WhatsApp share buttons in both mobile player modal and desktop theater mode, plus copy-link button
- **Toronto-Targeted SEO** — LocalBusiness schema with Toronto geo-coordinates and 80km GTA service radius, VideoObject ItemList with top 5 videos (5.7M, 5.2M, 2.7M, 1.1M, 986K views), geo-targeted meta tags (geo.region, geo.placename, ICBM), `en_CA` locale, Toronto-specific keywords
- **Security Headers** — Content-Security-Policy (whitelists YouTube, Google Fonts, GA), Strict-Transport-Security (2yr + preload), X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy (no camera/mic/geo/FLoC)
- **Performance** — DNS prefetch + preconnect to YouTube, YouTube image CDN, and Google Tag Manager; PNG cache headers added
- **Analytics** — Google Analytics 4 integration scaffold (replace `G-XXXXXXXXXX` with real measurement ID)
- **Mobile Autoplay** — YouTube player on mobile now starts muted for autoplay compliance on iOS/Android
- **Footer Branding** — New branded footer with "Toronto, Ontario" location and "Music Video Production & Direction" tagline
- **Alt Text** — All video thumbnails now include artist name and "Toronto music video by TdotsSolutionsz" for image SEO
- **Dependencies** — 0 vulnerabilities (npm audit clean), 0 new dependencies added

### v2.0.0 (2026-02-06)
- **Favorites System** — Heart button on video cards and modal to save favorites to localStorage; dedicated "Favorites" tab on mobile
- **Related Videos** — "More by this artist" section in mobile modal showing up to 4 videos with thumbnails and view counts
- **SEO Overhaul** — Sitemap with all 101 video deep links, robots.txt, JSON-LD structured data, Open Graph image (1200x630), canonical URLs, optimized meta tags
- **Performance** — Toronto skyline compressed from 2.8MB PNG to 185KB WebP (93% reduction); OG image optimized to 42KB; Vercel caching headers for immutable assets
- **Accessibility** — Skip-to-content link for keyboard users, `prefers-reduced-motion` support to disable animations, reduced mobile `backdrop-filter` for GPU savings
- **PWA Manifest** — Web app manifest for home screen installability with themed icons
- **YouTube API Key** — Vercel environment variable configured for live view count refresh during builds

### v1.9.0 (2026-02-06)
- **Auto-Advance Playback** — Videos automatically advance to the next when finished; loops at end of list
- **Prev/Next Navigation** — Navigation buttons in mobile modal and desktop theater mode
- **Arrow Key Controls** — Left/right arrow keys skip tracks in theater mode
- **YouTube IFrame API** — Replaced raw iframes with API-backed player for end-detection and playback control
- **Custom Domain** — Connected tdotssolutionsz.com via Namecheap DNS (A record + CNAME to Vercel)

### v1.8.0 (2026-02-06)
- **Tron Cityscape** — Replaced 24 basic box buildings with 200+ neon edge-outlined structures across 4 rows (inner/outer per side), with window grids, rooftop antennas, and horizontal accent lines
- **Highway Arches** — Alternating cyan/pink neon arches spanning the road with light strips
- **Data Stream Pillars** — Pulsing vertical light beams with base glow rings rising from the city
- **CN Tower Energy Spire** — 3 orbiting energy rings, glowing core, neon shaft lines, hexagonal base platform
- **Dynamic Road Length** — Road, grid, edge lines, lane markers, buildings, and arches now scale dynamically with video count (fixes road ending early)
- **Extended Fog** — Increased fog far distance for better depth perception
- **Mobile Logo** — Added TDots logo to mobile header with animated cyan glow (matching desktop)
- **Mobile Visual Polish** — Sticky frosted-glass header, gradient backgrounds, gradient scrollbar, decorative dividers
- **View Count Badges** — Neon cyan badges on mobile video card thumbnails (e.g. "5.2M", "252K")
- **Mobile Card Stats** — Added views and release date row to each mobile video card
- **Cleaner Mobile Typography** — Refined subtitle, reduced music symbol noise

### v1.7.0 (2026-01-27)
- **Search/Filter by Artist** — Dropdown with autocomplete on desktop (top-center pill) and mobile (tab bar)
- **Deep Links** — `?v=youtubeId` opens video directly; copy-link button in video overlay and mobile modal
- **Artist Spotlight** — Stats bar below video description showing video count, total views, and date range
- **Code Splitting** — React.lazy for App/MobileApp, vendor-three and vendor-postprocessing chunks; mobile users skip 1.1MB of Three.js
- **Favicon** — Swapped Vite default for TDots logo
- Added "On Fleek" by Hypa ft Trouble Trouble, T-Dot, Fresh (318K views) — video #87

### v1.6.0 (2026-01-27)
- Added TDots Solutionsz logo to site header with neon glow effect
- Subtitle now reads "[ Music Video Portfolio ]"
- Added 22 new videos (86 total) including Jose Guapo WSHH Exclusives, Casper TNG classics, Smiley pre-OVO era, LV collabs, and more
- Popular lane now has 37 qualifying videos (60K+ views)

### v1.5.0 (2026-01-27)
- Added music symbols and decorative elements to billboard titles
- Updated fix plan with completion audit
- Added `.vercel` to .gitignore

### v1.4.0
- Added 42 new videos (64 total) featuring Seanpane, Robin Banks, Murda, BG, Arez, RoadKidd, ScaleBreakerBlo, Big Money, Scooby Blacks, Da Kid Bluntz, Yogi Savage, Flash Milla, Young Blitz, LP, Cuzzin Charlie, Sloc, T-Dot, Baadass Bukk, and more
- Lowered Popular threshold from 500K to 60K views

### v1.3.0
- Renamed from "Infinite Drive" to "Music Video Portfolio" across all views
- Removed gradient backgrounds — replaced with solid neon colors and glows
- Fixed mobile scrolling

### v1.2.0
- Fetched real YouTube upload dates for all 22 videos (range: 2013-2025)
- By Date lane correctly sorted by actual upload date (newest first)

### v1.1.0
- Fetched real YouTube view counts for all 22 videos
- Popular lane with real view data
- Major performance overhaul

### v1.0.0
- Initial release with real YouTube video titles, artist names, and metadata
- Vercel deployment
