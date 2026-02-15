import { useEffect, useRef } from 'react'
import { isValidYouTubeId } from '../utils/youtube'
import { logError, ErrorCategory } from '../utils/errorHandling'

// ── YouTube IFrame API loader (singleton) ──
let ytApiPromise = null

function ensureYTApi() {
    // Already fully loaded
    if (window.YT && window.YT.Player && window.YT.PlayerState) {
        return Promise.resolve()
    }
    if (ytApiPromise) return ytApiPromise

    ytApiPromise = new Promise((resolve, reject) => {
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
            script.onerror = () => {
                ytApiPromise = null // Allow retry on failure
                reject(new Error('YouTube IFrame API failed to load'))
            }
            document.head.appendChild(script)
        }
    })
    return ytApiPromise
}

/**
 * YouTube player with end-detection via IFrame API.
 *
 * Uses a ref-managed wrapper so React never tries to removeChild
 * on the div that the YT API replaces with an iframe internally.
 * Switches videos via loadVideoById() instead of destroy/recreate.
 */
export default function YouTubePlayer({
    videoId,
    autoplay = true,
    controls = true,
    muted = false,
    onEnd
}) {
    const wrapperRef = useRef(null)
    const playerRef = useRef(null)
    const onEndRef = useRef(onEnd)
    const currentVideoRef = useRef(null)
    onEndRef.current = onEnd

    useEffect(() => {
        let destroyed = false
        let localPlayer = null // Track THIS effect's player instance
        const wrapper = wrapperRef.current
        if (!wrapper || !isValidYouTubeId(videoId)) return

        // If player already exists, just switch the video
        if (playerRef.current && currentVideoRef.current !== videoId) {
            try {
                // Verify player is still functional before switching
                if (typeof playerRef.current.getPlayerState === 'function') {
                    playerRef.current.loadVideoById(videoId)
                    // Don't update currentVideoRef here — wait for onReady
                } else {
                    playerRef.current = null
                }
            } catch (error) {
                logError(ErrorCategory.PLAYER, 'switchVideo', error, { videoId })
                playerRef.current = null
            }
            if (playerRef.current) return
        }

        // Create a fresh target div for the YT API to consume
        const targetDiv = document.createElement('div')
        targetDiv.style.width = '100%'
        targetDiv.style.height = '100%'
        wrapper.innerHTML = ''
        wrapper.appendChild(targetDiv)

        ensureYTApi().then(() => {
            if (destroyed) return

            localPlayer = new window.YT.Player(targetDiv, {
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
                        if (!destroyed) currentVideoRef.current = videoId
                    },
                    onStateChange: (event) => {
                        if (!destroyed && event.data === window.YT.PlayerState.ENDED) {
                            onEndRef.current?.()
                        }
                    },
                    onError: (event) => {
                        logError(ErrorCategory.PLAYER, 'onPlayerError', event?.data,
                            { videoId, code: event?.data })
                    }
                }
            })
            playerRef.current = localPlayer
        }).catch((error) => {
            logError(ErrorCategory.NETWORK, 'ensureYTApi', error, { videoId })
        })

        return () => {
            destroyed = true
            try {
                if (localPlayer?.destroy) localPlayer.destroy()
            } catch (error) {
                logError(ErrorCategory.PLAYER, 'destroyPlayer', error, { videoId })
            }
            // Only clear shared ref if it still points to THIS effect's player
            if (playerRef.current === localPlayer) {
                playerRef.current = null
                currentVideoRef.current = null
            }
            if (wrapper) wrapper.innerHTML = ''
        }
    }, [videoId, autoplay, controls, muted])

    return <div ref={wrapperRef} style={{ width: '100%', height: '100%' }} />
}
