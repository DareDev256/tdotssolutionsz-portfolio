import { getThumbnailUrl } from '../utils/youtube'
import { THUMBNAIL_FALLBACK } from '../utils/imageFallback'
import './VideoCard.css'

/**
 * Mobile/tablet video card — displays thumbnail, title, artist, view count,
 * favorite toggle, and now-playing/up-next queue badges.
 *
 * @param {Object} props
 * @param {Object} props.video - Video object with title, artist, youtubeId, viewCount, uploadDate
 * @param {() => void} props.onClick - Opens the video player modal
 * @param {boolean} props.isFavorite - Whether this video is in the user's favorites
 * @param {(id: string) => void} [props.onToggleFavorite] - Toggles favorite state; omit to hide heart button
 * @param {boolean} props.isNowPlaying - Shows animated equalizer badge and cyan border
 * @param {boolean} props.isUpNext - Shows "UP NEXT" badge on thumbnail
 */
export default function VideoCard({ video, onClick, isFavorite, onToggleFavorite, isNowPlaying, isUpNext }) {
    const thumbnailUrl = video.thumbnail || getThumbnailUrl(video.youtubeId, 'mqdefault')

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
        }
    }

    return (
        <article
            className={`video-card${isNowPlaying ? ' now-playing' : ''}${isUpNext ? ' up-next' : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="listitem"
            aria-label={`${video.title} by ${video.artist}${isNowPlaying ? ' — now playing' : ''}${isUpNext ? ' — up next' : ''}`}
        >
            <div className="card-thumbnail">
                {isNowPlaying && (
                    <span className="card-now-playing-badge">
                        <span className="now-playing-bars">
                            <span></span><span></span><span></span>
                        </span>
                        NOW PLAYING
                    </span>
                )}
                {isUpNext && !isNowPlaying && (
                    <span className="card-up-next-badge">UP NEXT</span>
                )}
                <img
                    src={thumbnailUrl}
                    alt={`${video.title} by ${video.artist} — Toronto music video by TdotsSolutionsz`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = THUMBNAIL_FALLBACK }}
                />
                {video.viewCount > 0 && (
                    <span className="card-views-badge">
                        {formatViews(video.viewCount)}
                    </span>
                )}
                {onToggleFavorite && (
                    <button
                        className={`card-fav-btn ${isFavorite ? 'is-fav' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(video.id) }}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        {isFavorite ? '♥' : '♡'}
                    </button>
                )}
                <div className="play-overlay" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="play-icon">
                        <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                </div>
            </div>
            <div className="card-info">
                <h3 className="card-title">{video.title}</h3>
                <p className="card-description">{video.description}</p>
                <div className="card-meta">
                    <span className="card-artist">{video.artist}</span>
                    <span className="upload-date">
                        {formatYear(video.uploadDate)}
                    </span>
                </div>
                {video.viewCount > 0 && (
                    <div className="card-stats-row">
                        <span className="card-stat-views">{formatViews(video.viewCount)} views</span>
                        <span className="card-stat-date">{formatDate(video.uploadDate)}</span>
                    </div>
                )}
            </div>
        </article>
    )
}

/**
 * Format a view count into a compact string (e.g. 5200000 → "5.2M", 1500 → "2K").
 * @internal Exported for testing
 * @param {number} count - Raw view count from YouTube API
 * @returns {string} Compact display string with K/M suffix
 */
export function formatViews(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
}

/**
 * Extract the 4-digit year from an ISO date string.
 * @internal Exported for testing
 * @param {string} dateString - ISO 8601 date (e.g. "2024-03-15")
 * @returns {string} Four-digit year (e.g. "2024")
 */
export function formatYear(dateString) {
    return new Date(dateString).getFullYear().toString()
}

/**
 * Format a date as relative time (e.g. "3d ago", "2w ago", "5mo ago", "1y ago").
 * @internal Exported for testing
 * @param {string} dateString - ISO 8601 date
 * @returns {string} Human-readable relative time string
 */
export function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
}
