/**
 * ArtistShowcase — Auto-scrolling artist spotlight ticker for the HubPage.
 * Shows top artists with YouTube thumbnails, names, video counts, and view stats.
 * Uses CSS-only infinite marquee animation (no JS timer for scroll).
 *
 * Also includes an animated stats counter that counts up on mount.
 * Stats use the shared useCountUp + useScrollReveal hooks (same as ImpactNumbers).
 */
import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import useCountUp from '../hooks/useCountUp'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './ArtistShowcase.css'

/** Top artists sorted by total views, take top 12 for the ticker */
const TOP_ARTISTS = ALL_ARTISTS
  .map(name => ({
    name,
    ...ARTIST_STATS[name],
    // Get the most-viewed video for this artist (for thumbnail)
    topVideo: VIDEOS
      .filter(v => v.artist === name)
      .sort((a, b) => b.viewCount - a.viewCount)[0]
  }))
  .sort((a, b) => b.totalViews - a.totalViews)
  .slice(0, 12)

/**
 * StatCounter — scroll-triggered animated stat using shared hooks.
 * Delegates intersection detection to useScrollReveal and animation to useCountUp,
 * eliminating the duplicate IntersectionObserver + RAF logic that lived here before.
 */
function StatCounter({ label, target, format, suffix = '', isVisible }) {
  const value = useCountUp(target, 2200, isVisible)
  const displayValue = format ? format(value) : value.toLocaleString()

  return (
    <div className="showcase-stat">
      <span className="showcase-stat-value">{displayValue}{suffix}</span>
      <span className="showcase-stat-label">{label}</span>
    </div>
  )
}

export default function ArtistShowcase() {
  const [isPaused, setIsPaused] = useState(false)
  const statsRef = useRef(null)
  const statsVisible = useScrollReveal(statsRef, 0.5)

  // Double the items for seamless infinite scroll
  const tickerItems = [...TOP_ARTISTS, ...TOP_ARTISTS]

  return (
    <section className="artist-showcase" aria-label="Featured artists">
      {/* Animated Stats Bar — single IntersectionObserver via useScrollReveal */}
      <div className="showcase-stats" ref={statsRef}>
        <StatCounter label="Videos" target={PORTFOLIO_STATS.totalVideos} isVisible={statsVisible} />
        <div className="showcase-stats-divider" />
        <StatCounter label="Artists" target={PORTFOLIO_STATS.totalArtists} isVisible={statsVisible} />
        <div className="showcase-stats-divider" />
        <StatCounter
          label="Total Views"
          target={PORTFOLIO_STATS.totalViews}
          format={formatViews}
          suffix="+"
          isVisible={statsVisible}
        />
        <div className="showcase-stats-divider" />
        <StatCounter
          label="Years Active"
          target={new Date().getFullYear() - parseInt(PORTFOLIO_STATS.earliestDate)}
          isVisible={statsVisible}
        />
      </div>

      {/* Section Label */}
      <SectionLabel text="TOP ARTISTS" color="rgba(255, 42, 109, 0.6)" className="showcase-label" />

      {/* Infinite Marquee Ticker */}
      <div
        className="showcase-ticker-wrap"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="marquee"
        aria-label="Scrolling artist showcase"
      >
        <div className={`showcase-ticker ${isPaused ? 'paused' : ''}`}>
          {tickerItems.map((artist, i) => (
            <Link
              to={`/videos?artist=${encodeURIComponent(artist.name)}`}
              className="showcase-artist-card"
              key={`${artist.name}-${i}`}
              aria-label={`View ${artist.name}'s videos`}
            >
              <div className="showcase-thumb-wrap">
                <img
                  src={getThumbnailUrl(artist.topVideo.youtubeId, 'mqdefault')}
                  alt={`${artist.name} - ${artist.topVideo.title}`}
                  className="showcase-thumb"
                  loading="lazy"
                  width="160"
                  height="90"
                />
                <span className="showcase-play-icon" aria-hidden="true">▶</span>
              </div>
              <div className="showcase-artist-info">
                <span className="showcase-artist-name">{artist.name}</span>
                <span className="showcase-artist-meta">
                  {artist.count} video{artist.count !== 1 ? 's' : ''} · {formatViews(artist.totalViews)} views
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
