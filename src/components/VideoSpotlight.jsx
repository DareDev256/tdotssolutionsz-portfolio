/**
 * VideoSpotlight — Featured video showcase for the HubPage.
 * Displays a cinematic card with YouTube thumbnail, artist info,
 * view count, and a "Shuffle Pick" button that rotates through
 * the top-viewed videos. Clicking the card navigates to /videos
 * with a deep link to that specific video.
 *
 * Uses a sliding-window history buffer (same pattern as useShufflePlay)
 * to guarantee diverse picks — users see the full top-20 rotation
 * before any video repeats.
 */
import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './VideoSpotlight.css'

/** Top 20 videos by view count — the spotlight pool */
const SPOTLIGHT_POOL = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 20)

/**
 * How many recent picks to exclude from candidates.
 * Set to pool - 1 so every video shows before any repeats.
 */
const HISTORY_SIZE = Math.max(1, SPOTLIGHT_POOL.length - 1)

/**
 * Pick a diverse random video from the pool, excluding recently shown IDs
 * AND the currently displayed video (prevents "ghost shuffles" where the
 * card fades out and back with the same content).
 *
 * @param {string[]} history - Array of recently shown youtubeId values
 * @param {string}   currentId - youtubeId of the currently displayed video
 * @returns {number} Index into SPOTLIGHT_POOL
 */
function diversePick(history, currentId) {
  const excludeSet = new Set(history)
  // Always exclude the current video even if it aged out of the window
  if (currentId) excludeSet.add(currentId)

  const candidates = SPOTLIGHT_POOL
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => !excludeSet.has(v.youtubeId))

  // If history + current exhausted the entire pool, allow all except current
  const pool = candidates.length > 0
    ? candidates
    : SPOTLIGHT_POOL
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v.youtubeId !== currentId)
  return pool[Math.floor(Math.random() * pool.length)].i
}

export default function VideoSpotlight() {
  const [index, setIndex] = useState(() => {
    return Math.floor(Math.random() * SPOTLIGHT_POOL.length)
  })
  // Eagerly seed history with the initial pick — no useEffect race condition.
  // useRef initializer runs synchronously, so history is never null/empty
  // when handleShuffle fires, even before the first paint.
  const historyRef = useRef([SPOTLIGHT_POOL[index]?.youtubeId].filter(Boolean))
  const transitionRef = useRef(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const sectionRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef)

  const video = SPOTLIGHT_POOL[index]

  const handleShuffle = useCallback(() => {
    if (transitionRef.current) return
    transitionRef.current = true
    setIsTransitioning(true)
    // Brief fade-out, swap, fade-in
    setTimeout(() => {
      setIndex(prev => {
        const currentId = SPOTLIGHT_POOL[prev]?.youtubeId
        const history = historyRef.current
        const nextIdx = diversePick(history, currentId)
        history.push(SPOTLIGHT_POOL[nextIdx].youtubeId)
        // Maintain sliding window — trim oldest when exceeding HISTORY_SIZE
        if (history.length > HISTORY_SIZE) history.shift()
        return nextIdx
      })
      transitionRef.current = false
      setIsTransitioning(false)
    }, 300)
  }, [])

  const year = video.uploadDate ? new Date(video.uploadDate).getFullYear() : ''

  return (
    <section
      className={`video-spotlight ${isRevealed ? 'revealed' : ''}`}
      ref={sectionRef}
      aria-label="Featured video spotlight"
    >
      <SectionLabel text="SPOTLIGHT" color="rgba(255, 0, 128, 0.6)" className="spotlight-label" />

      <div className={`spotlight-card ${isTransitioning ? 'transitioning' : ''}`}>
        <Link
          to={`/video/${video.youtubeId}`}
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
