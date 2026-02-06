import { useEffect, useRef } from 'react'

// ── YouTube IFrame API loader (singleton) ──
let ytApiPromise = null

function ensureYTApi() {
    if (window.YT?.Player) return Promise.resolve()
    if (ytApiPromise) return ytApiPromise

    ytApiPromise = new Promise((resolve) => {
        const prev = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
            prev?.()
            resolve()
        }
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
    })
    return ytApiPromise
}

/**
 * YouTube player with end-detection via IFrame API.
 * Use key={videoId} on parent to remount for new videos.
 *
 * Props:
 *  - videoId: YouTube video ID
 *  - autoplay: start playing immediately (default true)
 *  - controls: show player controls (default true)
 *  - muted: start muted (default false)
 *  - onEnd: callback when video finishes
 */
export default function YouTubePlayer({
    videoId,
    autoplay = true,
    controls = true,
    muted = false,
    onEnd
}) {
    const containerRef = useRef(null)
    const playerRef = useRef(null)
    const onEndRef = useRef(onEnd)
    onEndRef.current = onEnd

    useEffect(() => {
        let destroyed = false

        ensureYTApi().then(() => {
            if (destroyed || !containerRef.current) return

            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId,
                width: '100%',
                height: '100%',
                playerVars: {
                    autoplay: autoplay ? 1 : 0,
                    controls: controls ? 1 : 0,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                    mute: muted ? 1 : 0,
                },
                events: {
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onEndRef.current?.()
                        }
                    }
                }
            })
        })

        return () => {
            destroyed = true
            if (playerRef.current?.destroy) {
                playerRef.current.destroy()
                playerRef.current = null
            }
        }
    }, [videoId, autoplay, controls, muted])

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
