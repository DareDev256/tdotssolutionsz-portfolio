import { useEffect } from 'react'
import { VIDEOS } from '../utils/videoData'
import { isValidYouTubeId, extractVideoId } from '../utils/youtube'

/**
 * Resolve a ?v= query-param value to a video from the catalog.
 * Returns null if the ID is invalid or not in the catalog.
 * @internal Exported for testing
 * @param {string|null} vId - YouTube video ID from query string
 * @param {Array} catalog - Video catalog to search
 * @returns {object|null} Matching video object, or null
 */
export function resolveDeepLink(vId, catalog) {
    if (!vId || !isValidYouTubeId(vId)) return null
    return catalog.find(v => v.youtubeId === vId) || null
}

/**
 * Build the URL string that should be set via replaceState.
 * @internal Exported for testing
 * @param {object|null} activeVideo - Currently active video
 * @param {boolean} showingVideo - Whether a video is actively displayed
 * @returns {string|null} URL to set, or null to clear to pathname
 */
export function buildVideoUrl(activeVideo, showingVideo) {
    if (showingVideo && activeVideo) {
        const vid = activeVideo.youtubeId || extractVideoId(activeVideo.url)
        return vid ? `?v=${vid}` : null
    }
    return null
}

/**
 * Read ?v= deep-link on mount and sync the URL as the active video changes.
 *
 * @param {object|null} activeVideo - Currently playing/selected video object
 * @param {(video: object) => void} onFound - Called when a valid deep-link video is found on mount
 * @param {boolean} [isActive] - Whether a video is actively shown (controls URL sync).
 *   Defaults to !!activeVideo. Desktop passes `theaterMode && !!activeProject`.
 */
export default function useVideoDeepLink(activeVideo, onFound, isActive) {
    const showingVideo = isActive !== undefined ? isActive : !!activeVideo

    // Read ?v= on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const found = resolveDeepLink(params.get('v'), VIDEOS)
        if (found) onFound(found)
    // onFound is stable (useCallback or inline in mount-only parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sync URL ↔ active video
    useEffect(() => {
        const url = buildVideoUrl(activeVideo, showingVideo)
        window.history.replaceState(null, '', url || window.location.pathname)
    }, [showingVideo, activeVideo])
}
