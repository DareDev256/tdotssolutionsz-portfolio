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

### v1.0.0
- Replaced placeholder titles with real YouTube video titles and artist names
- Added `artist` and `featured` fields to video data
- Changed "Popular" lane to "Featured" (curated selection)
- Removed fake view counts
- Updated .gitignore for clean repo
- Initial Vercel deployment
