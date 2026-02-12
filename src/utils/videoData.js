/**
 * Shared video data processing — single source of truth for both
 * App.jsx (desktop 3D) and MobileApp.jsx (mobile grid).
 *
 * Eliminates duplicated video transformation, artist extraction,
 * and artist stats computation that previously lived in both files.
 */
import rawVideoData from '../data/videos.json'

export const NEON_COLORS = ['#ff2a6d', '#05d9e8', '#d300c5', '#7700ff', '#ff6b35', '#ffcc00', '#00ff88', '#ff00ff']

/** Transform raw JSON entries to include full YouTube URLs */
export const VIDEOS = rawVideoData.videos.map(video => ({
    ...video,
    url: `https://www.youtube.com/watch?v=${video.youtubeId}`
}))

export const POPULAR_THRESHOLD = rawVideoData.settings?.popularThreshold || 500000

/** Unique sorted artist names */
export const ALL_ARTISTS = [...new Set(VIDEOS.map(v => v.artist))].sort()

/** Pre-computed per-artist stats: count, totalViews, date range */
export const ARTIST_STATS = VIDEOS.reduce((acc, v) => {
    if (!acc[v.artist]) {
        acc[v.artist] = { count: 0, totalViews: 0, earliest: v.uploadDate, latest: v.uploadDate }
    }
    const s = acc[v.artist]
    s.count++
    s.totalViews += v.viewCount
    if (v.uploadDate < s.earliest) s.earliest = v.uploadDate
    if (v.uploadDate > s.latest) s.latest = v.uploadDate
    return acc
}, {})

/** Portfolio-wide aggregate stats (pre-computed at import time) */
export const PORTFOLIO_STATS = {
    totalVideos: VIDEOS.length,
    totalArtists: ALL_ARTISTS.length,
    totalViews: VIDEOS.reduce((sum, v) => sum + v.viewCount, 0),
    earliestDate: VIDEOS.reduce((min, v) => v.uploadDate < min ? v.uploadDate : min, VIDEOS[0]?.uploadDate || ''),
    latestDate: VIDEOS.reduce((max, v) => v.uploadDate > max ? v.uploadDate : max, VIDEOS[0]?.uploadDate || ''),
    topArtist: ALL_ARTISTS.reduce((top, a) => {
        const s = ARTIST_STATS[a]
        return (!top || s.totalViews > top.totalViews) ? { name: a, ...s } : top
    }, null),
}

/** Artists who have passed — shown with golden halo on billboards */
export const DECEASED_ARTISTS = new Set(['Murda', 'BG'])

/** Check if any part of a multi-artist string includes a deceased artist */
export function isDeceasedArtist(artistField) {
    if (!artistField) return false
    return artistField.split(',').some(a => DECEASED_ARTISTS.has(a.trim()))
}

/** Lane layout configuration for the 3D billboard system */
export const LANE_CONFIG = {
    CHRONOLOGICAL: { x: 6, label: 'BY DATE' },
    POPULAR: { x: -6, label: 'MOST POPULAR' },
    CENTER: { x: 0 },
    BILLBOARD_Y: 4.5,
    BILLBOARD_Z_START: -25,
    BILLBOARD_Z_SPACING: 28,
    POPULAR_THRESHOLD,
}

/** Process videos into positional lanes for 3D billboards */
export function processVideosIntoLanes() {
    const chronological = [...VIDEOS]
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .map((video, index) => ({
            ...video,
            color: NEON_COLORS[index % NEON_COLORS.length],
            lane: 'chronological',
            position: [
                LANE_CONFIG.CHRONOLOGICAL.x,
                LANE_CONFIG.BILLBOARD_Y,
                LANE_CONFIG.BILLBOARD_Z_START - (index * LANE_CONFIG.BILLBOARD_Z_SPACING)
            ]
        }))

    const popular = [...VIDEOS]
        .filter(v => v.viewCount >= LANE_CONFIG.POPULAR_THRESHOLD)
        .sort((a, b) => b.viewCount - a.viewCount)
        .map((video, index) => ({
            ...video,
            color: NEON_COLORS[(index + 3) % NEON_COLORS.length],
            lane: 'popular',
            position: [
                LANE_CONFIG.POPULAR.x,
                LANE_CONFIG.BILLBOARD_Y,
                LANE_CONFIG.BILLBOARD_Z_START - (index * LANE_CONFIG.BILLBOARD_Z_SPACING)
            ],
            laneId: `popular-${video.id}`
        }))

    return { chronological, popular, all: [...chronological, ...popular] }
}
