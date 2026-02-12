import { useEffect } from 'react'
import { VIDEOS } from '../utils/videoData'
import { isValidYouTubeId, extractVideoId } from '../utils/youtube'

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
        const vId = params.get('v')
        if (vId && isValidYouTubeId(vId)) {
            const found = VIDEOS.find(v => v.youtubeId === vId)
            if (found) onFound(found)
        }
    // onFound is stable (useCallback or inline in mount-only parent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sync URL ↔ active video
    useEffect(() => {
        if (showingVideo && activeVideo) {
            const vid = activeVideo.youtubeId || extractVideoId(activeVideo.url)
            if (vid) window.history.replaceState(null, '', `?v=${vid}`)
        } else {
            window.history.replaceState(null, '', window.location.pathname)
        }
    }, [showingVideo, activeVideo])
}
