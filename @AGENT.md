# Infinite Drive - Build & Run Instructions

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production (includes data fetch) |
| `npm run preview` | Preview production build |
| `npm run fetch-data` | Fetch YouTube stats (requires API key) |

## Environment Variables

Create `.env.local` for local development:

```
YOUTUBE_API_KEY=your_api_key_here
```

For Vercel deployment, add `YOUTUBE_API_KEY` in project settings.

## Project Structure

```
src/
├── App.jsx           # Main 3D experience
├── MobileApp.jsx     # Phone grid view
├── main.jsx          # Entry point with device detection
├── index.css         # Global styles
├── components/       # React components
├── hooks/            # Custom hooks
└── data/
    └── videos.json   # Edit this to manage videos

scripts/
└── fetch-youtube-data.js   # YouTube API fetch script

public/
└── videos-enriched.json    # Generated file (don't edit)
```

## Adding/Removing Videos

1. Edit `src/data/videos.json`
2. Add video with format:
   ```json
   {
     "id": 23,
     "title": "Video Title",
     "description": "Short description",
     "youtubeId": "dQw4w9WgXcQ"
   }
   ```
3. Run `npm run fetch-data` (or deploy to auto-fetch)
4. Video appears in both lanes based on stats

## YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "YouTube Data API v3"
4. Create API key (no OAuth needed)
5. Add key to `.env.local` or Vercel env vars

## Testing Responsive Design

- Desktop: >1024px width
- Tablet: 768-1024px width (simplified 3D)
- Phone: <768px width (grid view)

Use browser DevTools to test breakpoints.

## Deployment

Push to main branch - Vercel auto-deploys.

Build process:
1. `npm run fetch-data` - fetches YouTube stats
2. `vite build` - builds production bundle
3. Deploy to Vercel CDN

## Troubleshooting

**Black billboards:** Check that `occlude` prop is removed from Html components.

**YouTube data not loading:** Verify API key is set and has YouTube Data API enabled.

**3D not rendering:** Check browser console for WebGL errors. Try Chrome.

**Slow on mobile:** Ensure device detection is working - phone should show grid view.

---

## Feature Development Quality Standards

**CRITICAL**: All new features MUST meet the following mandatory requirements before being considered complete.

### Testing Requirements

- **Visual Testing**: Run `npm run dev` and verify features work
- **Responsive Testing**: Test at phone (<768px), tablet (768-1024px), and desktop (>1024px)
- **Browser Testing**: Verify in Chrome, Firefox, Safari
- **Performance**: 3D should run at 60fps on desktop, grid should load quickly on mobile

### Git Workflow Requirements

Before moving to the next feature, ALL changes must be:

1. **Committed with Clear Messages**:
   ```bash
   git add .
   git commit -m "feat(module): descriptive message following conventional commits"
   ```
   - Use conventional commit format: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, etc.
   - Include scope when applicable: `feat(mobile):`, `fix(billboard):`, `perf(3d):`

2. **Pushed to Remote Repository** (when configured):
   ```bash
   git push origin <branch-name>
   ```

3. **Ralph Integration**:
   - Update @fix_plan.md with new tasks before starting work
   - Mark items complete in @fix_plan.md upon completion
   - Update PROMPT.md if development patterns change

### Feature Completion Checklist

Before marking ANY feature as complete, verify:

- [ ] `npm run dev` runs without errors
- [ ] Feature works visually as expected
- [ ] Responsive breakpoints tested
- [ ] No console errors or warnings
- [ ] All changes committed with conventional commit messages
- [ ] @fix_plan.md task marked as complete
- [ ] @AGENT.md updated (if new patterns introduced)

### Key Learnings

- Billboard Html components need `occlude` removed to prevent black boxes
- Three.js performance sensitive to star/building counts - reduce on mobile
- YouTube iframe lazy loading critical for initial load time
- Device detection should happen early in render tree
