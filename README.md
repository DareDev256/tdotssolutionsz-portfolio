# TdotsSolutionsz Music Video Portfolio

An immersive synthwave-themed 3D music video portfolio showcasing **64 music videos** shot by TdotsSolutionsz. Drive through a neon cityscape and browse videos on billboard displays.

## Features

- **3D Synthwave Experience** — Navigate a neon road with Three.js and React Three Fiber
- **Dual Lane System** — Browse by date (chronological) or popular selections (60K+ views)
- **Responsive Design** — Full 3D on desktop, reduced effects on tablet, scrollable grid on mobile
- **YouTube Integration** — Embedded playback with real view counts and upload dates
- **Theater Mode** — Fullscreen immersive video viewing
- **Vehicle Selection** — Choose between Tron Light Cycle, DeLorean, or Cyber Bike
- **Music Symbol Titles** — Decorative note symbols on billboard titles

## Tech Stack

- React 18 + Vite
- Three.js / React Three Fiber / Drei
- Custom GLSL shaders (fog, star field, particles)
- Post-processing (bloom, vignette)
- Deployed on Vercel

## Artists Featured

Shortiie Raw, King Louie, Masicka, Casper TNG, Dundas Dolla, Moshine, Hypa, SLOC, BG, Jay Jay, Street Bud, OG Dre, Big Kitty, Purple, Soodope, H3RSH, Seanpane, Robin Banks, Murda, Arez, RoadKidd, ScaleBreakerBlo, Big Money, Scooby Blacks, Da Kid Bluntz, Yogi Savage, Flash Milla, Young Blitz, LP, Cuzzin Charlie, T-Dot, Baadass Bukk, and more

## Development

```bash
npm install
npm run dev      # Start dev server on port 5175
npm run build    # Build for production (fetches YouTube data first)
npm run preview  # Preview production build
```

## Changelog

### v1.5.0 (2026-01-27)
- Added music symbols and decorative elements to billboard titles
- Updated fix plan with completion audit — most phases complete
- Added `.vercel` to .gitignore

### v1.4.0
- Added 42 new videos (64 total) featuring Seanpane, Robin Banks, Murda, BG, Arez, RoadKidd, ScaleBreakerBlo, Big Money, Scooby Blacks, Da Kid Bluntz, Yogi Savage, Flash Milla, Young Blitz, LP, Cuzzin Charlie, Sloc, T-Dot, Baadass Bukk, and more
- Lowered Popular threshold from 500K to 60K views (28 videos now qualify)
- All new videos include real YouTube view counts and upload dates (range: 2012–2025)

### v1.3.0
- Renamed from "Infinite Drive" to "Music Video Portfolio" across all views
- Removed all gradient backgrounds and text — replaced with solid neon colors and glows
- Fixed mobile scrolling: phone view now scrolls properly to see all videos
- Loading screen updated to "Loading Portfolio"

### v1.2.0
- Fetched real YouTube upload dates for all 22 videos (range: 2013–2025)
- By Date lane now correctly sorted by actual upload date (newest first)
- Oldest video: Dundas Dolla - 5 AM On The Dundas (2013), newest: H3RSH - Turnt Up (2025)

### v1.1.0
- Fetched real YouTube view counts for all 22 videos
- Popular lane now shows 7 videos with 500K+ real views (Masicka 5.7M, Casper TNG 5.2M, King Louie 2.7M, Street Bud 1.1M, Purple X BG 665K, Hypa 589K, BG 503K)
- Major performance overhaul (removed heavy shaders, reduced draw calls, optimized particles/buildings/stars)

### v1.0.0
- Real YouTube video titles, artist names, and metadata
- Initial Vercel deployment
