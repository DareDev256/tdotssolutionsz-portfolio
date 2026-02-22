# TdotsSolutionsz — Toronto Creative Production

[![Live Site](https://img.shields.io/badge/LIVE-tdotssolutionsz.com-ff6ec7?style=for-the-badge&logo=vercel)](https://tdotssolutionsz.com)
[![Videos](https://img.shields.io/badge/101_VIDEOS-54_ARTISTS-00ffff?style=for-the-badge)](https://tdotssolutionsz.com/videos)
[![Tests](https://img.shields.io/badge/TESTS-346_PASSING_(28_SUITES)-00ff41?style=for-the-badge)](.)
[![Version](https://img.shields.io/badge/v3.23.2-synthwave-blueviolet?style=for-the-badge)](CHANGELOG.md)

> An immersive synthwave-themed portfolio showcasing **101 music videos** by **54 artists** — produced by TdotsSolutionsz, Toronto's premier hip-hop video production company. Drive through a neon 3D cityscape on desktop. Browse a polished mobile grid on phone.

---

## The Experience

### Desktop — 3D Neon Cityscape (`/videos`)

A Tron-inspired metropolis you scroll through on a light cycle. 200+ edge-lit buildings, highway arches, data stream pillars, and CN Towers bookend the journey. Video billboards line dual lanes — browse by date or by popularity (60K+ views). Click any billboard to watch.

- **Vehicle Selection** — Tron Light Cycle, DeLorean, or Cyber Bike
- **Theater Mode** — Press `F` for fullscreen immersive playback; arrow keys skip tracks
- **Audio Visualizer** — Press `V` to toggle a procedural beat-synced visualizer with frequency bars, floating particles, and pulsing ring — all in the synthwave neon palette
- **Shuffle Play** — Press `S` for random discovery with no-repeat history
- **Fuzzy Search** — Typo-tolerant search across artists and video titles
- **Artist Panel** — Click any artist name for a slide-in sidebar with all their videos and stats
- **Golden Angel Halos** — Deceased artists (Murda, BG) honored with golden halos and ethereal bloom glow
- **Audio Visualizer** — Press `V` for a beat-synced procedural visualizer with frequency bars, floating particles, speaker-cone bass ring, and VHS scanner sweep
- **Keyboard Shortcuts** — Press `?` to see all controls

### Mobile — Polished Grid View

Synthwave-styled card grid with floating CSS particles, scanline overlay, and glassmorphism cards. Swipe gestures, hero card, staggered scroll-reveal animations.

- **Hero Card** — Full-width featured video at the top
- **Swipe Navigation** — Left/right in the video modal
- **Favorites** — Heart button saves to localStorage with a dedicated filter tab
- **Shuffle & Search** — Same discovery tools as desktop

### Hub Landing Page (`/`)

The landing page showcases the story of 14 years of Toronto hip-hop video production.

- **Artist Showcase Ticker** — Infinite CSS marquee of top 12 artists with YouTube thumbnails, video counts, and total views. Hover to pause, seamless edge-fade masking
- **Live Stats Counter** — Animated count-up (requestAnimationFrame + ease-out cubic) showing 101 videos, 54 artists, 25.3M+ total views, and 14 years of production. Triggered by IntersectionObserver on scroll
- **"Now Playing" Hero** — Full-bleed cinematic hero section with ultra-wide (21:9) viewport showcasing a random top-20 video. Hover triggers auto-playing YouTube preview (muted by default) with a dual-gradient cinematic overlay, pulsing NOW PLAYING badge, mute/unmute toggle, and WATCH NOW CTA. Shuffle rotates through all 20 videos with a no-repeat history buffer. **Scroll-driven cinematic animations**: parallax thumbnail shift, dolly zoom scale, staggered info reveal, and a reactive neon aura glow that intensifies as the section enters focus. Responsive: 16:9 on tablet, 16:10 on mobile. Respects `prefers-reduced-motion`
- **Production Era Timeline** — Horizontal scroll cards grouping 101 videos into four eras (Origins 2010–2014, Rise 2015–2017, Peak 2018–2020, New Wave 2021–2026) with per-era color theming, top video thumbnails, scroll-snap alignment, and timeline connector dots with glow effects
- **Split Navigation** — Two-card entry to Music Videos (live) and Photography (coming soon) with animated gradient borders and backdrop blur
- **Social Footer** — YouTube, Instagram, and "Book a Session" CTA links in the footer

### Video Detail Page (`/video/:youtubeId`) — **NEW in v3.18.0**

Every video now has its own shareable, SEO-friendly page at `/video/{youtubeId}`. Lightweight (6 kB gzipped, zero Three.js), fast-loading, and independently linkable.

- **Embedded Player** — Privacy-enhanced YouTube embed with neon-bordered frame and CRT scanline overlay
- **Metadata Display** — Artist, title, views, year, and artist video count in stat pills
- **Share Bar** — Copy link, share to X/Twitter, share to WhatsApp
- **Related Videos** — Grid of up to 6 related videos (same artist first, then popular picks)
- **3D CTA** — "Watch in 3D" link to the full synthwave highway experience at `/videos?v=`
- **Branded 404** — Glitch-animated 404 page for invalid video IDs or unknown routes
- **Full Responsive** — 3-column → 2-column → 1-column related grid across breakpoints

---

## Notable Artists

| Artist | Highlight | Views |
|--------|-----------|-------|
| **Masicka** | Everything Mi Want | 5.7M |
| **Casper TNG** | Dope Boy | 5.2M |
| **King Louie** | Made Drill | 2.7M |
| **Street Bud** | No Cap | 1.1M |
| **Robin Banks** | Malis Off A Molly | 986K |
| **Smiley** | Bumpin (pre-OVO/Drake era) | 178K |
| **Jose Guapo** | Where is the Love (WSHH) | 430K |
| **BG** | 96 Days | 503K |
| **Shortiie Raw** | 10 videos in the catalog | — |

Plus Dundas Dolla, Moshine, Hypa, SLOC, Arez, RoadKidd, LV, Da Kid Bluntz, Daz Dinero, Cboz, Scooby Blacks, OG Dre, Big Kitty, Seanpane, Murda, Soodope, H3RSH, and more — **54 artists** total.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 6 (code-split with React.lazy + manual chunks) |
| **Routing** | React Router v7 (lazy-loaded `/`, `/video/:youtubeId`, `/videos`, `/photos`) |
| **3D Engine** | Three.js 0.170 / React Three Fiber / Drei |
| **Post-Processing** | Bloom, Vignette, Noise, Scanline, Chromatic Aberration |
| **Video** | YouTube IFrame API (playback control, auto-advance, end detection) |
| **Testing** | Vitest — 340 unit tests across 28 test suites |
| **Hosting** | Vercel with custom domain (tdotssolutionsz.com) |
| **Build Pipeline** | YouTube API enrichment at build time (zero runtime API costs) |

---

## Architecture Highlights

- **Device-Aware Routing** — Desktop loads the full Three.js 3D scene (1.1MB vendor chunk); mobile skips it entirely and loads a lightweight card grid
- **Dual Lane System** — Videos processed into chronological and popular lanes with dynamic road scaling to match the catalog size
- **Build-Time Data** — `fetch-youtube-data.js` pulls real view counts and upload dates from YouTube at build time, so the client bundle has zero API dependencies
- **Modular 3D** — Vehicles (`components/3d/vehicles/`), effects (`components/3d/effects/`), scene (`components/3d/scene/` — CNTower, Cityscape, TronBuilding, HighwayArch, DataStream), atmosphere, and particles all extracted into focused modules with barrel exports
- **9 Shared Hooks** — Deep linking (`useVideoDeepLink`), video navigation (`useVideoNavigation`), shuffle play (`useShufflePlay`), favorites (`useFavorites`), copy-to-clipboard (`useCopyLink`), keyboard shortcuts (`useKeyboardShortcuts`), search (`useSearch`), device type (`useDeviceType`), fresnel materials (`useFresnelMaterial`) — plus 3 inline hooks (`useScrollReveal`, `useCountUp`, `useSwipe`) colocated with their components
- **JSDoc Coverage** — All hooks, utilities, 3D components, and core scene internals (CameraRig, ProximityTracker, Cityscape, BillboardFrame) documented with parameter types and architectural rationale
- **Security Hardened** — 11 HTTP security headers (CSP, HSTS, COOP, CORP, Permissions-Policy with hardware/payment/screen-capture/XR API blocks), YouTube ID validation at all entry points, HTTPS-enforced share windows, iframe referrer suppression, production source map suppression, 24-pattern secret scanning, dependency auditing

> Full architecture details: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## Development

```bash
npm install
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Fetch YouTube data + production build
npm run preview          # Preview production build locally
npm test                 # Run 343 unit tests
npm run test:watch       # Tests in watch mode
npm run prescan          # Scan for leaked secrets
npm run audit:security   # Dependency vulnerability check
```

### Environment Variables

| Variable | Purpose | Where |
|----------|---------|-------|
| `YOUTUBE_API_KEY` | Build-time video data enrichment | Vercel env var |

---

## Project Structure

```
src/
├── App.jsx                    # Desktop 3D experience (~1,022 lines)
├── MobileApp.jsx              # Mobile grid view
├── components/
│   ├── HubPage.jsx            # Landing page — navigation + analytics dashboard
│   ├── VideoPage.jsx          # Standalone video detail page (shareable, no Three.js)
│   ├── ArtistShowcase.jsx     # Infinite marquee ticker of top 12 artists
│   ├── VideoSpotlight.jsx     # Featured video card with shuffle history
│   ├── EraTimeline.jsx        # Four-era horizontal scroll timeline
│   ├── VideoCard.jsx          # Mobile video card with glassmorphism
│   ├── YouTubePlayer.jsx      # YouTube IFrame API wrapper
│   ├── 3d/vehicles/           # TronLightCycle, DeLorean, CyberBike
│   ├── 3d/scene/              # CNTower, Cityscape, TronBuilding, HighwayArch, DataStream
│   ├── 3d/effects/            # StarField, SynthwaveSun
│   ├── atmosphere/            # EnhancedStarField, GroundFog, ProceduralNebula
│   ├── particles/             # SoftParticles
│   └── ui/                    # SearchBar, ArtistPanel, TheaterMode, KeyboardGuide, SectionLabel, AudioVisualizer
├── hooks/                     # 9 shared hooks (+ 3 inline hooks in components)
├── utils/                     # videoData, youtube, formatters, audioAttenuation, imageFallback
└── data/                      # videos.json (101 entries), photos.json (25 entries)
```

---

## Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for full version history.

**Latest — v3.22.1** (2026-02-20): Added prompt caching research brief documenting how AI agent cost/latency optimization powers this project's development workflow.

> Full architecture and research docs: **[docs/](docs/)**

---

<p align="center">
  <strong>TdotsSolutionsz</strong> — Toronto, Ontario<br>
  Music Video Production & Direction<br>
  <a href="https://tdotssolutionsz.com">tdotssolutionsz.com</a>
</p>
