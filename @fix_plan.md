# Infinite Drive - Fix Plan

## Phase 1: Foundation (High Priority)
- [ ] Extract video data from App.jsx to `src/data/videos.json`
- [ ] Update App.jsx to load videos from JSON file
- [ ] Fix billboard black box bug (remove occlude, adjust z-position)
- [ ] Create `scripts/fetch-youtube-data.js` for YouTube API integration
- [ ] Add `npm run fetch-data` script to package.json
- [ ] Generate `public/videos-enriched.json` with placeholder data for now

## Phase 2: Data & Lanes (High Priority)
- [ ] Update lane logic to use real uploadDate (newest first for chronological)
- [ ] Change popular threshold from 1M to 500K views
- [ ] Load videos from `videos-enriched.json` instead of static data
- [ ] Test lane sorting works correctly with sample data

## Phase 3: Device Detection & Mobile (Medium Priority)
- [ ] Create `src/hooks/useDeviceType.js` hook
- [ ] Update `main.jsx` to render different components based on device
- [ ] Create `src/MobileApp.jsx` with grid layout
- [ ] Create `src/components/VideoGrid.jsx` component
- [ ] Create `src/components/VideoCard.jsx` component
- [ ] Add mobile styles to index.css
- [ ] Add filter tabs (Latest / Popular) to mobile view

## Phase 4: Tablet Optimization (Medium Priority)
- [ ] Add `reducedEffects` prop to App.jsx
- [ ] Reduce star count when reducedEffects is true
- [ ] Reduce building count when reducedEffects is true
- [ ] Disable scanlines and noise effects on tablet
- [ ] Lower DPR to [1, 1.5] on tablet
- [ ] Test 3D experience on tablet viewport

## Phase 5: Analytics (Medium Priority)
- [ ] Install @vercel/analytics package
- [ ] Add Vercel Analytics to main.jsx
- [ ] Create `src/hooks/useAnalytics.js` for custom events
- [ ] Track billboard_view events with time spent
- [ ] Track lane_switch events
- [ ] Track vehicle_change events
- [ ] Track device_view events

## Phase 6: Performance & Polish (Low Priority)
- [ ] Add lazy loading to YouTube iframes
- [ ] Preload only first 3 video thumbnails
- [ ] Memoize more components to prevent re-renders
- [ ] Test performance on lower-end devices
- [ ] Add loading states for mobile grid

## Phase 7: Build & Deploy (Low Priority)
- [ ] Test `npm run build` works
- [ ] Document YouTube API key setup in README
- [ ] Update @AGENT.md with full build instructions
- [ ] Test deploy to Vercel
- [ ] Verify analytics appear in Vercel dashboard

## Completed
- [x] Project initialization with Ralph
- [x] Design document created

## Notes
- Billboard bug fix is critical - blocks visual testing
- YouTube API key needed for real data (can use placeholder data until then)
- Test responsive breakpoints: 767px, 768px, 1024px, 1025px
- Keep synthwave aesthetic consistent in mobile view
- Focus on MVP first, polish later
