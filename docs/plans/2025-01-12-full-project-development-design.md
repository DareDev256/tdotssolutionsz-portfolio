# Infinite Drive - Full Project Development Design

**Date:** 2025-01-12
**Purpose:** Personal portfolio + TdotsSolutionsz business showcase

## Overview

Transform the existing synthwave 3D driving portfolio into a production-ready site with video management, real YouTube data, analytics, mobile support, and performance fixes.

## Features

### 1. Video Management (JSON-based)
- Simple `videos.json` file for easy editing
- No backend required - edit and redeploy
- Build-time enrichment with YouTube API data

### 2. YouTube Data Integration
- Build-time fetch via YouTube Data API v3
- Real view counts and upload dates
- Automatic thumbnail URLs
- Runs on every deploy

### 3. Lane Configuration
- **Chronological Lane:** Newest → Oldest (real upload dates)
- **Popular Lane:** 500K+ views threshold, sorted by view count

### 4. Analytics
- Vercel Analytics for page views/visitors
- Custom event tracking for video engagement:
  - Billboard views + time spent
  - Lane switching behavior
  - Vehicle selection
  - Device type breakdown

### 5. Mobile Experience (Hybrid)
- **Phone (<768px):** Grid view with filter tabs
- **Tablet (768-1024px):** Simplified 3D with reduced effects
- **Desktop (>1024px):** Full 3D experience

### 6. Performance Fixes
- Fix billboard black box bug (remove occlude, adjust z-position)
- Reduce particle counts on tablet
- Lazy load YouTube iframes
- Optimize post-processing for devices

---

## Technical Design

### Project Structure

```
src/
├── App.jsx                    # Main 3D experience (refactored)
├── MobileApp.jsx              # Grid view for phones
├── components/
│   ├── Scene.jsx              # 3D scene extracted
│   ├── VideoGrid.jsx          # Mobile grid component
│   ├── VideoCard.jsx          # Individual video card
│   └── ui/                    # UI components
├── hooks/
│   ├── useDeviceType.js       # Device detection
│   └── useAnalytics.js        # Video engagement tracking
├── data/
│   └── videos.json            # Editable video data
├── index.css
└── main.jsx

scripts/
└── fetch-youtube-data.js      # Build-time YouTube fetch

public/
└── videos-enriched.json       # Generated with real stats
```

### Video Data Format

**Input (`src/data/videos.json`):**
```json
{
  "videos": [
    {
      "id": 1,
      "title": "Synthwave Beats",
      "description": "Original vibes",
      "youtubeId": "9hRUzEGfW7o"
    }
  ],
  "settings": {
    "popularThreshold": 500000,
    "chronologicalOrder": "newest-first"
  }
}
```

**Output (`public/videos-enriched.json`):**
```json
{
  "videos": [
    {
      "id": 1,
      "title": "Synthwave Beats",
      "description": "Original vibes",
      "youtubeId": "9hRUzEGfW7o",
      "viewCount": 850000,
      "uploadDate": "2023-01-15T00:00:00Z",
      "thumbnail": "https://img.youtube.com/vi/9hRUzEGfW7o/maxresdefault.jpg",
      "duration": "PT3M45S"
    }
  ],
  "settings": { ... },
  "lastFetched": "2025-01-12T15:30:00Z"
}
```

### Device Breakpoints

| Device | Width | Experience |
|--------|-------|------------|
| Phone | <768px | Grid view |
| Tablet | 768-1024px | Simplified 3D |
| Desktop | >1024px | Full 3D |

### Performance Targets

| Metric | Phone | Tablet | Desktop |
|--------|-------|--------|---------|
| Stars | N/A | 100 | 250 |
| Buildings | N/A | 20 | 30 |
| Post-processing | N/A | 3 effects | 5 effects |
| DPR | N/A | [1, 1.5] | [1.5, 2] |

### Analytics Events

```javascript
track('billboard_view', { videoId, title, lane, timeSpent })
track('lane_switch', { from, to })
track('vehicle_change', { vehicle })
track('device_view', { type, view })
```

---

## Bug Fixes Required

### Billboard Black Box Issue
- Remove `occlude="blending"` from Html component
- Set position z to 0.1 (forward)
- Add `pointerEvents="none"`
- Set explicit `zIndexRange`

---

## Build & Deploy

**Scripts:**
```json
{
  "dev": "vite",
  "build": "npm run fetch-data && vite build",
  "fetch-data": "node scripts/fetch-youtube-data.js",
  "preview": "vite preview"
}
```

**Environment Variables:**
- `YOUTUBE_API_KEY` - Required for build-time data fetch

**Deploy Flow:**
1. Edit `videos.json`
2. Push to Git
3. Vercel auto-deploys
4. `fetch-data` script runs
5. Site builds with fresh YouTube stats
