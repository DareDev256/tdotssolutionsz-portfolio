# Architecture Guide

> Technical reference for developers working on the TdotsSolutionsz Music Video Portfolio.
> For features and setup, see [README.md](../README.md). For version history, see [CHANGELOG.md](../CHANGELOG.md).

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  Security Headers · SPA Rewrites · Immutable Asset Cache    │
├─────────────────────────────────────────────────────────────┤
│                     Client (Browser)                        │
│                                                             │
│  ┌──────────────────────────┐                              │
│  │ HubPage (/)              │                              │
│  │  ├─ VideoSpotlight       │   ┌────────────────────┐    │
│  │  ├─ ArtistShowcase       │──▶│ Videos Route        │    │
│  │  ├─ EraTimeline          │   │ (/videos)           │    │
│  │  └─ Split Nav            │   │  ├─ App (Desktop)   │    │
│  └──────────────────────────┘   │  └─ MobileApp       │    │
│       │                         └────────────────────┘    │
│       │  ┌──────────────┐   ┌────────────────────┐        │
│       └─▶│ Video Detail  │   │ PhotoGallery       │        │
│          │ (/video/:id)  │   │ (/photos)          │        │
│          └──────────────┘   └────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                   Build Pipeline                            │
│  YouTube Data API v3 → videos-enriched.json → Vite Bundle  │
└─────────────────────────────────────────────────────────────┘
```

**No backend.** Fully static SPA with build-time YouTube data enrichment.

## Project Structure

```
src/
├── main.jsx                 # Entry: BrowserRouter, lazy routes, Suspense
├── App.jsx                  # Desktop 3D experience (~2,100 lines)
├── MobileApp.jsx            # Mobile grid view (no Three.js)
├── components/
│   ├── HubPage.jsx          # Landing page: spotlight, showcase, timeline, nav
│   ├── VideoSpotlight.jsx   # "Now Playing" cinematic hero (hover-to-play, shuffle)
│   ├── VideoSpotlight.css   # Scroll-driven parallax, dolly zoom, neon aura
│   ├── ArtistShowcase.jsx   # Infinite marquee ticker of top-12 artists
│   ├── EraTimeline.jsx      # Horizontal scroll timeline (4 production eras)
│   ├── VideoPage.jsx        # Shareable video detail page (/video/:youtubeId)
│   ├── PhotoGallery.jsx     # Photo viewer with lightbox + categories
│   ├── VideoCard.jsx        # Reusable video thumbnail card
│   ├── YouTubePlayer.jsx    # YouTube IFrame API wrapper (race-condition safe)
│   ├── 3d/
│   │   ├── vehicles/        # TronLightCycle, DeLorean, CyberBike
│   │   └── effects/         # StarField (static), SynthwaveSun (layered horizon)
│   ├── atmosphere/          # EnhancedStarField (GPU shader), GroundFog, ProceduralNebula
│   ├── particles/           # SoftParticles (instanced, billboarded sprites)
│   └── ui/                  # TheaterMode, ArtistPanel, SearchBar, KeyboardGuide,
│                            # PortfolioStats, VideoOverlay (barrel-exported)
├── data/
│   ├── videos.json          # 101 video entries (source of truth)
│   └── photos.json          # 25 photo entries with metadata
├── hooks/                   # 13 custom hooks
│   ├── useVideoDeepLink.js  # URL ↔ state sync with history API
│   ├── useVideoNavigation.js# Next/prev with lane-aware traversal
│   ├── useShufflePlay.js    # Fisher-Yates shuffle with history stack
│   ├── useFavorites.js      # localStorage with XSS validation, 500-item cap
│   ├── useSearch.js         # Fuzzy search with 4-point scoring algorithm
│   ├── useDeviceType.js     # phone/tablet/desktop breakpoints
│   ├── useKeyboardShortcuts.js # Global keyboard handler (vim-style + media)
│   ├── useCopyLink.js       # Clipboard API with fallback
│   ├── useFresnelMaterial.js# Custom shader material for 3D vehicles
│   ├── useCinematicScroll.js# Scroll progress 0→1 with IO gate + reduced-motion
│   ├── useScrollReveal.js   # One-shot intersection reveal trigger
│   ├── useBatchReveal.js    # Staggered multi-element scroll reveal
│   └── useSwipe.js          # Touch swipe gesture detection (mobile)
├── utils/
│   ├── videoData.js         # Processes videos.json → lanes, stats, artists
│   ├── youtube.js           # URL parsing, ID validation, share helpers
│   ├── formatters.js        # View count formatting, date display
│   ├── imageFallback.js     # SVG data-URI broken thumbnail placeholder
│   └── proceduralTextures.js# 5 procedural texture generators for 3D
scripts/
├── fetch-youtube-data.js    # Build-time YouTube API enrichment
├── fix-video-ids.js         # ID correction utility
├── secret-scanner.js        # Scans codebase for leaked credentials
└── optimize-photos.sh       # JPG → WebP conversion
```

## Routing & Code Splitting

| Route      | Component      | Bundle Size | Notes                          |
|------------|---------------|-------------|--------------------------------|
| `/`        | HubPage       | ~1.9 KB     | Spotlight, showcase, timeline, nav |
| `/videos`  | App / MobileApp| ~1.1 MB*   | Device-aware: 3D or grid view  |
| `/video/:id`| VideoPage    | ~6 KB       | Shareable detail page (no WebGL) |
| `/photos`  | PhotoGallery  | ~8.2 KB     | Lightbox, categories, lazy img |

*Three.js bundle only loads on desktop `/videos`. Mobile gets `MobileApp` (no WebGL).

**Manual chunks** (vite.config.js):
- `vendor-three` — three, @react-three/fiber, @react-three/drei
- `vendor-postprocessing` — postprocessing, @react-three/postprocessing

## Data Flow

```
┌──────────────┐    Build Time     ┌──────────────────┐
│ videos.json  │──────────────────▶│ fetch-youtube-    │
│ (101 entries)│                   │ data.js           │
└──────────────┘                   │ ↓ YouTube API v3  │
                                   │ ↓ validates IDs   │
                                   │ ↓ deduplicates    │
                                   └────────┬─────────┘
                                            ▼
                                   ┌──────────────────┐
                                   │ videos-enriched   │
                                   │ .json (public/)   │
                                   └────────┬─────────┘
                                            ▼
┌──────────────────────────────────────────────────────┐
│              videoData.js (runtime)                   │
│                                                      │
│  VIDEOS         → Enriched video array               │
│  ALL_ARTISTS    → 54 unique sorted artist names      │
│  ARTIST_STATS   → Per-artist { count, views, range } │
│  PORTFOLIO_STATS→ Aggregate dashboard metrics         │
│  LANE_CONFIG    → 3D positioning constants            │
│  processVideosIntoLanes() → Billboard coordinates     │
└──────────────────────────────────────────────────────┘
```

**No runtime API calls.** View counts are frozen at build time.

## State Management

No external state library. React Context + custom hooks only:

| Pattern          | Scope    | Purpose                                 |
|-----------------|----------|-----------------------------------------|
| FilterContext   | App-wide | Artist filter (avoids prop drilling)    |
| useFavorites    | Local    | localStorage persistence, 500-item cap  |
| useDeviceType   | Local    | Responsive breakpoint detection         |
| useState        | Local    | Component-level UI state                |

## Security Model

### HTTP Headers (vercel.json)

All responses get 11 security headers including:
- **CSP** — Enforcing policy, allowlists YouTube/Google Fonts only
- **HSTS** — 2-year max-age, includeSubDomains, preload-eligible
- **No COEP** — Intentionally omitted; `Cross-Origin-Embedder-Policy` breaks YouTube embeds
- **Frame protection** — `X-Frame-Options: DENY` + `frame-ancestors 'none'`
- **Permissions-Policy** — camera, microphone, geolocation all disabled

### Input Validation

| Surface              | Validation                                         |
|---------------------|----------------------------------------------------|
| YouTube IDs         | 11-char alphanumeric regex (`/^[A-Za-z0-9_-]{11}$/`) |
| URL origins         | Hostname whitelist (youtube.com, youtu.be, m.youtube.com) |
| Social share URLs   | Host allowlist (twitter.com, x.com, wa.me)         |
| localStorage favs   | Array type check, string validation, 500-item cap  |
| Build-time IDs      | Pattern + duplicate detection in fetch script       |

### Caching Strategy

| Resource           | Cache-Control                              |
|-------------------|--------------------------------------------|
| `/assets/*`       | `public, max-age=31536000, immutable`      |
| `*.webp`, `*.png` | `public, max-age=31536000, immutable`      |
| `/index.html`     | `no-cache, no-store, must-revalidate`      |

## Setup & Development

### Prerequisites

Node.js 18+, npm 9+, and `YOUTUBE_API_KEY` (build-time only).

### Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server on localhost:5175 (auto-opens)
npm test                 # 346 tests (Vitest)
npm run test:watch       # Watch mode
npm run build            # fetch-data → vite build (needs YOUTUBE_API_KEY)
npm run preview          # Preview production build locally
npm run fetch-data       # Refresh YouTube view counts/dates
npm run prescan          # Scan for leaked secrets
npm run audit:security   # Dependency vulnerability check
```

### Environment Variables

Only `YOUTUBE_API_KEY` (build-time, set in Vercel dashboard). No `.env` in repo — no client-side env vars.

## Deployment

**Platform:** Vercel
**Domain:** tdotssolutionsz.com (Namecheap DNS)
**Build:** `npm run build` (fetches YouTube data, then Vite bundles)
**Output:** `dist/` directory

### Pipeline

`git push` → Vercel webhook → `npm run build` (fetch-youtube-data + vite build) → deploy `dist/`.
SPA rewrites in vercel.json: `/videos` and `/photos` → `/index.html` for client-side routing.

## Testing

28 test suites, **346 tests** covering security headers, YouTube utilities, video/photo data integrity, video playback guardrails (CSP, referrer policy, iframe sandbox), image fallback, lane positioning, favorites validation, device detection, swipe gestures, routing logic, shuffle play, keyboard shortcuts, deep-link sync, and copy-link. Run `npm test` before every commit — all must pass.

## Scroll-Driven Animation System

The "Now Playing" hero (VideoSpotlight) uses a custom scroll-driven animation pipeline that avoids CSS Scroll-Driven Animations API (limited browser support) in favor of a performant JS→CSS custom property bridge:

```
useCinematicScroll(ref)
    │
    ├─ IntersectionObserver (rootMargin: 100px)
    │   └─ Gates scroll listener on/off (no idle CPU cost)
    │
    ├─ scroll handler (passive: true)
    │   └─ Computes raw progress: 1 - (rect.top / (windowH × 0.8))
    │   └─ Clamps to 0–1
    │
    └─ Sets CSS custom properties on the section element:
        --scroll-progress  → neon aura border glow intensity
        --parallax-y       → thumbnail vertical offset (20px → 0px)
        --dolly-scale      → thumbnail zoom (1× → 1.04×)
        --info-offset      → info panel slide-up (15px → 0px)
```

**Why CSS custom properties?** All animated properties (`transform`, `box-shadow`, `opacity`) stay on the compositor thread. JavaScript only writes four numbers per scroll frame — the GPU handles the actual rendering. This avoids layout thrashing that direct style manipulation would cause.

**Reduced motion:** `prefers-reduced-motion: reduce` returns `progress = 1` immediately (all content visible, no animation), and CSS resets all transforms/transitions to `none`.

## Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| No backend / static SPA | Portfolio doesn't need dynamic data; build-time enrichment is sufficient |
| Device-aware route split | Mobile skips 1.1MB Three.js bundle entirely — loads grid view instead |
| Manual Vite chunks | Three.js ecosystem isolated from app code for optimal caching |
| localStorage for favorites | No auth system needed; validated + capped to prevent abuse |
| CSP in enforcing mode | Production security — no `unsafe-eval`, YouTube/Fonts allowlisted only |
| Build-time YouTube fetch | One API call per build, not per user visit — zero runtime API costs |
| SVG data-URI fallbacks | Inline SVG can't fail to load (unlike external images) |
| JS→CSS scroll bridge | CSS Scroll-Driven Animations API has <75% support; custom properties give same GPU perf with full compat |
| IO-gated scroll listeners | Scroll handlers only active when element is near viewport — zero CPU cost when offscreen |
