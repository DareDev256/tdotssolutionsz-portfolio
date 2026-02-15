import { useState, useMemo, useEffect, useRef } from 'react'
import VideoCard from './components/VideoCard'
import YouTubePlayer from './components/YouTubePlayer'
import { ArtistPanel, KeyboardGuide } from './components/ui'
import useFavorites from './hooks/useFavorites'
import { VIDEOS, POPULAR_THRESHOLD, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS } from './utils/videoData'
import { getShareUrl, getThumbnailUrl, openShareWindow } from './utils/youtube'
import { THUMBNAIL_FALLBACK } from './utils/imageFallback'
import { formatViews } from './utils/formatters'
import { searchAll } from './hooks/useSearch'
import useVideoDeepLink from './hooks/useVideoDeepLink'
import useVideoNavigation from './hooks/useVideoNavigation'
import useCopyLink from './hooks/useCopyLink'
import useShufflePlay from './hooks/useShufflePlay'
import './MobileApp.css'

/**
 * useScrollReveal — Triggers CSS reveal animations as video cards enter the viewport.
 *
 * Uses IntersectionObserver on all `[data-vid]` elements. The `deps` parameter
 * controls when to re-scan the DOM for new cards (e.g., after tab switch).
 * Passing `null` skips observation entirely — used during initial render before
 * card elements exist in the DOM.
 *
 * The `requestAnimationFrame` wrapper ensures we query the DOM *after* React
 * has committed the new elements from the latest render, avoiding a race
 * condition where querySelectorAll runs before cards are painted.
 *
 * @param {*} deps - Dependency value that triggers re-observation. Pass null to skip.
 * @returns {Set<string>} Set of video IDs that have been revealed
 */
function useScrollReveal(deps) {
    const [revealed, setRevealed] = useState(new Set())
    useEffect(() => {
        if (deps === null) return // Still loading — skip until DOM has cards

        // Defer to next frame so React has committed new [data-vid] elements
        const raf = requestAnimationFrame(() => {
            const elements = document.querySelectorAll('[data-vid]')
            if (elements.length === 0) return

            const observer = new IntersectionObserver(
                (entries) => {
                    const newIds = []
                    entries.forEach(e => {
                        if (e.isIntersecting && e.target.dataset.vid) newIds.push(e.target.dataset.vid)
                    })
                    if (newIds.length) setRevealed(prev => {
                        const next = new Set(prev)
                        newIds.forEach(id => next.add(id))
                        return next
                    })
                },
                { threshold: 0.1, rootMargin: '50px' }
            )
            elements.forEach(el => observer.observe(el))

            // Store for cleanup
            cleanup.observer = observer
            cleanup.elements = elements
        })

        const cleanup = { observer: null, elements: null }
        return () => {
            cancelAnimationFrame(raf)
            if (cleanup.observer) {
                cleanup.elements?.forEach(el => cleanup.observer.unobserve(el))
                cleanup.observer.disconnect()
            }
        }
    }, [deps])
    return revealed
}

/**
 * useSwipe — Lightweight horizontal swipe gesture detection for mobile navigation.
 *
 * Returns `onTouchStart` and `onTouchEnd` handlers to spread onto a container.
 * A swipe is registered when the horizontal distance exceeds 50px — this
 * threshold prevents accidental triggers from vertical scrolling or taps while
 * still being reachable with a deliberate thumb swipe.
 *
 * @param {function} onLeft - Called on left swipe (finger moves right-to-left)
 * @param {function} onRight - Called on right swipe (finger moves left-to-right)
 * @returns {{ onTouchStart: function, onTouchEnd: function }}
 */
function useSwipe(onLeft, onRight) {
    const start = useRef(null)
    return {
        onTouchStart: (e) => { start.current = e.touches[0].clientX },
        onTouchEnd: (e) => {
            if (start.current === null || !e.changedTouches?.length) return
            const diff = start.current - e.changedTouches[0].clientX
            // 50px threshold — wide enough to avoid false positives from scroll jitter
            if (Math.abs(diff) > 50) diff > 0 ? onLeft?.() : onRight?.()
            start.current = null
        }
    }
}

// Validate shared data loaded correctly
const LOAD_ERROR = (!VIDEOS || VIDEOS.length === 0) ? 'Failed to load video data' : null

export default function MobileApp() {
    const [activeTab, setActiveTab] = useState('latest')
    const [playingVideo, setPlayingVideo] = useState(null)
    const [filterArtist, setFilterArtist] = useState(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(LOAD_ERROR)
    const [artistPanelArtist, setArtistPanelArtist] = useState(null)
    const [kbdGuideOpen, setKbdGuideOpen] = useState(false)
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

    // Deep link: read ?v= on mount + sync URL with active video
    useVideoDeepLink(playingVideo, setPlayingVideo)

    // Keyboard shortcuts: ? for keyboard guide, Escape to close search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && searchOpen) {
                setSearchOpen(false)
                setSearchQuery('')
                return
            }
            if (e.key === '?' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                setKbdGuideOpen(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [searchOpen])

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
        if (!searchQuery || searchQuery.length < 2) return { artists: ALL_ARTISTS, videos: [] }
        const { artists, videos } = searchAll(searchQuery)
        return { artists: artists.length > 0 ? artists : ALL_ARTISTS.filter(a => a.toLowerCase().includes(searchQuery.toLowerCase())), videos }
    }, [searchQuery])

    const handleVideoClick = (video) => {
        setPlayingVideo(video)
    }

    const handleClosePlayer = () => {
        setPlayingVideo(null)
    }

    const { handleNext: handleNextVideo, handlePrev: handlePrevVideo } =
        useVideoNavigation(playingVideo, filteredVideos, setPlayingVideo)
    const { copied, handleCopyLink } = useCopyLink(playingVideo)
    const { shufflePlay } = useShufflePlay()

    const handleShuffle = () => {
        const pick = shufflePlay()
        if (pick) setPlayingVideo(pick)
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

    const revealed = useScrollReveal(loading ? null : filteredVideos)
    const swipeHandlers = useSwipe(handleNextVideo, handlePrevVideo)

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

    const heroVideo = (!filterArtist && !searchOpen && filteredVideos.length > 0) ? filteredVideos[0] : null
    const gridVideos = heroVideo ? filteredVideos.slice(1) : filteredVideos

    return (
        <div className="mobile-app">
            {/* Ambient atmosphere */}
            <div className="mobile-particles" aria-hidden="true">
                {Array.from({ length: 15 }, (_, i) => (
                    <div key={i} className={`mobile-particle mobile-particle--${i + 1}`} />
                ))}
            </div>
            <div className="mobile-scanline" aria-hidden="true" />

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
                >
                    Latest
                </button>
                <button
                    className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                    role="tab"
                    aria-selected={activeTab === 'popular'}
                >
                    Popular
                </button>
                {favorites.length > 0 && (
                    <button
                        className={`tab tab-fav ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                        role="tab"
                        aria-selected={activeTab === 'favorites'}
                    >
                        ♥ {favorites.length}
                    </button>
                )}
                {filterArtist ? (
                    <button
                        className="tab artist-filter-active"
                        onClick={() => { setFilterArtist(null); setSearchQuery('') }}
                        aria-label={`Clear filter: ${filterArtist}`}
                    >
                        {filterArtist} ✕
                    </button>
                ) : (
                    <button
                        className="tab"
                        onClick={() => setSearchOpen(!searchOpen)}
                        aria-expanded={searchOpen}
                        aria-label="Search artists"
                    >
                        🔍
                    </button>
                )}
                <button
                    className="tab tab-shuffle"
                    onClick={handleShuffle}
                    aria-label="Shuffle — play a random video"
                >
                    🎲
                </button>
            </nav>

            {/* Artist Search Dropdown */}
            {searchOpen && (
                <div className="mobile-search-dropdown" role="search">
                    <input
                        className="mobile-search-input"
                        type="text"
                        placeholder="Search artists & videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        aria-label="Search artists and videos"
                    />
                    <div className="mobile-search-results" role="listbox" aria-label="Search results">
                        {searchResults.videos.length > 0 && (
                            <>
                                <div className="mobile-search-section">VIDEOS</div>
                                {searchResults.videos.map(video => (
                                    <button
                                        key={`v-${video.id}`}
                                        className="mobile-search-item mobile-search-video"
                                        role="option"
                                        aria-selected={false}
                                        onClick={() => {
                                            handleVideoClick(video)
                                            setSearchOpen(false)
                                            setSearchQuery('')
                                        }}
                                    >
                                        <span className="mobile-search-video-title">{video.title}</span>
                                        <span className="mobile-search-count">{video.artist}</span>
                                    </button>
                                ))}
                                <div className="mobile-search-section">ARTISTS</div>
                            </>
                        )}
                        {searchResults.artists.map(artist => (
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

            {/* Hero Card */}
            {heroVideo && (
                <div className="hero-card" onClick={() => handleVideoClick(heroVideo)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleVideoClick(heroVideo) } }} role="button" tabIndex={0} aria-label={`Play ${heroVideo.title}`}>
                    <img
                        className="hero-card__bg"
                        src={getThumbnailUrl(heroVideo.youtubeId, 'hqdefault')}
                        alt={heroVideo.title}
                        onError={(e) => { e.currentTarget.src = THUMBNAIL_FALLBACK }}
                    />
                    <div className="hero-card__overlay" />
                    <div className="hero-card__content">
                        <span className="hero-card__label">{activeTab === 'popular' ? 'MOST POPULAR' : 'LATEST'}</span>
                        <h2 className="hero-card__title">{heroVideo.title}</h2>
                        <p className="hero-card__artist">{heroVideo.artist}</p>
                        <div className="hero-card__bottom">
                            <span className="hero-card__views">{formatViews(heroVideo.viewCount)} views</span>
                            <span className="hero-card__play">PLAY</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Grid */}
            <main className="video-grid" role="list" aria-label="Music videos">
                {(() => { const currentIdx = playingVideo ? gridVideos.findIndex(v => v.id === playingVideo.id) : -1; return gridVideos.map((video, index) => {
                    const isNowPlaying = playingVideo && video.id === playingVideo.id
                    const isUpNext = currentIdx >= 0 && index === (currentIdx + 1) % gridVideos.length && !isNowPlaying
                    const isRevealed = revealed.has(String(video.id))
                    return (
                        <div
                            key={video.id}
                            data-vid={video.id}
                            className={isRevealed ? 'video-card--reveal' : 'video-card--hidden'}
                            style={{ animationDelay: `${(index % 2) * 0.1}s` }}
                        >
                            <VideoCard
                                video={video}
                                onClick={() => handleVideoClick(video)}
                                isFavorite={isFavorite(video.id)}
                                onToggleFavorite={toggleFavorite}
                                isNowPlaying={isNowPlaying}
                                isUpNext={isUpNext}
                            />
                        </div>
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
                    <div className="modal-content" onClick={e => e.stopPropagation()} {...swipeHandlers}>
                        <div className="modal-top-bar">
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button className="copy-link-btn" onClick={handleCopyLink}>
                                    {copied ? '✓ Copied' : '🔗 Copy'}
                                </button>
                                <button
                                    className="copy-link-btn share-social-btn"
                                    onClick={() => {
                                        const url = getShareUrl(playingVideo)
                                        openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(playingVideo.title + ' — shot by TdotsSolutionsz 🎬')}&url=${encodeURIComponent(url)}`, 'noopener,noreferrer,width=550,height=420')
                                    }}
                                    aria-label="Share on X/Twitter"
                                >
                                    𝕏
                                </button>
                                <button
                                    className="copy-link-btn share-social-btn"
                                    onClick={() => {
                                        const url = getShareUrl(playingVideo)
                                        openShareWindow(`https://wa.me/?text=${encodeURIComponent(playingVideo.title + ' — ' + url)}`)
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
                                    <button
                                        className="mobile-spotlight-artist"
                                        onClick={() => setArtistPanelArtist(playingVideo.artist)}
                                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                                    >
                                        {playingVideo.artist} ›
                                    </button>
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
                                                    onError={(e) => { e.currentTarget.src = THUMBNAIL_FALLBACK }}
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

            {/* Artist Panel — triggered from modal */}
            <ArtistPanel
                artist={artistPanelArtist}
                activeVideoId={playingVideo?.youtubeId}
                onSelectVideo={(video) => {
                    setPlayingVideo(video)
                    setArtistPanelArtist(null)
                }}
                onClose={() => setArtistPanelArtist(null)}
                mobileModal={Boolean(playingVideo)}
            />
            <KeyboardGuide isOpen={kbdGuideOpen} onClose={() => setKbdGuideOpen(false)} />

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
