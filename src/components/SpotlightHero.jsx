/**
 * SpotlightHero — Full-bleed, auto-cycling cinematic hero banner.
 * Netflix/streaming-platform-style showcase for top videos.
 * Cycles every 5s with crossfade, moody lighting, and neon accents.
 * Keyboard accessible: Left/Right arrows navigate, Space pauses.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { topByViews } from '../utils/videoFilters'
import { getThumbnailUrl } from '../utils/youtube'
import { formatViews } from '../utils/formatters'
import './SpotlightHero.css'

const FEATURED = topByViews(VIDEOS, 5)
const CYCLE_MS = 5000

export default function SpotlightHero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  const advance = useCallback((dir = 1) => {
    setActive(prev => (prev + dir + FEATURED.length) % FEATURED.length)
  }, [])

  // Auto-cycle timer
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => advance(), CYCLE_MS)
    return () => clearInterval(timerRef.current)
  }, [paused, advance])

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowRight') { advance(1); setPaused(true) }
    else if (e.key === 'ArrowLeft') { advance(-1); setPaused(true) }
    else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p) }
  }, [advance])

  const video = FEATURED[active]

  return (
    <section
      className="spotlight-hero"
      onKeyDown={handleKey}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured music videos"
    >
      {/* Stacked thumbnail layers for crossfade */}
      {FEATURED.map((v, i) => (
        <div
          key={v.youtubeId}
          className={`spotlight-hero__bg ${i === active ? 'spotlight-hero__bg--active' : ''}`}
          aria-hidden="true"
        >
          <img
            src={getThumbnailUrl(v.youtubeId, 'hqdefault')}
            alt=""
            draggable="false"
          />
        </div>
      ))}

      {/* Cinematic overlays */}
      <div className="spotlight-hero__vignette" aria-hidden="true" />
      <div className="spotlight-hero__grain" aria-hidden="true" />

      {/* Content */}
      <div className="spotlight-hero__content" aria-live="polite">
        <span className="spotlight-hero__label">FEATURED</span>
        <h2 className="spotlight-hero__artist" key={`a-${active}`}>{video.artist}</h2>
        <p className="spotlight-hero__title" key={`t-${active}`}>{video.title}</p>
        {video.viewCount > 0 && (
          <span className="spotlight-hero__views">{formatViews(video.viewCount)} views</span>
        )}
        <Link
          to={`/video/${video.youtubeId}`}
          className="spotlight-hero__cta"
          aria-label={`Watch ${video.title} by ${video.artist}`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          WATCH NOW
        </Link>
      </div>

      {/* Progress dots */}
      <div className="spotlight-hero__dots" role="tablist" aria-label="Choose a featured video">
        {FEATURED.map((v, i) => (
          <button
            key={v.youtubeId}
            className={`spotlight-hero__dot ${i === active ? 'spotlight-hero__dot--active' : ''}`}
            onClick={() => { setActive(i); setPaused(true) }}
            role="tab"
            aria-selected={i === active}
            aria-label={`${v.artist} — ${v.title}`}
          >
            <span className="spotlight-hero__dot-fill" style={i === active && !paused ? { animationDuration: `${CYCLE_MS}ms` } : undefined} />
          </button>
        ))}
      </div>
    </section>
  )
}
