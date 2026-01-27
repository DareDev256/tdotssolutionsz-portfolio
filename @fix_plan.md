# Infinite Drive - Fix Plan

**Last Updated:** 2026-01-17 (Audit by Claude)

## Phase 1: Foundation (High Priority)
- [x] Extract video data from App.jsx to `src/data/videos.json`
- [x] Update App.jsx to load videos from JSON file
- [x] Fix billboard black box bug (using YouTube thumbnails + CSS overlay instead of Html component)
- [x] Create `scripts/fetch-youtube-data.js` for YouTube API integration
- [x] Add `npm run fetch-data` script to package.json
- [x] Generate `public/videos-enriched.json` with placeholder data

## Phase 2: Data & Lanes (High Priority)
- [x] Update lane logic to use real uploadDate (newest first for chronological)
- [x] Change popular threshold from 1M to 500K views (configured in videos.json settings)
- [ ] Load videos from `videos-enriched.json` instead of static data (currently uses src/data/videos.json)
- [x] Test lane sorting works correctly with sample data

## Phase 3: Device Detection & Mobile (Medium Priority)
- [x] Create `src/hooks/useDeviceType.js` hook
- [x] Update `main.jsx` to render different components based on device
- [x] Create `src/MobileApp.jsx` with grid layout
- [x] Create `src/components/VideoGrid.jsx` component (integrated into MobileApp)
- [x] Create `src/components/VideoCard.jsx` component
- [x] Add mobile styles to MobileApp.css
- [x] Add filter tabs (Latest / Popular) to mobile view

## Phase 4: Tablet Optimization (Medium Priority)
- [x] Add `reducedEffects` prop to App.jsx
- [x] Reduce star count when reducedEffects is true (400 stars)
- [x] Reduce building count when reducedEffects is true (20 per side)
- [x] Disable scanlines and noise effects on tablet
- [x] Lower DPR to [1, 1.5] on tablet (now conditional based on reducedEffects)
- [x] Test 3D experience on tablet viewport

## Phase 5: Analytics (Medium Priority)
- [ ] Install @vercel/analytics package
- [ ] Add Vercel Analytics to main.jsx
- [ ] Create `src/hooks/useAnalytics.js` for custom events
- [ ] Track billboard_view events with time spent
- [ ] Track lane_switch events
- [ ] Track vehicle_change events
- [ ] Track device_view events

## Phase 6: Performance & Polish (Low Priority)
- [x] Add lazy loading to YouTube thumbnails (loading="lazy" on img tags)
- [ ] Preload only first 3 video thumbnails
- [x] Memoize components to prevent re-renders (useMemo, useCallback throughout)
- [ ] Test performance on lower-end devices
- [x] Add loading states for mobile grid (modal animation)

## Phase 7: Build & Deploy (Low Priority)
- [ ] Test `npm run build` works
- [ ] Document YouTube API key setup in README
- [ ] Update @AGENT.md with full build instructions
- [ ] Test deploy to Vercel
- [ ] Verify analytics appear in Vercel dashboard

## Completed
- [x] Project initialization with Ralph
- [x] Design document created
- [x] Core 3D experience with synthwave aesthetic
- [x] Dual-lane system (Chronological + Popular)
- [x] Vehicle selection (TRON, DeLorean, CyberBike)
- [x] Mobile-responsive grid view
- [x] Video modal with autoplay
- [x] YouTube API fetch script
- [x] Device type detection hook

## Notes
- Most foundation work is COMPLETE - project is functional
- Analytics is the main missing feature
- Consider loading from videos-enriched.json for production
- Test responsive breakpoints: 767px, 768px, 1024px, 1025px
- The synthwave aesthetic is consistent across all views
