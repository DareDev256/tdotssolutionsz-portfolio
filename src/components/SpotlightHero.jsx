/**
 * SpotlightHero — Massive typography editorial hero.
 * "TDOTS" in oversized type overlapping a featured video thumbnail.
 * Auto-cycles featured videos with crossfade. The type IS the design.
 * Mobile: stacked layout, type scales but stays impactful.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { topByViews } from '../utils/videoFilters'
import { getThumbnailUrl } from '../utils/youtube'
import { formatViews } from '../utils/formatters'
import './SpotlightHero.css'

const FEATURED = topByViews(VIDEOS, 5)
const CYCLE_MS = 6000

export default function SpotlightHero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  const advance = useCallback((dir = 1) => {
    setActive(prev => (prev + dir + FEATURED.length) % FEATURED.length)
  }, [])

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
      {/* Massive background type — the design element */}
      <div className="spotlight-hero__bigtype" aria-hidden="true">
        TDOTS
      </div>

      {/* Featured thumbnail — sits inside the type */}
      <div className="spotlight-hero__visual">
        {FEATURED.map((v, i) => (
          <div
            key={v.youtubeId}
            className={`spotlight-hero__img ${i === active ? 'spotlight-hero__img--active' : ''}`}
          >
            <img
              src={getThumbnailUrl(v.youtubeId, 'hqdefault')}
              alt={i === active ? `${v.artist} — ${v.title}` : ''}
              draggable="false"
            />
          </div>
        ))}
        <div className="spotlight-hero__img-vignette" aria-hidden="true" />
      </div>

      {/* Artist info — overlaps bottom of visual */}
      <div className="spotlight-hero__info" aria-live="polite">
        <div className="spotlight-hero__meta">
          <span className="spotlight-hero__label">NOW FEATURING</span>
          {video.viewCount > 0 && (
            <span className="spotlight-hero__views">{formatViews(video.viewCount)} views</span>
          )}
        </div>
        <h2 className="spotlight-hero__artist" key={`a-${active}`}>{video.artist}</h2>
        <p className="spotlight-hero__title" key={`t-${active}`}>{video.title}</p>
        <Link
          to={`/video/${video.youtubeId}`}
          className="spotlight-hero__cta"
          aria-label={`Watch ${video.title} by ${video.artist}`}
        >
          WATCH
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </Link>
      </div>

      {/* Progress indicators */}
      <div className="spotlight-hero__progress" role="tablist" aria-label="Choose a featured video">
        {FEATURED.map((v, i) => (
          <button
            key={v.youtubeId}
            className={`spotlight-hero__pip ${i === active ? 'spotlight-hero__pip--active' : ''}`}
            onClick={() => { setActive(i); setPaused(true) }}
            role="tab"
            aria-selected={i === active}
            aria-label={`${v.artist} — ${v.title}`}
          >
            <span
              className="spotlight-hero__pip-fill"
              style={i === active && !paused ? { animationDuration: `${CYCLE_MS}ms` } : undefined}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
