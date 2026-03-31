/**
 * BroadcastBar — TV-channel-style "NOW ON AIR" chyron fixed to the viewport bottom.
 *
 * Auto-cycles through top videos with broadcast wipe transitions, a pulsing LIVE
 * indicator, and click-to-watch navigation. Makes the whole site feel like a music
 * video streaming network — exactly the "if a label had a platform" aesthetic.
 *
 * Pure CSS transitions (no JS animation frames), prefers-reduced-motion aware,
 * dismissable via close button with sessionStorage persistence.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { topByViews } from '../utils/videoFilters'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import './BroadcastBar.css'

const ROTATION_POOL = topByViews(VIDEOS, 12)
const CYCLE_MS = 6000
const DISMISSED_KEY = 'broadcast-bar-dismissed'

export default function BroadcastBar() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * ROTATION_POOL.length))
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISSED_KEY) === '1' } catch { return false }
  })
  const timerRef = useRef(null)
  const video = ROTATION_POOL[index]

  const advance = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setIndex(prev => (prev + 1) % ROTATION_POOL.length)
      setIsTransitioning(false)
    }, 400)
  }, [])

  useEffect(() => {
    if (dismissed) return
    timerRef.current = setInterval(advance, CYCLE_MS)
    return () => clearInterval(timerRef.current)
  }, [advance, dismissed])

  const handleDismiss = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
    try { sessionStorage.setItem(DISMISSED_KEY, '1') } catch { /* quota */ }
  }, [])

  if (dismissed || !video) return null

  const year = video.uploadDate ? new Date(video.uploadDate).getFullYear() : ''

  return (
    <div
      className="broadcast-bar"
      role="complementary"
      aria-label="Now on air — featured video"
    >
      <div className="broadcast-bar__live" aria-hidden="true">
        <span className="broadcast-bar__live-dot" />
        LIVE
      </div>

      <Link
        to={`/video/${video.youtubeId}`}
        className={`broadcast-bar__content ${isTransitioning ? 'broadcast-bar__content--out' : ''}`}
        aria-label={`Watch ${video.title} by ${video.artist}`}
      >
        <img
          className="broadcast-bar__thumb"
          src={getThumbnailUrl(video.youtubeId, 'default')}
          alt=""
          width="64"
          height="48"
          loading="lazy"
        />
        <div className="broadcast-bar__meta">
          <span className="broadcast-bar__title">{video.title}</span>
          <span className="broadcast-bar__artist">
            {video.artist}
            {year && <span className="broadcast-bar__year"> · {year}</span>}
            <span className="broadcast-bar__views">{formatViews(video.viewCount)}</span>
          </span>
        </div>
        <span className="broadcast-bar__cta" aria-hidden="true">WATCH ▸</span>
      </Link>

      <div className="broadcast-bar__progress" aria-hidden="true">
        <div
          className="broadcast-bar__progress-fill"
          key={index}
        />
      </div>

      <button
        className="broadcast-bar__close"
        onClick={handleDismiss}
        aria-label="Dismiss broadcast bar"
        type="button"
      >
        ✕
      </button>
    </div>
  )
}
