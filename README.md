# TdotsSolutionsz — Toronto Creative Production

[![Live Site](https://img.shields.io/badge/LIVE-tdotssolutionsz.com-ff6ec7?style=for-the-badge&logo=vercel)](https://tdotssolutionsz.com)
[![Videos](https://img.shields.io/badge/101_VIDEOS-54_ARTISTS-00ffff?style=for-the-badge)](https://tdotssolutionsz.com/videos)
[![Tests](https://img.shields.io/badge/TESTS-267_PASSING-00ff41?style=for-the-badge)](.)
[![Version](https://img.shields.io/badge/v3.8.1-synthwave-blueviolet?style=for-the-badge)](CHANGELOG.md)

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

Split navigation — Music Videos (live) and Photography (coming soon). Animated gradient borders, backdrop blur, consistent neon branding.

- **Artist Showcase Ticker** — Auto-scrolling marquee of top 12 artists with YouTube thumbnails, video counts, and total views
- **Live Stats Counter** — Animated count-up showing 101 videos, 54 artists, 25.3M+ total views, and 14 years of production
- **Hover to Pause** — Ticker pauses on mouse hover for closer inspection

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
| **Testing** | Vitest — 267 unit tests across 23 test suites |
| **Hosting** | Vercel with custom domain (tdotssolutionsz.com) |
| **Build Pipeline** | YouTube API enrichment at build time (zero runtime API costs) |

---

## Architecture Highlights

- **Device-Aware Routing** — Desktop loads the full Three.js 3D scene (1.1MB vendor chunk); mobile skips it entirely and loads a lightweight card grid
- **Dual Lane System** — Videos processed into chronological and popular lanes with dynamic road scaling to match the catalog size
- **Build-Time Data** — `fetch-youtube-data.js` pulls real view counts and upload dates from YouTube at build time, so the client bundle has zero API dependencies
- **Modular 3D** — Vehicles (`components/3d/vehicles/`), effects (`components/3d/effects/`), atmosphere, and particles all extracted into focused modules with barrel exports
- **10 Custom Hooks** — Deep linking, video navigation, shuffle play, favorites, copy-to-clipboard, keyboard shortcuts, search, device type, fresnel materials, scroll reveal
- **Security Hardened** — 11 HTTP security headers (CSP, HSTS, COOP, CORP, Permissions-Policy), YouTube ID validation at all entry points, localStorage hardening, secret scanning, dependency auditing

> Full architecture details: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## Development

```bash
npm install
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Fetch YouTube data + production build
npm run preview          # Preview production build locally
npm test                 # Run 267 unit tests
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
├── App.jsx                    # Desktop 3D experience (~2,100 lines)
├── MobileApp.jsx              # Mobile grid view
├── components/
│   ├── 3d/vehicles/           # TronLightCycle, DeLorean, CyberBike
│   ├── 3d/effects/            # StarField, SynthwaveSun
│   ├── atmosphere/            # EnhancedStarField, GroundFog, ProceduralNebula
│   ├── particles/             # SoftParticles
│   └── ui/                    # SearchBar, ArtistPanel, TheaterMode, KeyboardGuide
├── hooks/                     # 10 custom hooks (shared between desktop + mobile)
├── utils/                     # videoData, youtube, formatters, imageFallback
└── data/                      # videos.json (101 entries), photos.json (25 entries)
```

---

## Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for full version history.

**Latest — v3.7.8** (2026-02-13): Architecture docs refresh — accurate project structure, test counts, security model, and JSDoc on 3D vehicle components.

---

<p align="center">
  <strong>TdotsSolutionsz</strong> — Toronto, Ontario<br>
  Music Video Production & Direction<br>
  <a href="https://tdotssolutionsz.com">tdotssolutionsz.com</a>
</p>
