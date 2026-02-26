/**
 * TopHits — Netflix Top 10-style ranked showcase of the most-viewed videos.
 *
 * Displays the top 10 videos by view count in a horizontally scrollable
 * strip with oversized neon rank numbers, cinematic thumbnails, and
 * animated view count badges. Each card links to the video detail page.
 *
 * All data is pre-computed at import time (zero runtime API cost).
 * Uses IntersectionObserver for scroll-triggered staggered reveals.
 */
import { useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { formatViews, formatYear } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import SectionLabel from './ui/SectionLabel'
import './TopHits.css'

/** Neon accent colors cycling through the synthwave palette per rank */
const RANK_COLORS = [
  '#ffcc00', // #1 — Gold
  '#ff2a6d', // #2 — Neon pink
  '#05d9e8', // #3 — Neon cyan
  '#d300c5', // #4 — Neon purple
  '#ff6b35', // #5 — Neon orange
  '#00ff88', // #6 — Neon green
  '#7700ff', // #7 — Neon blue
  '#ff2a6d', // #8 — Pink
  '#05d9e8', // #9 — Cyan
  '#ffcc00', // #10 — Gold
]

export default function TopHits() {
  const trackRef = useRef(null)

  /** Top 10 videos sorted by view count, computed once at mount */
  const topVideos = useMemo(() =>
    [...VIDEOS]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10),
    []
  )

  /** IntersectionObserver for staggered card reveal */
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const cards = track.querySelectorAll('.top-hit-card')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('top-hit-card--visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [topVideos])

  return (
    <section className="top-hits" aria-label="Top 10 most viewed videos">
      <SectionLabel
        text="TOP HITS"
        color="rgba(255, 204, 0, 0.6)"
        as="h2"
        className="top-hits-header"
      />
      <p className="top-hits-sub">Most viewed productions — ranked by lifetime plays</p>

      <div className="top-hits-track" ref={trackRef} role="list">
        {topVideos.map((video, i) => (
          <Link
            key={video.youtubeId}
            to={`/video/${video.youtubeId}`}
            className="top-hit-card"
            style={{
              '--rank-color': RANK_COLORS[i],
              '--reveal-delay': `${i * 80}ms`,
            }}
            role="listitem"
            aria-label={`#${i + 1}: ${video.title} — ${formatViews(video.viewCount)} views`}
          >
            {/* Oversized rank number — Netflix Top 10 style */}
            <span className="top-hit-rank" aria-hidden="true">
              {i + 1}
            </span>

            {/* Thumbnail with cinematic overlay */}
            <div className="top-hit-thumb-wrap">
              <img
                src={getThumbnailUrl(video.youtubeId, 'mqdefault')}
                alt=""
                className="top-hit-thumb"
                loading="lazy"
                width="320"
                height="180"
              />
              <div className="top-hit-thumb-overlay" aria-hidden="true" />

              {/* View count badge */}
              <span className="top-hit-views-badge">
                <svg className="top-hit-play-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M4 2.5v11l9-5.5L4 2.5z" />
                </svg>
                {formatViews(video.viewCount)}
              </span>
            </div>

            {/* Metadata */}
            <div className="top-hit-info">
              <span className="top-hit-artist">{video.artist}</span>
              <span className="top-hit-title">{video.description || video.title.replace(`${video.artist} - `, '')}</span>
              <span className="top-hit-year">{formatYear(video.uploadDate)}</span>
            </div>

            {/* Hover accent line */}
            <div className="top-hit-accent" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
