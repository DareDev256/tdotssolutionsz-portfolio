/**
 * LatestDrops — "New Releases" horizontal scroll row for the HubPage.
 * Netflix-style card rail showing the 8 most recent videos with
 * drag-to-scroll, "NEW" badges, cinematic hover effects, and
 * neon accent glow. Fills the discovery gap: TopHits = popular,
 * FilmStrip = top viewed, EraTimeline = historical, LatestDrops = recent.
 */
import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { latestFirst } from '../utils/videoFilters'
import { formatViews, formatDate } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './LatestDrops.css'

const LATEST = latestFirst(VIDEOS, 8)

/** Videos uploaded within 180 days get a "NEW" badge */
const FRESH_THRESHOLD_MS = 180 * 24 * 60 * 60 * 1000

function isFresh(uploadDate) {
  return Date.now() - new Date(uploadDate).getTime() < FRESH_THRESHOLD_MS
}

export default function LatestDrops() {
  const sectionRef = useRef(null)
  const railRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startX: 0, scrollLeft: 0, moved: false })

  const handlePointerDown = useCallback((e) => {
    const rail = railRef.current
    if (!rail) return
    setIsDragging(true)
    dragState.current = {
      startX: e.clientX,
      scrollLeft: rail.scrollLeft,
      moved: false,
    }
    rail.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return
    const dx = e.clientX - dragState.current.startX
    if (Math.abs(dx) > 4) dragState.current.moved = true
    railRef.current.scrollLeft = dragState.current.scrollLeft - dx
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <section
      className={`latest-drops ${isRevealed ? 'latest-drops--visible' : ''}`}
      ref={sectionRef}
      aria-label="Latest video releases"
    >
      <SectionLabel text="LATEST DROPS" color="rgba(74, 124, 255, 0.45)" as="h2" />
      <p className="latest-drops__sub">Recent releases from the catalogue</p>

      <div
        className={`latest-drops__rail ${isDragging ? 'is-dragging' : ''}`}
        ref={railRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="list"
      >
        {LATEST.map((video, i) => {
          const fresh = isFresh(video.uploadDate)
          return (
            <Link
              to={`/video/${video.youtubeId}`}
              key={video.youtubeId}
              className="latest-drops__card"
              style={{ '--card-index': i }}
              role="listitem"
              onClick={(e) => { if (dragState.current.moved) e.preventDefault() }}
              aria-label={`${video.title} by ${video.artist}`}
            >
              <div className="latest-drops__thumb">
                <img
                  src={getThumbnailUrl(video.youtubeId, 'mqdefault')}
                  alt=""
                  loading="lazy"
                  draggable="false"
                  width="320"
                  height="180"
                />
                <div className="latest-drops__play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="codex-preview-bar" aria-hidden="true" />
                <span className="codex-preview-label" aria-hidden="true">PREVIEW</span>
                {fresh && <span className="latest-drops__badge">NEW</span>}
              </div>

              <div className="latest-drops__info">
                <span className="latest-drops__artist">{video.artist}</span>
                <h3 className="latest-drops__title">{video.title}</h3>
                <div className="latest-drops__meta">
                  <span>{formatViews(video.viewCount)} views</span>
                  <span className="latest-drops__dot">·</span>
                  <span>{formatDate(video.uploadDate)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
