import { useState, useEffect } from 'react'
import { ARTIST_STATS } from '../../utils/videoData'
import { isValidYouTubeId, extractVideoId } from '../../utils/youtube'
import useCopyLink from '../../hooks/useCopyLink'

export const VideoOverlay = ({ activeProject, audioEnabled, onOpenTheater, onArtistClick }) => {
    const [isVisible, setIsVisible] = useState(false)
    const { copied, handleCopyLink } = useCopyLink(activeProject)

    useEffect(() => {
        setIsVisible(!!activeProject)
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
                            referrerPolicy="no-referrer"
                            loading="lazy"
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
        </div>
    )
}
