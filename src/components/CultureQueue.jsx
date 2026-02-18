/**
 * CultureQueue — Horizontal scroll-snap video strip on HubPage.
 * A cinematic reel of curated video previews with hover-activated
 * neon glow, subtle scale transitions, and scroll-snap navigation.
 * Evokes a "streaming platform queue" feel — moody, immersive,
 * and discoverable.
 */
import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './CultureQueue.css'

/** Curated queue: 12 most-viewed videos, diverse enough for a full strip */
const QUEUE = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 12)

export default function CultureQueue() {
  const sectionRef = useRef(null)
  const scrollRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef)
  const [hoveredId, setHoveredId] = useState(null)

  const scroll = useCallback((dir) => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector('.cq-card')?.offsetWidth || 280
    el.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' })
  }, [])

  return (
    <section
      className={`culture-queue ${isRevealed ? 'revealed' : ''}`}
      ref={sectionRef}
      aria-label="Culture Queue — curated video previews"
    >
      <SectionLabel text="CULTURE QUEUE" color="rgba(211, 0, 197, 0.6)" className="cq-label" />

      <div className="cq-track-wrapper">
        <button
          className="cq-nav cq-nav--prev"
          onClick={() => scroll(-1)}
          aria-label="Scroll queue left"
          type="button"
        >
          ‹
        </button>

        <div className="cq-track" ref={scrollRef} role="list">
          {QUEUE.map((video) => {
            const year = video.uploadDate ? new Date(video.uploadDate).getFullYear() : ''
            const isHovered = hoveredId === video.id
            return (
              <Link
                key={video.id}
                to={`/video/${video.youtubeId}`}
                className={`cq-card ${isHovered ? 'cq-card--active' : ''}`}
                role="listitem"
                aria-label={`Watch ${video.title} by ${video.artist}`}
                onMouseEnter={() => setHoveredId(video.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(video.id)}
                onBlur={() => setHoveredId(null)}
              >
                <div className="cq-thumb-wrap">
                  <img
                    src={getThumbnailUrl(video.youtubeId, 'mqdefault')}
                    alt=""
                    className="cq-thumb"
                    loading="lazy"
                    width="320"
                    height="180"
                  />
                  <div className="cq-scanline" aria-hidden="true" />
                  <div className="cq-vignette" aria-hidden="true" />
                  <div className="cq-glow" aria-hidden="true" />
                  <div className="cq-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                <div className="cq-meta">
                  <span className="cq-artist">{video.artist}</span>
                  <span className="cq-title">{video.title}</span>
                  <span className="cq-stats">
                    <span className="cq-views">{formatViews(video.viewCount)}</span>
                    {year && <span className="cq-year">{year}</span>}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <button
          className="cq-nav cq-nav--next"
          onClick={() => scroll(1)}
          aria-label="Scroll queue right"
          type="button"
        >
          ›
        </button>
      </div>
    </section>
  )
}
