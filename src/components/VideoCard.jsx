import './VideoCard.css'

export default function VideoCard({ video, onClick, isFavorite, onToggleFavorite, isNowPlaying, isUpNext }) {
    const thumbnailUrl = video.thumbnail ||
        `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`

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

/** @internal Exported for testing */
export function formatViews(count) {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
}

/** @internal Exported for testing */
export function formatYear(dateString) {
    return new Date(dateString).getFullYear().toString()
}

/** @internal Exported for testing */
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
