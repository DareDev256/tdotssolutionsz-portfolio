/**
 * VideoPage — Standalone video detail page at /video/:youtubeId
 *
 * Provides a lightweight, shareable, SEO-friendly page for each video.
 * No Three.js dependency — loads fast, works everywhere.
 *
 * Features:
 * - Embedded YouTube player with neon-bordered frame
 * - Video metadata (artist, title, views, upload year)
 * - Share buttons (copy link, X/Twitter, WhatsApp)
 * - Related videos by the same artist
 * - "Explore All" CTA linking to the full 3D experience
 * - Dynamic document title and meta tags for sharing
 */
import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useCallback, useState } from 'react'
import { VIDEOS, ARTIST_STATS, isDeceasedArtist } from '../utils/videoData'
import { getThumbnailUrl, isValidYouTubeId, openShareWindow } from '../utils/youtube'
import { formatViews, formatYear } from '../utils/formatters'
import './VideoPage.css'

/** Find a video by its youtubeId from the master list */
function findVideo(youtubeId) {
    if (!isValidYouTubeId(youtubeId)) return null
    return VIDEOS.find(v => v.youtubeId === youtubeId) || null
}

/** Get related videos: same artist first, then random popular picks */
function getRelatedVideos(video, limit = 6) {
    if (!video) return []
    const sameArtist = VIDEOS.filter(v =>
        v.youtubeId !== video.youtubeId && v.artist === video.artist
    ).sort((a, b) => b.viewCount - a.viewCount)

    if (sameArtist.length >= limit) return sameArtist.slice(0, limit)

    // Fill remaining slots with popular videos from other artists
    const others = VIDEOS
        .filter(v => v.youtubeId !== video.youtubeId && v.artist !== video.artist)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit - sameArtist.length)

    return [...sameArtist, ...others]
}

export default function VideoPage() {
    const { youtubeId } = useParams()
    const video = useMemo(() => findVideo(youtubeId), [youtubeId])
    const related = useMemo(() => getRelatedVideos(video), [video])
    const artistStats = video ? ARTIST_STATS[video.artist] : null
    const [copied, setCopied] = useState(false)
    const [playerLoaded, setPlayerLoaded] = useState(false)

    // Update document title for SEO
    useEffect(() => {
        if (video) {
            document.title = `${video.artist} — ${video.title} | TdotsSolutionsz`
        } else {
            document.title = 'Video Not Found | TdotsSolutionsz'
        }
        return () => { document.title = 'TdotsSolutionsz — Music Video Portfolio' }
    }, [video])

    const handleShare = useCallback((platform) => {
        const url = `${window.location.origin}/video/${youtubeId}`
        const text = `${video.artist} — ${video.title} | TdotsSolutionsz`
        if (platform === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
        } else if (platform === 'x') {
            openShareWindow(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
        } else if (platform === 'whatsapp') {
            openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)
        }
    }, [video, youtubeId])

    // 404 state
    if (!video) {
        return (
            <div className="vp-page vp-not-found">
                <div className="vp-not-found-content">
                    <div className="vp-404-glitch" data-text="404">404</div>
                    <p className="vp-404-msg">This video doesn't exist in the portfolio.</p>
                    <Link to="/" className="vp-back-btn">← BACK TO HUB</Link>
                </div>
            </div>
        )
    }

    const isDeceased = isDeceasedArtist(video.artist)

    return (
        <div className="vp-page">
            <div className="vp-bg-grid" aria-hidden="true" />
            <div className="vp-bg-glow" aria-hidden="true" />

            {/* Top nav */}
            <nav className="vp-nav">
                <Link to="/" className="vp-nav-back" aria-label="Back to hub">
                    ← HUB
                </Link>
                <Link to="/videos" className="vp-nav-explore" aria-label="Explore all videos in 3D">
                    3D EXPERIENCE →
                </Link>
            </nav>

            {/* Main content */}
            <main className="vp-main">
                {/* Player */}
                <div className="vp-player-wrap">
                    <div className={`vp-player ${playerLoaded ? 'vp-player--loaded' : ''}`}>
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                            title={`${video.artist} — ${video.title}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                            onLoad={() => setPlayerLoaded(true)}
                        />
                        <div className="vp-player-scanlines" aria-hidden="true" />
                    </div>
                </div>

                {/* Metadata */}
                <div className="vp-meta">
                    <div className="vp-meta-top">
                        <div>
                            <h1 className="vp-title">{video.title}</h1>
                            <p className={`vp-artist ${isDeceased ? 'vp-artist--memorial' : ''}`}>
                                {isDeceased && <span className="vp-memorial-icon" aria-label="In memoriam">🕊</span>}
                                {video.artist}
                            </p>
                        </div>
                        <div className="vp-stats">
                            <span className="vp-stat">
                                <span className="vp-stat-value">{formatViews(video.viewCount)}</span>
                                <span className="vp-stat-label">VIEWS</span>
                            </span>
                            <span className="vp-stat">
                                <span className="vp-stat-value">{formatYear(video.uploadDate)}</span>
                                <span className="vp-stat-label">YEAR</span>
                            </span>
                            {artistStats && (
                                <span className="vp-stat">
                                    <span className="vp-stat-value">{artistStats.count}</span>
                                    <span className="vp-stat-label">VIDEOS</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {video.description && (
                        <p className="vp-description">{video.description}</p>
                    )}

                    {/* Share bar */}
                    <div className="vp-share">
                        <button
                            className={`vp-share-btn vp-share-btn--copy ${copied ? 'vp-share-btn--copied' : ''}`}
                            onClick={() => handleShare('copy')}
                            aria-label="Copy link"
                        >
                            {copied ? '✓ COPIED' : '🔗 COPY LINK'}
                        </button>
                        <button
                            className="vp-share-btn vp-share-btn--x"
                            onClick={() => handleShare('x')}
                            aria-label="Share on X"
                        >
                            𝕏 SHARE
                        </button>
                        <button
                            className="vp-share-btn vp-share-btn--wa"
                            onClick={() => handleShare('whatsapp')}
                            aria-label="Share on WhatsApp"
                        >
                            💬 WHATSAPP
                        </button>
                    </div>

                    {/* Watch in 3D CTA */}
                    <Link
                        to={`/videos?v=${youtubeId}`}
                        className="vp-immersive-cta"
                    >
                        <span className="vp-cta-icon">🏙️</span>
                        <span className="vp-cta-text">
                            <span className="vp-cta-title">WATCH IN 3D</span>
                            <span className="vp-cta-sub">Experience in the Synthwave Highway</span>
                        </span>
                        <span className="vp-cta-arrow">→</span>
                    </Link>
                </div>

                {/* Related videos */}
                {related.length > 0 && (
                    <section className="vp-related" aria-labelledby="vp-related-heading">
                        <h2 id="vp-related-heading" className="vp-section-title">
                            {related[0].artist === video.artist
                                ? `MORE FROM ${video.artist.toUpperCase()}`
                                : 'RELATED VIDEOS'}
                        </h2>
                        <div className="vp-related-grid">
                            {related.map(rv => (
                                <Link
                                    key={rv.youtubeId}
                                    to={`/video/${rv.youtubeId}`}
                                    className="vp-related-card"
                                    aria-label={`${rv.artist} — ${rv.title}`}
                                >
                                    <div className="vp-related-thumb">
                                        <img
                                            src={getThumbnailUrl(rv.youtubeId, 'mqdefault')}
                                            alt=""
                                            loading="lazy"
                                            width="320"
                                            height="180"
                                        />
                                        <span className="vp-related-views">{formatViews(rv.viewCount)}</span>
                                    </div>
                                    <div className="vp-related-info">
                                        <span className="vp-related-title">{rv.title}</span>
                                        <span className="vp-related-artist">{rv.artist}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Footer */}
            <footer className="vp-footer">
                <div className="vp-footer-line" />
                <div className="vp-footer-content">
                    <span className="vp-footer-brand">TDOTSSOLUTIONSZ</span>
                    <div className="vp-footer-links">
                        <a href="https://www.youtube.com/@Tdotssolutionsz" target="_blank" rel="noopener noreferrer" className="vp-footer-link">YouTube</a>
                        <a href="https://www.instagram.com/tdotssolutionsz" target="_blank" rel="noopener noreferrer" className="vp-footer-link">Instagram</a>
                        <a href="mailto:tdotssolutionsz@gmail.com" className="vp-footer-link">Book a Session</a>
                    </div>
                    <span className="vp-footer-loc">TORONTO, CANADA</span>
                </div>
            </footer>
        </div>
    )
}
