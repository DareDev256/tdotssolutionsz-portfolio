import { useState, useMemo, useEffect } from 'react'
import videoData from './data/videos.json'
import VideoCard from './components/VideoCard'
import './MobileApp.css'

const VIDEOS = videoData.videos.map(video => ({
    ...video,
    url: `https://www.youtube.com/watch?v=${video.youtubeId}`
}))

const POPULAR_THRESHOLD = videoData.settings?.popularThreshold || 500000

const ALL_ARTISTS = [...new Set(VIDEOS.map(v => v.artist))].sort()

const ARTIST_STATS = VIDEOS.reduce((acc, v) => {
    if (!acc[v.artist]) {
        acc[v.artist] = { count: 0, totalViews: 0, earliest: v.uploadDate, latest: v.uploadDate }
    }
    const s = acc[v.artist]
    s.count++
    s.totalViews += v.viewCount
    if (v.uploadDate < s.earliest) s.earliest = v.uploadDate
    if (v.uploadDate > s.latest) s.latest = v.uploadDate
    return acc
}, {})

export default function MobileApp() {
    const [activeTab, setActiveTab] = useState('latest')
    const [playingVideo, setPlayingVideo] = useState(null)
    const [filterArtist, setFilterArtist] = useState(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [copied, setCopied] = useState(false)

    // Deep link: read ?v= on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const vId = params.get('v')
        if (vId) {
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
        if (activeTab === 'latest') {
            return vids.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        } else {
            return vids
                .filter(v => v.viewCount >= POPULAR_THRESHOLD)
                .sort((a, b) => b.viewCount - a.viewCount)
        }
    }, [activeTab, filterArtist])

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

    const handleCopyLink = () => {
        if (!playingVideo) return
        const url = `${window.location.origin}${window.location.pathname}?v=${playingVideo.youtubeId}`
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const stats = playingVideo ? ARTIST_STATS[playingVideo.artist] : null

    return (
        <div className="mobile-app">
            {/* Header */}
            <header className="mobile-header">
                <h1 className="mobile-title">
                    <span className="title-infinite">♫ MUSIC VIDEO ♫</span>
                    <span className="title-drive">PORTFOLIO</span>
                </h1>
                <p className="mobile-subtitle">♪ ── TDOTSSOLUTIONSZ ── ♪</p>
            </header>

            {/* Search + Filter Tabs */}
            <nav className="filter-tabs">
                <button
                    className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('latest')}
                >
                    Latest
                </button>
                <button
                    className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                >
                    Popular
                </button>
                {filterArtist ? (
                    <button
                        className="tab artist-filter-active"
                        onClick={() => { setFilterArtist(null); setSearchQuery('') }}
                    >
                        {filterArtist} ✕
                    </button>
                ) : (
                    <button
                        className="tab"
                        onClick={() => setSearchOpen(!searchOpen)}
                    >
                        🔍
                    </button>
                )}
            </nav>

            {/* Artist Search Dropdown */}
            {searchOpen && (
                <div className="mobile-search-dropdown">
                    <input
                        className="mobile-search-input"
                        type="text"
                        placeholder="Search artist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="mobile-search-results">
                        {searchResults.map(artist => (
                            <button
                                key={artist}
                                className="mobile-search-item"
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
            <main className="video-grid">
                {filteredVideos.map(video => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoClick(video)}
                    />
                ))}
                {filteredVideos.length === 0 && (
                    <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem', gridColumn: '1 / -1' }}>
                        No videos match this filter.
                    </p>
                )}
            </main>

            {/* Video Player Modal */}
            {playingVideo && (
                <div className="video-modal" onClick={handleClosePlayer}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-top-bar">
                            <button className="copy-link-btn" onClick={handleCopyLink}>
                                {copied ? '✓ Copied' : '🔗 Share'}
                            </button>
                            <button className="close-button" onClick={handleClosePlayer}>
                                ✕
                            </button>
                        </div>
                        <div className="video-container">
                            <iframe
                                src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1`}
                                title={playingVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="video-info">
                            <h2>{playingVideo.title}</h2>
                            <p>{playingVideo.description}</p>
                            {stats && (
                                <div className="mobile-artist-spotlight">
                                    <span className="mobile-spotlight-artist">{playingVideo.artist}</span>
                                    <span className="mobile-spotlight-stat">{stats.count} video{stats.count > 1 ? 's' : ''}</span>
                                    <span className="mobile-spotlight-stat">{(stats.totalViews / 1000).toFixed(0)}K views</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mobile-footer">
                <p>♫ © {new Date().getFullYear()} TdotsSolutionsz ♫</p>
            </footer>
        </div>
    )
}
