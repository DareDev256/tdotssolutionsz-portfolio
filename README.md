# TdotsSolutionsz Music Video Portfolio

An immersive synthwave-themed 3D music video portfolio showcasing 22 music videos shot by TdotsSolutionsz. Drive through a neon cityscape and browse videos on billboard displays.

## Features

- **3D Synthwave Experience** — Navigate a neon road with Three.js and React Three Fiber
- **Dual Lane System** — Browse by date (chronological) or featured selections
- **Responsive Design** — Full 3D on desktop, reduced effects on tablet, grid view on mobile
- **YouTube Integration** — Embedded playback with proximity-based audio
- **Theater Mode** — Fullscreen immersive video viewing
- **Vehicle Selection** — Choose between Tron Light Cycle, DeLorean, or Cyber Bike

## Tech Stack

- React 18 + Vite
- Three.js / React Three Fiber / Drei
- Custom GLSL shaders (nebula, fog, star field, particles)
- Post-processing (bloom, chromatic aberration, vignette, scanlines)

## Artists Featured

Shortiie Raw, King Louie, Masicka, Casper TNG, Dundas Dolla, Moshine, Hypa, SLOC, BG, Jay Jay, Street Bud, OG Dre, Big Kitty, Purple, Soodope, H3RSH

## Development

```bash
npm install
npm run dev      # Start dev server on port 5175
npm run build    # Build for production
npm run preview  # Preview production build
```

## Changelog

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
- Major performance overhaul:
  - Removed MSAA 4x multisampling, chromatic aberration, noise, and scanline post-processing
  - Reduced DPR cap from 2x to 1.5x
  - Replaced heavy shader-based fog with built-in Three.js fog
  - Cut grid divisions from 160 to 60
  - Reduced particles from 100+100 to 40+50
  - Cut buildings from 40 to 24
  - Removed per-billboard ground reflection meshes (~116 draw calls saved)
  - Reduced star field from 2000 to 800
  - Removed ProceduralNebula and LaserBeams (heavy shaders)
  - Disabled shadow maps

### v1.0.0
- Replaced placeholder titles with real YouTube video titles and artist names
- Added `artist` and `featured` fields to video data
- Changed "Popular" lane to "Featured" (curated selection)
- Removed fake view counts
- Updated .gitignore for clean repo
- Initial Vercel deployment
