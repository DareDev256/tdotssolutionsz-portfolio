# TdotsSolutionsz Music Video Portfolio

An immersive synthwave-themed 3D music video portfolio showcasing **86 music videos** shot by TdotsSolutionsz. Drive through a neon cityscape and browse videos on billboard displays.

## Features

- **3D Synthwave Experience** — Navigate a neon road with Three.js and React Three Fiber
- **Dual Lane System** — Browse by date (chronological) or popular selections (60K+ views, 37 videos qualify)
- **Responsive Design** — Full 3D on desktop, reduced effects on tablet, scrollable grid on mobile
- **YouTube Integration** — Embedded playback with real view counts and upload dates
- **Theater Mode** — Fullscreen immersive video viewing (press F)
- **Vehicle Selection** — Choose between Tron Light Cycle, DeLorean, or Cyber Bike
- **TDots Solutionsz Logo** — Custom branding with CN Tower silhouette and neon glow

## Tech Stack

- React 18 + Vite
- Three.js / React Three Fiber / Drei
- Post-processing (bloom, vignette, soft particles, enhanced star field)
- Deployed on Vercel

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
