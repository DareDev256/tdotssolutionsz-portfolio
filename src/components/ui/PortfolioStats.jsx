import { PORTFOLIO_STATS } from '../../utils/videoData'
import { formatViews } from '../../utils/formatters'

export const PortfolioStats = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    const yearRange = `${PORTFOLIO_STATS.earliestDate.slice(0, 4)}–${PORTFOLIO_STATS.latestDate.slice(0, 4)}`

    return (
        <div className="portfolio-stats-overlay" onClick={onClose}>
            <div className="portfolio-stats-panel" onClick={e => e.stopPropagation()}>
                <button className="portfolio-stats-close" onClick={onClose} aria-label="Close stats">✕</button>
                <h2 className="portfolio-stats-title">PORTFOLIO STATS</h2>
                <div className="portfolio-stats-grid">
                    <div className="stat-card">
                        <span className="stat-value">{PORTFOLIO_STATS.totalVideos}</span>
                        <span className="stat-label">Music Videos</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{PORTFOLIO_STATS.totalArtists}</span>
                        <span className="stat-label">Artists</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{formatViews(PORTFOLIO_STATS.totalViews)}</span>
                        <span className="stat-label">Total Views</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{yearRange}</span>
                        <span className="stat-label">Year Range</span>
                    </div>
                </div>
                {PORTFOLIO_STATS.topArtist && (
                    <div className="portfolio-stats-top-artist">
                        <span className="top-artist-label">Top Artist by Views</span>
                        <span className="top-artist-name">{PORTFOLIO_STATS.topArtist.name}</span>
                        <span className="top-artist-meta">
                            {PORTFOLIO_STATS.topArtist.count} video{PORTFOLIO_STATS.topArtist.count > 1 ? 's' : ''}
                            {' · '}{formatViews(PORTFOLIO_STATS.topArtist.totalViews)} views
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
