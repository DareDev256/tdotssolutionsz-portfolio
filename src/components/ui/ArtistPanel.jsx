import React, { useEffect, useMemo } from 'react'
import { VIDEOS, ARTIST_STATS } from '../../utils/videoData'
import { getThumbnailUrl } from '../../utils/youtube'
import './ArtistPanel.css'

export function ArtistPanel({ artist, activeVideoId, onSelectVideo, onClose, mobileModal }) {
    const isOpen = Boolean(artist)

    // All videos by this artist, newest first
    const artistVideos = useMemo(() => {
        if (!artist) return []
        return VIDEOS
            .filter(v => v.artist === artist)
            .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
    }, [artist])

    const stats = artist ? ARTIST_STATS[artist] : null

    // ESC to close
    useEffect(() => {
        if (!isOpen) return
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    return (
        <>
            <div
                className={`artist-panel-backdrop ${isOpen ? 'open' : ''} ${mobileModal ? 'artist-panel-backdrop--mobile-modal' : ''}`}
                onClick={onClose}
            />
            <aside className={`artist-panel ${isOpen ? 'open' : ''} ${mobileModal ? 'artist-panel--mobile-modal' : ''}`}>
                <div className="artist-panel__header">
                    <h2 className="artist-panel__name">{artist}</h2>
                    <button className="artist-panel__close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {stats && (
                    <div className="artist-panel__stats">
                        <span className="artist-panel__stat">{stats.count} video{stats.count > 1 ? 's' : ''}</span>
                        <span className="artist-panel__stat">{(stats.totalViews / 1000).toFixed(0)}K views</span>
                        <span className="artist-panel__stat">{stats.earliest.slice(0, 4)}–{stats.latest.slice(0, 4)}</span>
                    </div>
                )}

                <div className="artist-panel__list">
                    {artistVideos.map(video => (
                        <div
                            key={video.youtubeId}
                            className={`artist-panel__item ${video.youtubeId === activeVideoId ? 'artist-panel__item--active' : ''}`}
                            onClick={() => onSelectVideo(video)}
                        >
                            <img
                                className="artist-panel__thumb"
                                src={getThumbnailUrl(video.youtubeId)}
                                alt={video.title}
                                loading="lazy"
                            />
                            <div className="artist-panel__info">
                                <span className="artist-panel__title">{video.title}</span>
                                <span className="artist-panel__meta">
                                    {(video.viewCount / 1000).toFixed(0)}K views · {video.uploadDate.slice(0, 4)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    )
}
