import { useEffect, useRef, useId } from 'react'
import { isValidYouTubeId } from '../utils/youtube'

// ── YouTube IFrame API loader (singleton) ──
let ytApiPromise = null

function ensureYTApi() {
    // Already fully loaded
    if (window.YT && window.YT.Player && window.YT.PlayerState) {
        return Promise.resolve()
    }
    if (ytApiPromise) return ytApiPromise

    ytApiPromise = new Promise((resolve) => {
        // The API may already be loading from a previous attempt
        const existingCb = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
            existingCb?.()
            resolve()
        }
        // Only add script tag if not already present
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const script = document.createElement('script')
            script.src = 'https://www.youtube.com/iframe_api'
            document.head.appendChild(script)
        }
    })
    return ytApiPromise
}

/**
 * YouTube player with end-detection via IFrame API.
 * Use key={videoId} on parent to remount for new videos.
 */
export default function YouTubePlayer({
    videoId,
    autoplay = true,
    controls = true,
    muted = false,
    onEnd
}) {
    const uniqueId = useId().replace(/:/g, '_')
    const containerId = `yt-player-${uniqueId}`
    const playerRef = useRef(null)
    const onEndRef = useRef(onEnd)
    onEndRef.current = onEnd

    useEffect(() => {
        let destroyed = false

        if (isValidYouTubeId(videoId)) {
            ensureYTApi().then(() => {
                if (destroyed) return
                const el = document.getElementById(containerId)
                if (!el) return

                playerRef.current = new window.YT.Player(containerId, {
                    videoId,
                    playerVars: {
                        autoplay: autoplay ? 1 : 0,
                        controls: controls ? 1 : 0,
                        modestbranding: 1,
                        rel: 0,
                        playsinline: 1,
                        mute: muted ? 1 : 0,
                        enablejsapi: 1,
                        origin: window.location.origin,
                    },
                    events: {
                        onReady: () => {
                            // Player initialized successfully
                        },
                        onStateChange: (event) => {
                            if (event.data === window.YT.PlayerState.ENDED) {
                                onEndRef.current?.()
                            }
                        },
                        onError: () => {
                            // Silently handle - video still plays, just no end detection
                        }
                    }
                })
            })
        }

        return () => {
            destroyed = true
            try {
                if (playerRef.current?.destroy) {
                    playerRef.current.destroy()
                }
            } catch (e) {
                // Player may already be gone
            }
            playerRef.current = null
        }
    }, [containerId, videoId, autoplay, controls, muted])

    return <div id={containerId} style={{ width: '100%', height: '100%' }} />
}
