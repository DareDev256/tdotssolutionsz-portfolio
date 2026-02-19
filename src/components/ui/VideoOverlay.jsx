import { useState, useEffect } from 'react'
import { ARTIST_STATS } from '../../utils/videoData'
import { isValidYouTubeId, extractVideoId } from '../../utils/youtube'
import useCopyLink from '../../hooks/useCopyLink'
import AudioVisualizer from './AudioVisualizer'

export const VideoOverlay = ({ activeProject, audioEnabled, onOpenTheater, onArtistClick }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [vizActive, setVizActive] = useState(false)
    const { copied, handleCopyLink } = useCopyLink(activeProject)

    useEffect(() => {
        setIsVisible(!!activeProject)
        if (!activeProject) setVizActive(false) // Reset on video change
    }, [activeProject])

    // V key toggles visualizer when a video is active
    useEffect(() => {
        if (!activeProject) return
        const handleKey = (e) => {
            if (e.key === 'v' || e.key === 'V') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
                setVizActive(v => !v)
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [activeProject])

    if (!activeProject) return null

    const videoId = extractVideoId(activeProject.url)
    const validId = isValidYouTubeId(videoId)
    const stats = ARTIST_STATS[activeProject.artist]

    return (
        <div className={`video-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="video-frame" style={{ borderColor: activeProject.color }}>
                <div className="video-title" style={{ color: activeProject.color }}>
                    {activeProject.title}
                    <span style={{ display: 'flex', gap: '4px' }}>
                        {/* Visualizer toggle */}
                        <button
                            className={`viz-toggle-btn ${vizActive ? 'active' : ''}`}
                            onClick={() => setVizActive(v => !v)}
                            title="Visualizer (V)"
                            aria-pressed={vizActive}
                            aria-label="Toggle audio visualizer"
                            style={{ borderColor: activeProject.color }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="1" y="8" width="3" height="8" rx="1" />
                                <rect x="6" y="4" width="3" height="16" rx="1" />
                                <rect x="11" y="6" width="3" height="12" rx="1" />
                                <rect x="16" y="2" width="3" height="20" rx="1" />
                                <rect x="21" y="9" width="3" height="6" rx="1" />
                            </svg>
                        </button>
                        {/* Copy Link button */}
                        <button
                            className="theater-mode-btn"
                            onClick={handleCopyLink}
                            title="Copy Link"
                            style={{ borderColor: activeProject.color }}
                        >
                            {copied ? '✓' : '🔗'}
                        </button>
                        {/* Fullscreen/Theater Mode button */}
                        <button
                            className="theater-mode-btn"
                            onClick={onOpenTheater}
                            title="Theater Mode (F)"
                            style={{ borderColor: activeProject.color }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                        </button>
                    </span>
                </div>
                <div className="video-container">
                    {validId && (
                        <iframe
                            key={videoId}
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${audioEnabled ? 0 : 1}&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1`}
                            style={{ border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                            title={activeProject.title}
                        />
                    )}
                    {/* CRT Scanline Overlay */}
                    <div className="crt-overlay" />
                </div>
                <div className="video-description">{activeProject.description}</div>
                {/* Artist spotlight stats */}
                {stats && (
                    <div className="artist-spotlight">
                        <button
                            className="spotlight-artist spotlight-artist--clickable"
                            onClick={() => onArtistClick(activeProject.artist)}
                        >
                            {activeProject.artist}
                        </button>
                        <span className="spotlight-stat">{stats.count} video{stats.count > 1 ? 's' : ''}</span>
                        <span className="spotlight-stat">{(stats.totalViews / 1000).toFixed(0)}K views</span>
                        <span className="spotlight-stat">{stats.earliest.slice(0, 4)}–{stats.latest.slice(0, 4)}</span>
                    </div>
                )}
            </div>
            <AudioVisualizer active={vizActive} color={activeProject.color} />
        </div>
    )
}
