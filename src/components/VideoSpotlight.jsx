/**
 * VideoSpotlight — Featured video showcase for the HubPage.
 * Displays a cinematic card with YouTube thumbnail, artist info,
 * view count, and a "Shuffle Pick" button that rotates through
 * the top-viewed videos. Clicking the card navigates to /videos
 * with a deep link to that specific video.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import './VideoSpotlight.css'

/** Top 20 videos by view count — the spotlight pool */
const SPOTLIGHT_POOL = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 20)

/** Pick a random index different from the current one */
function randomIndex(current, max) {
  if (max <= 1) return 0
  let next
  do { next = Math.floor(Math.random() * max) } while (next === current)
  return next
}

export default function VideoSpotlight() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * SPOTLIGHT_POOL.length))
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const sectionRef = useRef(null)

  const video = SPOTLIGHT_POOL[index]

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsRevealed(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleShuffle = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    // Brief fade-out, swap, fade-in
    setTimeout(() => {
      setIndex(prev => randomIndex(prev, SPOTLIGHT_POOL.length))
      setIsTransitioning(false)
    }, 300)
  }, [isTransitioning])

  const year = video.uploadDate ? new Date(video.uploadDate).getFullYear() : ''

  return (
    <section
      className={`video-spotlight ${isRevealed ? 'revealed' : ''}`}
      ref={sectionRef}
      aria-label="Featured video spotlight"
    >
      <div className="spotlight-label">
        <span className="spotlight-label-line" />
        <span className="spotlight-label-text">SPOTLIGHT</span>
        <span className="spotlight-label-line" />
      </div>

      <div className={`spotlight-card ${isTransitioning ? 'transitioning' : ''}`}>
        <Link
          to={`/videos?v=${video.youtubeId}`}
          className="spotlight-thumb-link"
          aria-label={`Watch ${video.title} by ${video.artist}`}
        >
          <img
            src={getThumbnailUrl(video.youtubeId, 'hqdefault')}
            alt={`${video.title} by ${video.artist}`}
            className="spotlight-thumb"
            width="480"
            height="360"
          />
          <div className="spotlight-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="spotlight-vignette" />
        </Link>

        <div className="spotlight-info">
          <h3 className="spotlight-title">{video.title}</h3>
          <p className="spotlight-artist">{video.artist}</p>
          <div className="spotlight-meta">
            <span className="spotlight-views">{formatViews(video.viewCount)} views</span>
            {year && <span className="spotlight-year">{year}</span>}
          </div>
        </div>
      </div>

      <button
        className="spotlight-shuffle"
        onClick={handleShuffle}
        aria-label="Show a different featured video"
        type="button"
        disabled={isTransitioning}
      >
        <span className="spotlight-shuffle-icon" aria-hidden="true">⟳</span>
        SHUFFLE PICK
      </button>
    </section>
  )
}
