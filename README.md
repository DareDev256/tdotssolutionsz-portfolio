# TdotsSolutionsz Music Video Portfolio

An immersive synthwave-themed 3D music video portfolio showcasing **87 music videos** by **49 artists**, shot by TdotsSolutionsz — Toronto's premier hip-hop video production company. Drive through a neon cityscape and browse videos on billboard displays.

**Live at [tdotssolutionsz.com](https://tdotssolutionsz.com)**

## Features

- **Tron-Style 3D Cityscape** — Drive through a neon metropolis with 200+ edge-lit buildings, highway arches, data stream pillars, and an orbiting-ring CN Tower
- **Dual Lane System** — Browse by date (chronological) or popular selections (60K+ views)
- **Dynamic Road** — Road, grid, buildings, and arches scale to match total video count
- **Search & Filter by Artist** — Dropdown search on desktop and mobile to filter videos by artist
- **Deep Links** — Share direct links to any video via `?v=youtubeId` URL params
- **Artist Spotlight** — View stats (video count, total views, date range) for each artist
- **Responsive Design** — Full 3D on desktop, reduced effects on tablet, polished mobile grid with logo and view counts
- **Auto-Advance Playback** — Videos auto-advance to the next when finished, with "Now Playing" indicator, "Up Next" preview, and queue position display
- **YouTube Integration** — Embedded playback with real view counts and upload dates via YouTube IFrame API
- **Theater Mode** — Fullscreen immersive video viewing (press F), arrow keys to skip tracks, queue info, social sharing
- **Custom Domain** — Live at [tdotssolutionsz.com](https://tdotssolutionsz.com)
- **Vehicle Selection** — Choose between Tron Light Cycle, DeLorean, or Cyber Bike
- **Favorites** — Heart button to save videos; favorites persist via localStorage with dedicated filter tab
- **Related Videos** — "More by this artist" section in mobile modal with thumbnails and view counts
- **Social Sharing** — Share videos to X/Twitter and WhatsApp from modal and theater mode, with copy-link support
- **Toronto-Targeted SEO** — LocalBusiness + VideoObject structured data, geo-targeted meta tags, sitemap with 87 deep links, Open Graph, Twitter Cards
- **Security Hardened** — Enforced CSP (no `unsafe-eval`), HSTS with preload, X-Frame-Options DENY, COOP (`same-origin-allow-popups`), CORP (`same-origin`), Referrer-Policy, Permissions-Policy headers via Vercel; YouTube ID validation on deep link parameters
- **PWA Ready** — Web app manifest for installability
- **Code-Split Bundle** — Lazy-loaded App/MobileApp with separate Three.js vendor chunks
- **Shared Data Layer** — Centralized video processing (`utils/videoData.js`) and YouTube utilities (`utils/youtube.js`) shared across desktop, mobile, and theater mode

## Tech Stack

- React 18 + Vite (code-split with React.lazy + manualChunks)
- Three.js / React Three Fiber / Drei
- Post-processing (bloom, vignette, soft particles, enhanced star field)
- YouTube IFrame API for playback control and end-detection
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

Plus Dundas Dolla, Moshine, Hypa, SLOC, Arez, RoadKidd, Da Kid Bluntz, Daz Dinero, Cboz, Scooby Blacks, OG Dre, Big Kitty, Purple, Soodope, H3RSH, ScaleBreakerBlo, Big Money, Yogi Savage, Flash Milla, Young Blitz, LP, Cuzzin Charlie, T-Dot, Baadass Bukk, Speng Don, Chinkz Rrahh, $ha, Leiffy Luciano, Jr Tuffy, and more — **49 artists** total.

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build for production (fetches YouTube data first)
npm run preview  # Preview production build
```

## Changelog

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
- **SEO Overhaul** — Sitemap with all 87 video deep links, robots.txt, JSON-LD structured data, Open Graph image (1200x630), canonical URLs, optimized meta tags
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
