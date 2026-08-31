# tdotssolutionsz.com

Source for the TdotsSolutionsz site: a Toronto music video studio's catalogue, built as a
cinematic interface rather than a thumbnail grid.

**Live:** [tdotssolutionsz.com](https://tdotssolutionsz.com)

The catalogue is a single JSON file, and every figure on the site is derived from it at
build time. Check it yourself:

```bash
jq '.videos|length'                    src/data/videos.json   # videos
jq '[.videos[].artist]|unique|length'  src/data/videos.json   # artists
jq '[.videos[].viewCount|tonumber]|add' src/data/videos.json  # total views
```

At the current commit that is 101 videos, 54 artists, uploads from 2012 to 2025.
View counts are refreshed from the YouTube Data API at build time, so the total moves.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # Vitest, prints the suite and case count
npm run build     # fetches YouTube data, then builds
npm run prescan   # pre-commit secret scanner
```

`YOUTUBE_API_KEY` is needed for `npm run build` only. There is no runtime API call.

## Routes

Reachable on the deployed site: `/` cinematic hub · `/videos` WebGL card field ·
`/video/:youtubeId` shareable per-video page · `/web-design`.

Declared in `src/main.jsx` but **not reachable in production**: `/oldvideopage` (the
original 3D city), `/lab`, `/v6`. `vercel.json` rewrites only `/videos`,
`/video/:youtubeId`, `/web-design` and `/photos` to `index.html`, so every other client
route hard-404s at the edge before React Router sees it. Confirm with
`curl -sI https://tdotssolutionsz.com/oldvideopage` (404, `content-type: text/plain`)
against `curl -sI https://tdotssolutionsz.com/videos` (200, `text/html`). Adding them to
the `rewrites` array is the fix.

<details>
<summary>Stack and architecture</summary>

React 18, Vite 6, React Router 7, Three.js 0.170 with React Three Fiber, Drei and
postprocessing, GSAP, Vitest. Hosted on Vercel.

- **Device-aware routing.** Desktop loads the Three.js scene; mobile is served a
  no-WebGL card grid instead.
- **Build-time data.** `scripts/fetch-youtube-data.js` pulls view counts and upload dates
  at build time, so the client never calls the YouTube API.
- **Hover-scrub previews.** `scripts/build-preview-clips.mjs` cuts short webm/mp4 loops
  with yt-dlp and ffmpeg, using cropdetect debarring and signalstats frame scoring.
- **Security.** CSP with YouTube allowlists, HSTS, COOP, CORP, Permissions-Policy;
  centralised blocking of `javascript:`, `data:`, `vbscript:` and `blob:` URLs;
  prototype-pollution-safe JSON parsing on localStorage reads; a pre-commit secret
  scanner. Run `npm audit` for the current dependency state.

Deep dives: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/CSP_MONITOR.md](docs/CSP_MONITOR.md) · [CHANGELOG.md](CHANGELOG.md)

</details>

<details>
<summary>Note on <code>/v6</code></summary>

`/v6` is an editorial homepage experiment that was built and parked. The owner preferred
the original hub, which is what `/` serves. It is kept in the tree for reference and is
not rewritten in `vercel.json`, so it 404s in production.

</details>
