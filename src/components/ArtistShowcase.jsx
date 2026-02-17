/**
 * ArtistShowcase — Auto-scrolling artist spotlight ticker for the HubPage.
 * Shows top artists with YouTube thumbnails, names, video counts, and view stats.
 * Uses CSS-only infinite marquee animation (no JS timer for scroll).
 *
 * Also includes an animated stats counter that counts up on mount.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS, ALL_ARTISTS, ARTIST_STATS, PORTFOLIO_STATS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
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
 * Animate a number counting up from 0 to target.
 * Uses requestAnimationFrame for smooth 60fps animation.
 */
function useCountUp(target, duration = 2000) {
  const [value, setValue] = useState(0)
  const started = useRef(false)
  const ref = useRef(null)

  const startAnimation = useCallback(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return { value, ref, startAnimation }
}

function StatCounter({ label, target, format, suffix = '' }) {
  const { value, ref, startAnimation } = useCountUp(target, 2200)
  const observed = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    // Use a local variable — IntersectionObserver fires the callback when it starts
    const el = document.getElementById(`stat-${label.replace(/\s/g, '-')}`)
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !observed.current) {
          observed.current = true
          startAnimation()
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [label, startAnimation])

  const displayValue = format ? format(value) : value.toLocaleString()

  return (
    <div className="showcase-stat" id={`stat-${label.replace(/\s/g, '-')}`} ref={ref}>
      <span className="showcase-stat-value">{displayValue}{suffix}</span>
      <span className="showcase-stat-label">{label}</span>
    </div>
  )
}

export default function ArtistShowcase() {
  const [isPaused, setIsPaused] = useState(false)

  // Double the items for seamless infinite scroll
  const tickerItems = [...TOP_ARTISTS, ...TOP_ARTISTS]

  return (
    <section className="artist-showcase" aria-label="Featured artists">
      {/* Animated Stats Bar */}
      <div className="showcase-stats">
        <StatCounter label="Videos" target={PORTFOLIO_STATS.totalVideos} />
        <div className="showcase-stats-divider" />
        <StatCounter label="Artists" target={PORTFOLIO_STATS.totalArtists} />
        <div className="showcase-stats-divider" />
        <StatCounter
          label="Total Views"
          target={PORTFOLIO_STATS.totalViews}
          format={formatViews}
          suffix="+"
        />
        <div className="showcase-stats-divider" />
        <StatCounter
          label="Years Active"
          target={new Date().getFullYear() - parseInt(PORTFOLIO_STATS.earliestDate)}
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
