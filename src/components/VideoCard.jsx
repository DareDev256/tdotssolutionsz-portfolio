import './VideoCard.css'

export default function VideoCard({ video, onClick }) {
    const thumbnailUrl = video.thumbnail ||
        `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`

    return (
        <article className="video-card" onClick={onClick}>
            <div className="card-thumbnail">
                <img
                    src={thumbnailUrl}
                    alt={video.title}
                    loading="lazy"
                />
                <div className="play-overlay">
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
                        {formatDate(video.uploadDate)}
                    </span>
                </div>
            </div>
        </article>
    )
}

function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
}
