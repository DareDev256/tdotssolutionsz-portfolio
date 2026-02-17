# TdotsSolutionsz — Toronto Creative Production

[![Live Site](https://img.shields.io/badge/LIVE-tdotssolutionsz.com-ff6ec7?style=for-the-badge&logo=vercel)](https://tdotssolutionsz.com)
[![Videos](https://img.shields.io/badge/101_VIDEOS-54_ARTISTS-00ffff?style=for-the-badge)](https://tdotssolutionsz.com/videos)
[![Tests](https://img.shields.io/badge/TESTS-309_PASSING_(26_SUITES)-00ff41?style=for-the-badge)](.)
[![Version](https://img.shields.io/badge/v3.14.0-synthwave-blueviolet?style=for-the-badge)](CHANGELOG.md)

> An immersive synthwave-themed portfolio showcasing **101 music videos** by **54 artists** — produced by TdotsSolutionsz, Toronto's premier hip-hop video production company. Drive through a neon 3D cityscape on desktop. Browse a polished mobile grid on phone.

---

## The Experience

### Desktop — 3D Neon Cityscape (`/videos`)

A Tron-inspired metropolis you scroll through on a light cycle. 200+ edge-lit buildings, highway arches, data stream pillars, and CN Towers bookend the journey. Video billboards line dual lanes — browse by date or by popularity (60K+ views). Click any billboard to watch.

- **Vehicle Selection** — Tron Light Cycle, DeLorean, or Cyber Bike
- **Theater Mode** — Press `F` for fullscreen immersive playback; arrow keys skip tracks
- **Shuffle Play** — Press `S` for random discovery with no-repeat history
- **Fuzzy Search** — Typo-tolerant search across artists and video titles
- **Artist Panel** — Click any artist name for a slide-in sidebar with all their videos and stats
- **Golden Angel Halos** — Deceased artists (Murda, BG) honored with golden halos and ethereal bloom glow
- **Keyboard Shortcuts** — Press `?` to see all controls

### Mobile — Polished Grid View

Synthwave-styled card grid with floating CSS particles, scanline overlay, and glassmorphism cards. Swipe gestures, hero card, staggered scroll-reveal animations.

- **Hero Card** — Full-width featured video at the top
- **Swipe Navigation** — Left/right in the video modal
- **Favorites** — Heart button saves to localStorage with a dedicated filter tab
- **Shuffle & Search** — Same discovery tools as desktop

### Hub Landing Page (`/`)

The landing page doubles as a production analytics dashboard — six interactive sections that tell the story of 14 years of Toronto hip-hop video production.

- **Artist Showcase Ticker** — Infinite CSS marquee of top 12 artists with YouTube thumbnails, video counts, and total views. Hover to pause, seamless edge-fade masking
- **Live Stats Counter** — Animated count-up (requestAnimationFrame + ease-out cubic) showing 101 videos, 54 artists, 25.3M+ total views, and 14 years of production. Triggered by IntersectionObserver on scroll
- **Video Spotlight** — Featured video card showcasing a random top-20 video with cinematic thumbnail, vignette gradient, and play overlay. Shuffle button uses a sliding-window history buffer (same algorithm as `useShufflePlay`) guaranteeing all 20 videos appear before any repeat. Clicks deep-link directly into the 3D experience at `/videos?v=`
- **Collab Web** — Interactive artist collaboration network parsed from `ft.` credits in video titles/descriptions. Neon-colored node tags show each collaborating artist with connection count. Click any node to highlight connections, dim unrelated artists, and reveal collaboration tracks with thumbnails and deep-links. 30+ collaborations across the roster
- **Production Pulse Chart** — Interactive year-by-year neon bar chart (2010–2026) with hover detail strip showing video count, formatted views, and unique artist count per year. Dynamic neon theming via CSS custom properties, keyboard-accessible bars (`role="button"`, `aria-label`, `focus-visible`), `prefers-reduced-motion` support
- **Production Era Timeline** — Horizontal scroll cards grouping 101 videos into four eras (Origins 2010–2014, Rise 2015–2017, Peak 2018–2020, New Wave 2021–2026) with per-era color theming, top video thumbnails, scroll-snap alignment, and timeline connector dots with glow effects
- **Split Navigation** — Two-card entry to Music Videos (live) and Photography (coming soon) with animated gradient borders and backdrop blur

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
| **Routing** | React Router v7 (lazy-loaded `/`, `/videos`, `/photos`) |
| **3D Engine** | Three.js 0.170 / React Three Fiber / Drei |
| **Post-Processing** | Bloom, Vignette, Noise, Scanline, Chromatic Aberration |
| **Video** | YouTube IFrame API (playback control, auto-advance, end detection) |
| **Testing** | Vitest — 309 unit tests across 26 test suites |
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
- **Security Hardened** — 11 HTTP security headers (CSP, HSTS, COOP, CORP, Permissions-Policy with hardware/payment API blocks), YouTube ID validation at all entry points, iframe referrer suppression, production source map suppression, secret scanning, dependency auditing

> Full architecture details: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## Development

```bash
npm install
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Fetch YouTube data + production build
npm run preview          # Preview production build locally
npm test                 # Run 309 unit tests
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
│   ├── ArtistShowcase.jsx     # Infinite marquee ticker of top 12 artists
│   ├── ProductionPulse.jsx    # Year-by-year neon bar chart (2010–2026)
│   ├── VideoSpotlight.jsx     # Featured video card with shuffle history
│   ├── EraTimeline.jsx        # Four-era horizontal scroll timeline
│   ├── VideoCard.jsx          # Mobile video card with glassmorphism
│   ├── YouTubePlayer.jsx      # YouTube IFrame API wrapper
│   ├── 3d/vehicles/           # TronLightCycle, DeLorean, CyberBike
│   ├── 3d/scene/              # CNTower, Cityscape, TronBuilding, HighwayArch, DataStream
│   ├── 3d/effects/            # StarField, SynthwaveSun
│   ├── atmosphere/            # EnhancedStarField, GroundFog, ProceduralNebula
│   ├── particles/             # SoftParticles
│   └── ui/                    # SearchBar, ArtistPanel, TheaterMode, KeyboardGuide, SectionLabel
├── hooks/                     # 9 shared hooks (+ 3 inline hooks in components)
├── utils/                     # videoData, youtube, formatters, audioAttenuation, imageFallback
└── data/                      # videos.json (101 entries), photos.json (25 entries)
```

---

## Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for full version history.

**Latest — v3.14.0** (2026-02-17): Extract shared `SectionLabel` UI component — eliminates duplicated neon divider markup and CSS across four HubPage sections.

---

<p align="center">
  <strong>TdotsSolutionsz</strong> — Toronto, Ontario<br>
  Music Video Production & Direction<br>
  <a href="https://tdotssolutionsz.com">tdotssolutionsz.com</a>
</p>
