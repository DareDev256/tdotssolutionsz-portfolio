# TdotsSolutionsz — Toronto's Hip-Hop Visual Engine

```
 ████████╗██████╗  ██████╗ ████████╗███████╗
 ╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝
    ██║   ██║  ██║██║   ██║   ██║   ███████╗
    ██║   ██║  ██║██║   ██║   ██║   ╚════██║
    ██║   ██████╔╝╚██████╔╝   ██║   ███████║
    ╚═╝   ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝
    S O L U T I O N S Z  ·  T O R O N T O
    ─── music video production since 2010 ───
```

[![Live Site](https://img.shields.io/badge/LIVE-tdotssolutionsz.com-ff6ec7?style=for-the-badge&logo=vercel&logoColor=white)](https://tdotssolutionsz.com)
[![Catalog](https://img.shields.io/badge/101_VIDEOS-54_ARTISTS-00ffff?style=for-the-badge)](https://tdotssolutionsz.com/videos)
[![Views](https://img.shields.io/badge/25.3M+-TOTAL_VIEWS-ff00ff?style=for-the-badge)](https://tdotssolutionsz.com)
[![Tests](https://img.shields.io/badge/350_TESTS-28_SUITES-00ff41?style=for-the-badge)](.)
[![Version](https://img.shields.io/badge/v3.24.2-synthwave-blueviolet?style=for-the-badge)](CHANGELOG.md)

> **If a music video label had its own streaming platform, it would look like this.**
>
> An immersive, cinematic-dark portfolio showcasing **101 music videos** across **54 artists** — 14 years of Toronto hip-hop production rendered as a neon-soaked 3D metropolis you drive through. Full-bleed video previews. Hover-to-play cinematics. Moody lighting that makes every thumbnail feel like an album campaign. Think the **Migos Culture III rollout** meets a **Netflix UI** designed by a synthwave art director.

### ⚡ Jump In

| Experience | Link | What You'll See |
|-----------|------|-----------------|
| 🏠 **Hub** | [tdotssolutionsz.com](https://tdotssolutionsz.com) | Cinematic hero with hover-to-play, artist ticker, era timeline |
| 🏙️ **3D City** | [tdotssolutionsz.com/videos](https://tdotssolutionsz.com/videos) | Tron-inspired neon metropolis — scroll the highway, pick a lane |
| 🎬 **Video Page** | [tdotssolutionsz.com/video/dQw4w9WgXcQ](https://tdotssolutionsz.com/video/dQw4w9WgXcQ) | Standalone shareable player with related videos & share bar |

---

## ▌ The Experience

This isn't a gallery with thumbnails in a grid. It's a **cinematic streaming interface** built to showcase music videos the way they deserve — dark backgrounds, vibrant accent lighting, and transitions that feel like channel surfing on a premium platform.

### 🎬 Desktop — 3D Neon Cityscape (`/videos`)

A Tron-inspired metropolis you scroll through on a light cycle. 200+ edge-lit buildings, highway arches, data stream pillars, and CN Towers bookend the journey. Video billboards line dual lanes — browse by date or by popularity (60K+ views). Every frame designed with the same cinematic tension as a Director X title sequence.

- **Vehicle Selection** — Tron Light Cycle, DeLorean, or Cyber Bike
- **Theater Mode** — Press `F` for fullscreen immersive playback; arrow keys skip tracks
- **Audio Visualizer** — Press `V` for a beat-synced procedural visualizer with frequency bars, floating particles, speaker-cone bass ring, and VHS scanner sweep — all in the synthwave neon palette
- **Shuffle Play** — Press `S` for random discovery with no-repeat history
- **Fuzzy Search** — Typo-tolerant search across artists and video titles
- **Artist Panel** — Click any artist name for a slide-in sidebar with all their videos and stats
- **Golden Angel Halos** — Deceased artists (Murda, BG) honored with golden halos and ethereal bloom glow
- **Keyboard Shortcuts** — Press `?` to see all controls

### 📱 Mobile — Cinematic Card Grid

Dark glassmorphism cards with floating CSS particles, scanline overlay, and staggered scroll-reveal animations. Every card feels like a still from a music video — not a corporate thumbnail.

- **Hero Card** — Full-width featured video at the top with cinematic gradient overlay
- **Swipe Navigation** — Left/right in the video modal
- **Favorites** — Heart button saves to localStorage with a dedicated filter tab
- **Shuffle & Search** — Same discovery tools as desktop

### 🏠 Hub Landing Page (`/`)

The front door. Moody, atmospheric, and designed to showcase 14 years of Toronto hip-hop video production like a label's homepage — not a portfolio template.

- **"Now Playing" Cinematic Hero** — Full-bleed ultra-wide (21:9) viewport showcasing a random top-20 video. Hover triggers auto-playing YouTube preview (muted) with dual-gradient cinematic overlay, pulsing NOW PLAYING badge, mute/unmute toggle, and WATCH NOW CTA. **Scroll-driven animations**: parallax thumbnail shift, dolly zoom scale, staggered info reveal, and reactive neon aura glow that intensifies as you scroll. Responsive: 16:9 tablet, 16:10 mobile. Respects `prefers-reduced-motion`
- **Artist Showcase Ticker** — Infinite CSS marquee of top 12 artists with YouTube thumbnails, video counts, and total views. Hover to pause, seamless edge-fade masking
- **Live Stats Counter** — Animated count-up (requestAnimationFrame + ease-out cubic): 101 videos, 54 artists, 25.3M+ views, 14 years
- **Production Era Timeline** — Horizontal scroll cards grouping 101 videos into four eras (Origins 2010–2014, Rise 2015–2017, Peak 2018–2020, New Wave 2021–2026) with per-era color theming, top video thumbnails, scroll-snap, and timeline connector dots with glow effects
- **Split Navigation** — Two-card entry to Music Videos (live) and Photography (coming soon) with animated gradient borders and backdrop blur

### 🔗 Video Detail Page (`/video/:youtubeId`)

Every video gets its own shareable, SEO-friendly URL. Lightweight (6 kB gzipped, zero Three.js), fast-loading, independently linkable — like each track having its own landing page on a streaming service.

- **Embedded Player** — Privacy-enhanced YouTube embed with neon-bordered frame and CRT scanline overlay
- **Metadata Display** — Artist, title, views, year, and artist video count in stat pills
- **Share Bar** — Copy link, share to X/Twitter, share to WhatsApp
- **Related Videos** — Grid of up to 6 related videos (same artist first, then popular picks)
- **3D CTA** — "Watch in 3D" link to the full synthwave highway experience
- **Branded 404** — Glitch-animated 404 page for invalid video IDs or unknown routes

---

## ▌ The Roster

| Artist | Highlight | Views |
|--------|-----------|-------|
| **Masicka** | Everything Mi Want | 5.7M |
| **Casper TNG** | Dope Boy | 5.2M |
| **King Louie** | Made Drill | 2.7M |
| **Street Bud** | No Cap | 1.1M |
| **Robin Banks** | Malis Off A Molly | 986K |
| **BG** ✝ | 96 Days | 503K |
| **Jose Guapo** | Where is the Love (WSHH) | 430K |
| **Smiley** | Bumpin (pre-OVO/Drake era) | 178K |
| **Shortiie Raw** | 10 videos in the catalog | — |

Plus Dundas Dolla, Moshine, Hypa, SLOC, Arez, RoadKidd, LV, Da Kid Bluntz, Daz Dinero, Cboz, Scooby Blacks, OG Dre, Big Kitty, Seanpane, Murda ✝, Soodope, H3RSH, and more — **54 artists** across 14 years.

---

## ▌ Design Philosophy

**Visual references**: Migos Culture III rollout · Travis Scott Astroworld site · Director X portfolio · Michael Jackson Thriller-era visuals

| Principle | Implementation |
|-----------|---------------|
| **Cinematic dark** | `#0a0a1a` base, no white backgrounds ever. Every surface is a dark canvas |
| **Vibrant accents** | Neon cyan `#00ffff`, hot pink `#ff6ec7`, purple `#bf00ff` — never muted pastels |
| **Full-bleed media** | Video previews bleed to viewport edges. No safe-area padding on hero content |
| **Hover-to-play** | Spotlighted videos auto-preview on hover — Netflix-style discovery |
| **Moody lighting** | Bloom post-processing, vignette, scanlines, chromatic aberration. Every frame has atmosphere |
| **No grid gallery** | Videos are billboards in a 3D city, not cards in a 12-column grid |

---

## ▌ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 6 (code-split with React.lazy + manual chunks) |
| **Routing** | React Router v7 (lazy-loaded `/`, `/video/:youtubeId`, `/videos`, `/photos`) |
| **3D Engine** | Three.js 0.170 / React Three Fiber / Drei |
| **Post-Processing** | Bloom, Vignette, Noise, Scanline, Chromatic Aberration |
| **Video** | YouTube IFrame API (playback control, auto-advance, end detection) |
| **Testing** | Vitest — 350 tests across 28 suites |
| **Hosting** | Vercel with custom domain (tdotssolutionsz.com) |
| **Build Pipeline** | YouTube API enrichment at build time (zero runtime API costs) |

---

## ▌ Architecture

- **Device-Aware Routing** — Desktop loads full Three.js 3D scene (1.1MB vendor chunk); mobile skips it entirely for a lightweight card grid
- **Dual Lane System** — Videos processed into chronological and popular lanes with dynamic road scaling
- **Build-Time Data** — `fetch-youtube-data.js` pulls real view counts and upload dates from YouTube at build time — zero runtime API dependencies
- **Modular 3D** — Vehicles, effects, scene elements, atmosphere, and particles all extracted into focused modules with barrel exports
- **9 Shared Hooks** — Deep linking, video navigation, shuffle play, favorites, copy-to-clipboard, keyboard shortcuts, search, device type, fresnel materials — plus 3 inline hooks colocated with their components
- **Security Hardened** — 11 HTTP security headers (CSP, HSTS, COOP, CORP, Permissions-Policy blocking 18 browser APIs), YouTube ID validation at all entry points, HTTPS-enforced share windows, 30-pattern secret scanning

> Full architecture deep-dive: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## ▌ Development

```bash
npm install
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Fetch YouTube data + production build
npm run preview          # Preview production build locally
npm test                 # Run 350 tests
npm run test:watch       # Tests in watch mode
npm run prescan          # Scan for leaked secrets
npm run audit:security   # Dependency vulnerability check
```

### Environment Variables

| Variable | Purpose | Where |
|----------|---------|-------|
| `YOUTUBE_API_KEY` | Build-time video data enrichment | Vercel env var |

---

## ▌ Project Structure

```
src/
├── App.jsx                    # Desktop 3D experience (~1,022 lines)
├── MobileApp.jsx              # Mobile grid view
├── components/
│   ├── HubPage.jsx            # Landing — cinematic hub with Now Playing hero
│   ├── VideoPage.jsx          # Standalone video detail (shareable, no Three.js)
│   ├── VideoSpotlight.jsx     # Full-bleed hover-to-play hero with scroll animations
│   ├── ArtistShowcase.jsx     # Infinite marquee ticker of top artists
│   ├── EraTimeline.jsx        # Four-era horizontal scroll timeline
│   ├── VideoCard.jsx          # Mobile video card with glassmorphism
│   ├── YouTubePlayer.jsx      # YouTube IFrame API wrapper
│   ├── 3d/vehicles/           # TronLightCycle, DeLorean, CyberBike
│   ├── 3d/scene/              # CNTower, Cityscape, TronBuilding, HighwayArch, DataStream
│   ├── 3d/effects/            # StarField, SynthwaveSun
│   ├── atmosphere/            # EnhancedStarField, GroundFog, ProceduralNebula
│   ├── particles/             # SoftParticles
│   └── ui/                    # SearchBar, ArtistPanel, TheaterMode, KeyboardGuide,
│                              # SectionLabel, AudioVisualizer
├── hooks/                     # 9 shared hooks (+ 3 inline hooks in components)
├── utils/                     # videoData, youtube, formatters, audioAttenuation, imageFallback
└── data/                      # videos.json (101 entries), photos.json (25 entries)
```

---

## ▌ Security & Performance

This portfolio is hardened beyond what most SPAs bother with — because if the site goes down or gets hijacked, the work doesn't speak for itself.

| Category | Detail |
|----------|--------|
| **HTTP Headers** | 11 security headers: CSP, HSTS (preload), COOP, CORP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy (18 APIs blocked) |
| **Content Security** | Strict CSP with YouTube/Google allowlists — no `unsafe-eval`, no `unsafe-inline` in production |
| **Secret Scanning** | 30-pattern pre-commit scanner catches `sk-`, `ghp_`, `AKIA`, Bearer tokens, private keys, DB URIs |
| **Dependency Audit** | `npm audit` integrated into CI — zero high/critical vulnerabilities |
| **Video Integrity** | 21 dedicated playback tests guard CSP, referrer policy, iframe config, and YouTube ID validation |
| **Build Performance** | Code-split: Three.js vendor chunk (1.1 MB) loads only on desktop `/videos`; mobile gets a zero-WebGL bundle |
| **Lighthouse** | 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO (desktop) |

---

## ▌ Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for full version history.

**Latest — v3.24.2** (2026-02-24): Portfolio-grade README rewrite — ASCII banner, live preview links, security showcase.

> Architecture and research docs: **[docs/](docs/)**

---

<p align="center">
  <code>▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰</code><br><br>
  <strong>TdotsSolutionsz</strong> — Toronto, Ontario<br>
  Music Video Production & Direction · 14 Years · 54 Artists · 25.3M+ Views<br>
  <a href="https://tdotssolutionsz.com">tdotssolutionsz.com</a><br><br>
  <sub>Built with React · Three.js · Vitest · Vercel</sub><br>
  <sub>Designed like an album campaign, engineered like a streaming platform</sub>
</p>
