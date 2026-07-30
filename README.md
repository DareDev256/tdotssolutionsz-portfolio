# TdotsSolutionsz — Toronto Creative Production & Software

```
 ████████╗██████╗  ██████╗ ████████╗███████╗
 ╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝
    ██║   ██║  ██║██║   ██║   ██║   ███████╗
    ██║   ██║  ██║██║   ██║   ██║   ╚════██║
    ██║   ██████╔╝╚██████╔╝   ██║   ███████║
    ╚═╝   ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝
    S O L U T I O N S Z  ·  T O R O N T O
  ─ we direct the film · we build the machine ─
```

[![Live Site](https://img.shields.io/badge/LIVE-tdotssolutionsz.com-ff6ec7?style=for-the-badge&logo=vercel&logoColor=white)](https://tdotssolutionsz.com)
[![Catalog](https://img.shields.io/badge/101_VIDEOS-54_ARTISTS-00ffff?style=for-the-badge)](https://tdotssolutionsz.com/videos)
[![Views](https://img.shields.io/badge/25.3M+-TOTAL_VIEWS-ff00ff?style=for-the-badge)](https://tdotssolutionsz.com)
[![Tests](https://img.shields.io/badge/710_TESTS-49_SUITES-00ff41?style=for-the-badge)](.)
[![Version](https://img.shields.io/badge/v6.0.0-studio-ff3b14?style=for-the-badge)](CHANGELOG.md)
[![Security](https://img.shields.io/badge/OWASP_AUDIT-CLEAN-00ff41?style=for-the-badge)](CHANGELOG.md)

> **We direct the film. We build the machine that sells it.**
>
> One Toronto studio doing what most people hire three vendors for: **101 music videos** across **54 artists** (25.3M views, 2012–2025), the art direction around them, and **six web applications live in production**.
>
> The homepage (v6.0.0) leads with evidence rather than atmosphere — the numbers, six credited films you can **scrub with your cursor**, six shipped products, and the full artist credit wall. The 3D catalogue experiences live on at `/videos` and `/oldvideopage`.

### ⚡ Jump In

| Experience | Link | What You'll See |
|-----------|------|-----------------|
| 🏠 **Studio** | [tdotssolutionsz.com](https://tdotssolutionsz.com) | v6 editorial homepage — hover-scrub film tiles cut from the real films, the ledger, Direct/Design/Ship, shipped products, credit wall |
| 🕰️ **Legacy hub** | [tdotssolutionsz.com/hub-legacy](https://tdotssolutionsz.com/hub-legacy) | The previous scroll-cinema hub, kept for rollback |
| 🎞️ **Tunnel (v5.6.0+)** | [tdotssolutionsz.com/videos](https://tdotssolutionsz.com/videos) | White-space WebGL card field — fly forward through the catalog, top-ranked videos in front, full library deeper |
| 🏙️ **Original 3D City** | [tdotssolutionsz.com/oldvideopage](https://tdotssolutionsz.com/oldvideopage) | Preserved Tron-inspired neon metropolis — scroll the highway, pick a lane |
| 🎬 **Video Page** | [tdotssolutionsz.com/video/u3O5PKN9vCQ](https://tdotssolutionsz.com/video/u3O5PKN9vCQ) | Standalone shareable player with related videos & share bar |
| 🎨 **Web Design** | [tdotssolutionsz.com/web-design](https://tdotssolutionsz.com/web-design) | Interactive particle network showcasing web design projects |

---

## ▌ The Experience

This isn't a gallery with thumbnails in a grid. It's a **cinematic streaming interface** built to showcase music videos the way they deserve — dark backgrounds, vibrant accent lighting, and transitions that feel like channel surfing on a premium platform.

### 🎬 Desktop — 3D Neon Cityscape (`/videos`)

A Tron-inspired metropolis you scroll through on a light cycle. 200+ edge-lit buildings, highway arches, data stream pillars, and CN Towers bookend the journey. Video billboards line dual lanes — browse by date or by popularity (60K+ views). Every frame designed with the same cinematic tension as a Director X title sequence.

- **Vehicle Selection** — Tron Light Cycle, DeLorean, or Cyber Bike
- **Theater Mode** — Press `F` for fullscreen immersive playback; arrow keys skip tracks; guarded close animation prevents race conditions on rapid toggles
- **Audio Visualizer** — Press `V` for a beat-synced procedural visualizer with frequency bars, floating particles, speaker-cone bass ring, and VHS scanner sweep — all in the synthwave neon palette
- **Shuffle Play** — Press `S` for random discovery with no-repeat history
- **Fuzzy Search** — Typo-tolerant search across artists and video titles with position-aware ranking (prefix matches outrank mid-string hits)
- **Artist Panel** — Click any artist name for a slide-in sidebar with all their videos and stats
- **Golden Angel Halos** — Deceased artists (Murda, BG) honored with golden halos and ethereal bloom glow
- **Keyboard Shortcuts** — Press `?` to see all controls

### 📱 Mobile — Cinematic Card Grid

Dark glassmorphism cards with floating CSS particles, scanline overlay, and staggered scroll-reveal animations. Every card feels like a still from a music video — not a corporate thumbnail. **Cinematic Reveal**: thumbnails start under a dark radial veil — dimmed, desaturated, like blacked-out film stock. Hover dissolves the veil outward with a camera-iris animation while the image blooms to full vivid color; the title ignites with a pulsing pink↔cyan neon glow. **Vibrancy Pulse**: a diagonal neon light sweep races across the thumbnail while the card border flares through a pink-cyan-purple chromatic cycle — like a film projector powering up. **Culture Canvas**: hover or long-press any card and the grid enters cinematic spotlight mode — surrounding cards dim and desaturate while the focused card lifts with a cyan-pink accent bloom and pulsing glow halo, like theater lights going down on everything except your pick.

- **Hero Card** — Full-width featured video at the top with cinematic gradient overlay
- **Swipe Navigation** — Left/right in the video modal
- **Favorites** — Heart button saves to localStorage with a dedicated filter tab
- **Shuffle & Search** — Same discovery tools as desktop

### 🏠 Hub Landing Page (`/`)

The front door. Moody, atmospheric, and designed to showcase 14 years of Toronto hip-hop video production like a label's homepage — not a portfolio template. Opens with a **cinematic entrance sequence** — theater curtains split apart, logo blooms in with neon flare, title slides in from opposing sides with motion blur, and content cascades in like opening credits. **Cinematic Atmosphere**: a three-layer immersive system — scroll-reactive ambient glow shifts color as you move between sections (purple origins → pink artists → cyan spotlight → orange charts → green eras), CSS-only film grain noise overlay creates authentic analog texture, and a radial vignette darkens the edges like a camera lens. Every section feels like a chapter in a visual narrative. Ambient stage lights slowly orbit the background, making the entire page breathe.

- **"Now Playing" Cinematic Hero** — Full-bleed ultra-wide (21:9) viewport showcasing a random top-20 video. Hover triggers auto-playing YouTube preview (muted) with dual-gradient cinematic overlay, pulsing NOW PLAYING badge, mute/unmute toggle, and WATCH NOW CTA. **3D Portal Frame**: rotating neon torus rings and drifting particles behind the viewport create an Astroworld-inspired gate effect, color-cycling through the neon palette per video. **Scroll-driven animations**: parallax thumbnail shift, dolly zoom scale, staggered info reveal, and reactive neon aura glow that intensifies as you scroll. Responsive: 16:9 tablet, 16:10 mobile. Respects `prefers-reduced-motion`
- **Culture Vault** — Asymmetric editorial grid of 6 featured videos displayed as irregular "digital windows" with angular CSS `clip-path` silhouettes. Hero tile spans 2 columns at 21:9. Hover activates a pulsing neon gradient border glow (pink → purple → cyan) and spring-animated play icon with drop-shadow bloom. Staggered cascade reveal with per-tile delay. Smart curation picks one video per artist by view count. 3-col → 2-col → 1-col responsive. Respects `prefers-reduced-motion`
- **Film Strip** — Continuously scrolling 35mm film strip of the top 14 most-viewed video thumbnails, styled with celluloid sprocket holes, dark film borders, and vignette edge fades. Hover pauses the strip and reveals the artist name. Click any frame to jump to that video. Respects `prefers-reduced-motion`
- **Artist Showcase Ticker** — Infinite CSS marquee of top 12 artists with YouTube thumbnails, video counts, and total views. Hover to pause, seamless edge-fade masking
- **Impact Numbers** — Scroll-triggered animated stat counters using `requestAnimationFrame` with `easeOutExpo` easing. Four neon-accented cards (pink/cyan/gold/green) count up from zero: videos, artists, total views, years active. Each card staggers its entrance with sliding neon accent bars. `tabular-nums` prevents layout shift during counting. Fully responsive (2×2 grid on mobile), respects `prefers-reduced-motion`. 8 tests verify the easing algorithm
- **Top Hits — Ranked Showcase** — Netflix Top 10-style horizontally scrollable strip of the most-viewed productions. Oversized hollow neon rank numbers with per-rank color theming (#1 gold, #2 pink, #3 cyan...), cinematic thumbnail cards with hover zoom + glow, animated view count badges, and staggered scroll-reveal animations. Each card links directly to the video detail page. 16 tests guard ranking integrity, title extraction, and data validation
- **Production Era Timeline** — Horizontal scroll cards grouping 101 videos into four eras (Origins 2010–2014, Rise 2015–2017, Peak 2018–2020, New Wave 2021–2026) with per-era color theming, top video thumbnails, scroll-snap, and timeline connector dots with glow effects
- **Director Credits Roll** — Cinematic end-credits sequence listing all 54 artists sorted by lifetime views. Auto-scrolling vertical ticker with Bebas Neue film-credits typography, dotted leader lines between artist names and stats, scanline film grain overlay, edge-fade vignettes, and neon accent color cycling per row. Hover to pause and browse the full roster. "A PRODUCTION BY TDOTSSOLUTIONSZ" title card with portfolio-wide stats. Inspired by movie end credits — the mic-drop finale before the footer
- **Cinematic Marquee** — Dual-strip infinite scroll filmstrip of video thumbnails running in opposite directions, creating ambient "theater lobby" motion. Top row: most-viewed, bottom row: most-recent. Hover pauses and lifts the frame with neon pink glow and artist name reveal. Edge-fade vignettes, keyboard-accessible, reduced-motion safe. Inspired by Culture III rollout energy
- **Latest Drops — Culture Codex Dynamic Preview** — Netflix-style "New Releases" horizontal scroll rail showing the 8 most recent videos. Drag-to-scroll with pointer capture, "NEW" badge with pulsing neon glow on videos from the last 6 months, staggered entrance animations, and responsive sizing. **Culture Codex Mode**: hover any card and the rail enters cinematic "codex mode" — sibling cards dim to 30% opacity with heavy desaturation (theater lights going down), while the hovered card expands with dramatic neon glow, slow Ken Burns thumbnail zoom, an animated preview progress bar sweeping across the bottom, and a pulsing play icon. A "PREVIEW" label fades in, selling the illusion of a video about to play. Powered entirely by CSS `:has()` — zero JavaScript state. Full `prefers-reduced-motion` support. Think the Migos Culture III rollout meets Netflix hover-to-play
- **Broadcast Bar — "NOW ON AIR"** — A TV-channel-style fixed chyron at the bottom of the viewport that auto-cycles through the top 12 most-viewed videos every 6 seconds. Pulsing LIVE indicator, thumbnail preview, title/artist/views metadata, animated progress sweep bar, and WATCH CTA linking to each video's detail page. Broadcast wipe transitions between entries. Dismissable with sessionStorage persistence. Delayed entrance (2s) avoids competing with the curtain opening. Full `prefers-reduced-motion` support. Mobile-responsive. Makes the Hub feel like tuning into a live music video network
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
| **Routing** | React Router v7 (lazy-loaded `/`, `/video/:youtubeId`, `/videos`, `/web-design`) |
| **3D Engine** | Three.js 0.170 / React Three Fiber / Drei |
| **Post-Processing** | Bloom, Vignette, Noise, Scanline, Chromatic Aberration |
| **Video** | YouTube IFrame API (playback control, auto-advance, end detection) |
| **Testing** | Vitest — 691 tests across 47 suites |
| **Hosting** | Vercel with custom domain (tdotssolutionsz.com) |
| **Build Pipeline** | YouTube API enrichment at build time (zero runtime API costs) |

---

## ▌ Architecture

- **Device-Aware Routing** — Desktop loads full Three.js 3D scene (1.1MB vendor chunk); mobile skips it entirely for a lightweight card grid
- **Dual Lane System** — Videos processed into chronological and popular lanes with dynamic road scaling
- **Build-Time Data** — `fetch-youtube-data.js` pulls real view counts and upload dates from YouTube at build time — zero runtime API dependencies
- **Modular 3D** — Vehicles, effects, scene elements, atmosphere, and particles all extracted into focused modules with barrel exports
- **12 Shared Hooks** — Deep linking, video navigation, shuffle play, favorites, copy-to-clipboard, keyboard shortcuts, search (with `searchWithFallback` utility), device type, fresnel materials, modal keyboard, outside click (supports single or multiple refs), stagger reveal (batch IntersectionObserver for scroll-triggered CSS animations) — plus 2 inline hooks colocated with their components
- **Security Hardened** — 11 HTTP security headers (CSP, HSTS, COOP, CORP, Permissions-Policy blocking 18 browser APIs), YouTube ID validation at all entry points, build-time API response sanitization, HTTPS-enforced share windows, 30-pattern secret scanner enforced via pre-commit hook with test-file coverage for 8 high-confidence credential patterns, 0 dependency vulnerabilities

> Full architecture deep-dive: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

---

## ▌ Development

```bash
npm install
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Fetch YouTube data + production build
npm run build-previews   # Re-cut the homepage hover-scrub clips (needs yt-dlp + ffmpeg)
npm run preview          # Preview production build locally
npm test                 # Run 710 tests across 49 suites
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
│   ├── v6/StudioHome.jsx      # Landing (/) — evidence-first studio page, no Three.js (16.5 kB)
│   ├── v6/StudioHome.css      # v6 design system, scoped under `.v6` so it cannot leak
│   ├── HubPageCinema.jsx      # Previous hub, preserved at /hub-legacy
│   ├── VideoPage.jsx          # Standalone video detail (shareable, no Three.js)
│   ├── VideoSpotlight.jsx     # Full-bleed hover-to-play hero with 3D portal frame
│   ├── SpotlightPortal.jsx    # Three.js neon rings + particle backdrop for spotlight
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
├── hooks/                     # 12 shared hooks (+ 3 inline hooks in components)
├── utils/                     # videoData, youtube, urlSafety, apiSanitizer, youtubeSanitizer, searchScoring, easing, formatters, audioAttenuation, imageFallback
└── data/                      # videos.json (101 entries), photos.json (25 entries),
                               # studio.js (v6 copy + builds; stats DERIVED from videos.json)

public/
├── previews/                  # Hover-scrub loops: {youtubeId}.webm/.mp4/.jpg — built by
│                              # scripts/build-preview-clips.mjs, preload="none"
├── brand/mark.svg             # Primary favicon / nav mark
└── sites/                     # Client site screenshots for the Builds section

scripts/
├── build-preview-clips.mjs    # yt-dlp + ffmpeg: cropdetect debarring, signalstats
│                              # frame scoring, poster extraction
└── og-card.html               # Source for public/og-image.png (render at 1200x630)
```

### Social card

`public/og-image.png` is a screenshot of `scripts/og-card.html` at exactly 1200x630,
so it uses the site's own Archivo / Space Mono. Regenerate it whenever the headline
or the four numbers change.

---

## ▌ Security & Performance

This portfolio is hardened beyond what most SPAs bother with — because if the site goes down or gets hijacked, the work doesn't speak for itself.

| Category | Detail |
|----------|--------|
| **HTTP Headers** | 11 security headers: CSP, HSTS (preload), COOP, CORP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy (18 APIs blocked) |
| **Content Security** | Strict CSP with YouTube/Google allowlists — no `unsafe-eval`, no `unsafe-inline` in production |
| **Secret Scanning** | 30-pattern pre-commit scanner detects AWS keys, GitHub tokens, OpenAI/Anthropic keys, private keys, DB URIs, and more — with documentation-aware skip rules to eliminate false positives |
| **Dependency Audit** | `npm audit` integrated into CI — zero high/critical vulnerabilities |
| **Video Integrity** | 21 dedicated playback tests guard CSP, referrer policy, iframe config, and YouTube ID validation |
| **Runtime Monitoring** | CSP violation event listener captures blocked injection attempts with dedup + rate limiting; boot-time integrity checks for DOM clobbering, iframe injection, and tabnapping |
| **URL & Data Safety** | Centralized dangerous-scheme blocking (`javascript:`, `data:`, `vbscript:`, `blob:`), origin-pinned `replaceState`, prototype-pollution-safe JSON parsing for all localStorage reads |
| **Build-Time Sanitizer** | YouTube API responses pass through HTML stripping, origin-allowlisted thumbnail validation, prototype pollution removal, and ID cross-checking before entering the client bundle |
| **Runtime Monitoring** | CSP violation listener + postMessage origin guard + iframe origin audit — captures blocked injections, rogue extensions, and DOM tampering with dedup + rate limiting. Deep-dive: **[docs/CSP_MONITOR.md](docs/CSP_MONITOR.md)** |
| **Build Performance** | Code-split: Three.js vendor chunk (1.1 MB) loads only on desktop `/videos`; mobile gets a zero-WebGL bundle |
| **Lighthouse** | 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO (desktop) |

---

## ▌ Changelog

See **[CHANGELOG.md](CHANGELOG.md)** for full version history.

**Latest — v4.0.2** (2026-04-07): Fixed broken portfolio navigation links in README — replaced placeholder video ID with actual catalog entry (Masicka — Everything Mi Want), added missing Web Design page to navigation table, corrected routing list to reflect active `/web-design` route instead of disabled `/photos`.

> Architecture and research docs: **[docs/](docs/)** · Security deep-dive: **[docs/CSP_MONITOR.md](docs/CSP_MONITOR.md)**

---

<p align="center">
  <code>▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰</code><br><br>
  <strong>TdotsSolutionsz</strong> — Toronto, Ontario<br>
  Music Video Production & Direction · 14 Years · 54 Artists · 25.3M+ Views<br>
  <a href="https://tdotssolutionsz.com">tdotssolutionsz.com</a><br><br>
  <sub>Built with React · Three.js · Vitest · Vercel</sub><br>
  <sub>Designed like an album campaign, engineered like a streaming platform</sub>
</p>
