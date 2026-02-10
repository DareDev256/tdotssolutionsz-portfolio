import { useState, useMemo, useEffect, useCallback } from 'react'
import VideoCard from './components/VideoCard'
import YouTubePlayer from './components/YouTubePlayer'
import useFavorites from './hooks/useFavorites'
import { VIDEOS, POPULAR_THRESHOLD, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS } from './utils/videoData'
import { isValidYouTubeId, getShareUrl, getThumbnailUrl } from './utils/youtube'
import './MobileApp.css'

// Validate shared data loaded correctly
const LOAD_ERROR = (!VIDEOS || VIDEOS.length === 0) ? 'Failed to load video data' : null

export default function MobileApp() {
    const [activeTab, setActiveTab] = useState('latest')
    const [playingVideo, setPlayingVideo] = useState(null)
    const [filterArtist, setFilterArtist] = useState(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(LOAD_ERROR)
    const { favorites, toggleFavorite, isFavorite } = useFavorites()

    // Simulate loading state for initial data hydration
    useEffect(() => {
        if (VIDEOS.length > 0 || LOAD_ERROR) {
            // Short delay to show loading skeleton for perceived performance
            const timer = setTimeout(() => setLoading(false), 300)
            return () => clearTimeout(timer)
        }
        setLoading(false)
    }, [])

    // Deep link: read ?v= on mount (validated)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const vId = params.get('v')
        if (vId && isValidYouTubeId(vId)) {
            const found = VIDEOS.find(v => v.youtubeId === vId)
            if (found) setPlayingVideo(found)
        }
    }, [])

    // Update URL on modal open/close
    useEffect(() => {
        if (playingVideo) {
            window.history.replaceState(null, '', `?v=${playingVideo.youtubeId}`)
        } else {
            window.history.replaceState(null, '', window.location.pathname)
        }
    }, [playingVideo])

    const filteredVideos = useMemo(() => {
        let vids = [...VIDEOS]
        if (filterArtist) {
            vids = vids.filter(v => v.artist === filterArtist)
        }
        if (activeTab === 'favorites') {
            return vids
                .filter(v => favorites.includes(v.id))
                .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        }
        if (activeTab === 'latest') {
            return vids.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        } else {
            return vids
                .filter(v => v.viewCount >= POPULAR_THRESHOLD)
                .sort((a, b) => b.viewCount - a.viewCount)
        }
    }, [activeTab, filterArtist, favorites])

    const searchResults = useMemo(() => {
        if (!searchQuery) return ALL_ARTISTS
        const q = searchQuery.toLowerCase()
        return ALL_ARTISTS.filter(a => a.toLowerCase().includes(q))
    }, [searchQuery])

    const handleVideoClick = (video) => {
        setPlayingVideo(video)
    }

    const handleClosePlayer = () => {
        setPlayingVideo(null)
    }

    const handleNextVideo = useCallback(() => {
        if (!playingVideo) return
        const idx = filteredVideos.findIndex(v => v.id === playingVideo.id)
        const next = filteredVideos[(idx + 1) % filteredVideos.length]
        if (next) setPlayingVideo(next)
    }, [playingVideo, filteredVideos])

    const handlePrevVideo = useCallback(() => {
        if (!playingVideo) return
        const idx = filteredVideos.findIndex(v => v.id === playingVideo.id)
        const prev = filteredVideos[(idx - 1 + filteredVideos.length) % filteredVideos.length]
        if (prev) setPlayingVideo(prev)
    }, [playingVideo, filteredVideos])

    const handleCopyLink = () => {
        if (!playingVideo) return
        navigator.clipboard.writeText(getShareUrl(playingVideo)).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    // Related videos: other videos by same artist (exclude current)
    const relatedVideos = useMemo(() => {
        if (!playingVideo) return []
        return VIDEOS.filter(v => v.artist === playingVideo.artist && v.id !== playingVideo.id)
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, 4)
    }, [playingVideo])

    const handleRetry = () => {
        setError(null)
        setLoading(true)
        window.location.reload()
    }

    const stats = playingVideo ? ARTIST_STATS[playingVideo.artist] : null

    // Error state
    if (error) {
        return (
            <div className="mobile-app">
                <header className="mobile-header">
                    <h1 className="mobile-title">
                        <span className="title-infinite">♫ MUSIC VIDEO ♫</span>
                        <span className="title-drive">PORTFOLIO</span>
                    </h1>
                    <p className="mobile-subtitle">♪ ── TDOTSSOLUTIONSZ ── ♪</p>
                </header>
                <div className="mobile-error-state" role="alert">
                    <div className="error-icon">⚠</div>
                    <h2 className="error-title">Unable to Load Videos</h2>
                    <p className="error-message">
                        Something went wrong while loading the video portfolio. Please check your connection and try again.
                    </p>
                    <button className="error-retry-btn" onClick={handleRetry}>
                        Try Again
                    </button>
                </div>
                <footer className="mobile-footer">
                    <p>♫ &copy; {new Date().getFullYear()} TdotsSolutionsz ♫</p>
                </footer>
            </div>
        )
    }

    // Loading state
    if (loading) {
        return (
            <div className="mobile-app">
                <header className="mobile-header">
                    <h1 className="mobile-title">
                        <span className="title-infinite">♫ MUSIC VIDEO ♫</span>
                        <span className="title-drive">PORTFOLIO</span>
                    </h1>
                    <p className="mobile-subtitle">♪ ── TDOTSSOLUTIONSZ ── ♪</p>
                </header>
                <nav className="filter-tabs">
                    <div className="tab-skeleton" aria-hidden="true"></div>
                    <div className="tab-skeleton" aria-hidden="true"></div>
                    <div className="tab-skeleton tab-skeleton-small" aria-hidden="true"></div>
                </nav>
                <main className="video-grid" aria-busy="true" aria-label="Loading videos">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="video-card-skeleton" aria-hidden="true">
                            <div className="skeleton-thumbnail"></div>
                            <div className="skeleton-info">
                                <div className="skeleton-title"></div>
                                <div className="skeleton-description"></div>
                                <div className="skeleton-meta"></div>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        )
    }

    const formatViews = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
        return count.toString()
    }

    return (
        <div className="mobile-app">
            {/* Header */}
            <header className="mobile-header">
                <img src="/logo.png" alt="TDots Solutionsz" className="mobile-logo" />
                <h1 className="mobile-title">
                    <span className="title-infinite">MUSIC VIDEO</span>
                    <span className="title-drive">PORTFOLIO</span>
                </h1>
                <div className="mobile-header-line" />
                <p className="mobile-subtitle">TDOTSSOLUTIONSZ</p>
            </header>

            {/* Portfolio Stats Banner */}
            <div className="mobile-stats-banner" role="region" aria-label="Portfolio statistics">
                <span className="mobile-stat-item">{PORTFOLIO_STATS.totalVideos} Videos</span>
                <span className="mobile-stat-divider">·</span>
                <span className="mobile-stat-item">{PORTFOLIO_STATS.totalArtists} Artists</span>
                <span className="mobile-stat-divider">·</span>
                <span className="mobile-stat-item">{PORTFOLIO_STATS.totalViews >= 1000000 ? `${(PORTFOLIO_STATS.totalViews / 1000000).toFixed(1)}M` : `${(PORTFOLIO_STATS.totalViews / 1000).toFixed(0)}K`} Views</span>
            </div>

            {/* Search + Filter Tabs */}
            <nav className="filter-tabs" role="tablist" aria-label="Video filters">
                <button
                    className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('latest')}
                    role="tab"
                    aria-selected={activeTab === 'latest'}
                    aria-pressed={activeTab === 'latest'}
                >
                    Latest
                </button>
                <button
                    className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                    role="tab"
                    aria-selected={activeTab === 'popular'}
                    aria-pressed={activeTab === 'popular'}
                >
                    Popular
                </button>
                {favorites.length > 0 && (
                    <button
                        className={`tab tab-fav ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                        role="tab"
                        aria-selected={activeTab === 'favorites'}
                        aria-pressed={activeTab === 'favorites'}
                    >
                        ♥ {favorites.length}
                    </button>
                )}
                {filterArtist ? (
                    <button
                        className="tab artist-filter-active"
                        onClick={() => { setFilterArtist(null); setSearchQuery('') }}
                        aria-label={`Clear filter: ${filterArtist}`}
                        aria-pressed={true}
                    >
                        {filterArtist} ✕
                    </button>
                ) : (
                    <button
                        className="tab"
                        onClick={() => setSearchOpen(!searchOpen)}
                        aria-expanded={searchOpen}
                        aria-label="Search artists"
                        aria-pressed={searchOpen}
                    >
                        🔍
                    </button>
                )}
            </nav>

            {/* Artist Search Dropdown */}
            {searchOpen && (
                <div className="mobile-search-dropdown" role="search">
                    <input
                        className="mobile-search-input"
                        type="text"
                        placeholder="Search artist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        aria-label="Search for an artist"
                    />
                    <div className="mobile-search-results" role="listbox" aria-label="Artist search results">
                        {searchResults.map(artist => (
                            <button
                                key={artist}
                                className="mobile-search-item"
                                role="option"
                                aria-selected={filterArtist === artist}
                                onClick={() => {
                                    setFilterArtist(artist)
                                    setSearchOpen(false)
                                    setSearchQuery('')
                                }}
                            >
                                {artist}
                                <span className="mobile-search-count">{ARTIST_STATS[artist]?.count || 0}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Grid */}
            <main className="video-grid" role="list" aria-label="Music videos">
                {(() => { const currentIdx = playingVideo ? filteredVideos.findIndex(v => v.id === playingVideo.id) : -1; return filteredVideos.map((video, index) => {
                    const isNowPlaying = playingVideo && video.id === playingVideo.id
                    const isUpNext = currentIdx >= 0 && index === (currentIdx + 1) % filteredVideos.length && !isNowPlaying
                    return (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onClick={() => handleVideoClick(video)}
                            isFavorite={isFavorite(video.id)}
                            onToggleFavorite={toggleFavorite}
                            isNowPlaying={isNowPlaying}
                            isUpNext={isUpNext}
                        />
                    )
                })})()}
                {filteredVideos.length === 0 && (
                    <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem', gridColumn: '1 / -1' }}>
                        No videos match this filter.
                    </p>
                )}
            </main>

            {/* Video Player Modal */}
            {playingVideo && (
                <div className="video-modal" onClick={handleClosePlayer} role="dialog" aria-modal="true" aria-label={`Now playing: ${playingVideo.title}`}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-top-bar">
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button className="copy-link-btn" onClick={handleCopyLink}>
                                    {copied ? '✓ Copied' : '🔗 Copy'}
                                </button>
                                <button
                                    className="copy-link-btn share-social-btn"
                                    onClick={() => {
                                        const url = getShareUrl(playingVideo)
                                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(playingVideo.title + ' — shot by TdotsSolutionsz 🎬')}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=550,height=420')
                                    }}
                                    aria-label="Share on X/Twitter"
                                >
                                    𝕏
                                </button>
                                <button
                                    className="copy-link-btn share-social-btn"
                                    onClick={() => {
                                        const url = getShareUrl(playingVideo)
                                        window.open(`https://wa.me/?text=${encodeURIComponent(playingVideo.title + ' — ' + url)}`, '_blank', 'noopener,noreferrer')
                                    }}
                                    aria-label="Share on WhatsApp"
                                >
                                    WA
                                </button>
                                <button
                                    className={`copy-link-btn fav-modal-btn ${isFavorite(playingVideo.id) ? 'is-fav' : ''}`}
                                    onClick={() => toggleFavorite(playingVideo.id)}
                                    aria-label={isFavorite(playingVideo.id) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {isFavorite(playingVideo.id) ? '♥ Saved' : '♡ Save'}
                                </button>
                            </div>
                            <button className="close-button" onClick={handleClosePlayer} aria-label="Close video player">
                                ✕
                            </button>
                        </div>
                        <div className="video-container">
                            <YouTubePlayer
                                key={playingVideo.youtubeId}
                                videoId={playingVideo.youtubeId}
                                onEnd={handleNextVideo}
                            />
                        </div>
                        <div className="video-info">
                            {/* Queue indicator */}
                            {(() => {
                                const idx = filteredVideos.findIndex(v => v.id === playingVideo.id)
                                const nextVideo = idx >= 0 ? filteredVideos[(idx + 1) % filteredVideos.length] : null
                                return (
                                    <div className="queue-indicator">
                                        <span className="queue-now">
                                            <span className="now-playing-bars-small"><span></span><span></span><span></span></span>
                                            Now Playing ({idx + 1}/{filteredVideos.length})
                                        </span>
                                        {nextVideo && nextVideo.id !== playingVideo.id && (
                                            <span className="queue-next">Up Next: {nextVideo.title}</span>
                                        )}
                                    </div>
                                )
                            })()}
                            <div className="video-nav-row">
                                <button className="video-nav-btn" onClick={handlePrevVideo} aria-label="Previous video">
                                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                                <h2>{playingVideo.title}</h2>
                                <button className="video-nav-btn" onClick={handleNextVideo} aria-label="Next video">
                                    <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                            </div>
                            <p>{playingVideo.description}</p>
                            {stats && (
                                <div className="mobile-artist-spotlight">
                                    <span className="mobile-spotlight-artist">{playingVideo.artist}</span>
                                    <span className="mobile-spotlight-stat">{stats.count} video{stats.count > 1 ? 's' : ''}</span>
                                    <span className="mobile-spotlight-stat">{(stats.totalViews / 1000).toFixed(0)}K views</span>
                                </div>
                            )}
                            {relatedVideos.length > 0 && (
                                <div className="related-videos">
                                    <h3 className="related-title">More by {playingVideo.artist}</h3>
                                    <div className="related-list">
                                        {relatedVideos.map(rv => (
                                            <button
                                                key={rv.id}
                                                className="related-item"
                                                onClick={() => setPlayingVideo(rv)}
                                            >
                                                <img
                                                    src={getThumbnailUrl(rv.youtubeId, 'default')}
                                                    alt={rv.title}
                                                    className="related-thumb"
                                                    loading="lazy"
                                                />
                                                <span className="related-info">
                                                    <span className="related-name">{rv.title}</span>
                                                    <span className="related-views">{formatViews(rv.viewCount)} views</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mobile-footer">
                <p className="footer-brand">TdotsSolutionsz</p>
                <p className="footer-location">Toronto, Ontario 🇨🇦</p>
                <p className="footer-tagline">Music Video Production &amp; Direction</p>
                <p>&copy; {new Date().getFullYear()} TdotsSolutionsz</p>
            </footer>
        </div>
    )
}
