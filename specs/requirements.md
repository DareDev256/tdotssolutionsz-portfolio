# Infinite Drive - Requirements Specification

## Overview
A synthwave-themed 3D driving portfolio showcasing TdotsSolutionsz video production work. Users scroll to "drive" down a neon highway past video billboards.

## Functional Requirements

### FR1: Video Management
- Videos stored in `src/data/videos.json`
- Each video has: id, title, description, youtubeId
- Build-time script enriches data with YouTube stats
- No backend required - edit JSON and redeploy

### FR2: YouTube Data Integration
- Fetch view counts, upload dates, thumbnails from YouTube API
- Run at build time via `npm run fetch-data`
- Store enriched data in `public/videos-enriched.json`
- Graceful fallback if API unavailable

### FR3: Lane System
- **Chronological Lane (right):** All videos, sorted newest → oldest
- **Popular Lane (left):** Videos with 500K+ views, sorted by view count descending
- User switches lanes with arrow keys or UI buttons

### FR4: Device Support
- **Desktop (>1024px):** Full 3D experience with all effects
- **Tablet (768-1024px):** Simplified 3D with reduced effects
- **Phone (<768px):** Grid view with filter tabs

### FR5: Analytics
- Vercel Analytics for page views
- Custom events for video engagement:
  - billboard_view (with time spent)
  - lane_switch
  - vehicle_change
  - device_view

### FR6: 3D Experience (Desktop/Tablet)
- Scroll-driven camera movement
- YouTube video billboards with thumbnails
- 3 vehicle options: TRON, DeLorean, Cyber Bike
- Toronto cityscape with CN Tower
- Post-processing effects (bloom, vignette, etc.)

### FR7: Mobile Grid View
- 2-column responsive grid
- Video cards with thumbnails
- Filter tabs: "Latest" | "Popular"
- Synthwave aesthetic maintained

## Non-Functional Requirements

### NFR1: Performance
- 60fps on modern desktop
- 30fps minimum on tablet
- <3 second initial load on fast connection
- Lazy load iframes outside viewport

### NFR2: Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile Safari, Chrome for Android

### NFR3: Accessibility
- Keyboard navigation for lane switching
- Alt text for video thumbnails
- Visible focus states

## Technical Constraints
- React 18 with Vite
- Three.js via @react-three/fiber
- Deploy to Vercel
- YouTube API key required for data fetch
