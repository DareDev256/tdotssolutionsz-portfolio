/**
 * VideoSpotlight — "Now Playing" cinematic hero for the HubPage.
 * Full-bleed viewport section with hover-to-play YouTube preview,
 * cinematic gradient overlay, pulsing NOW PLAYING badge, and
 * WATCH NOW CTA. Shuffles through top-20 videos with no-repeat history.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import useScrollReveal from '../hooks/useScrollReveal'
import useCinematicScroll from '../hooks/useCinematicScroll'
import SpotlightPortal from './SpotlightPortal'
import './VideoSpotlight.css'

const SPOTLIGHT_POOL = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 20)

const HISTORY_SIZE = Math.max(1, SPOTLIGHT_POOL.length - 1)

function diversePick(history) {
  const historySet = new Set(history)
  const candidates = SPOTLIGHT_POOL
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => !historySet.has(v.youtubeId))
  const pool = candidates.length > 0 ? candidates : SPOTLIGHT_POOL.map((v, i) => ({ v, i }))
  return pool[Math.floor(Math.random() * pool.length)].i
}

export default function VideoSpotlight() {
  const historyRef = useRef(null)
  const transitionRef = useRef(false)
  const [index, setIndex] = useState(() => Math.floor(Math.random() * SPOTLIGHT_POOL.length))
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const sectionRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef)
  const scrollProgress = useCinematicScroll(sectionRef)
  const video = SPOTLIGHT_POOL[index]
  const year = video.uploadDate ? new Date(video.uploadDate).getFullYear() : ''

  useEffect(() => {
    if (historyRef.current === null) {
      historyRef.current = [SPOTLIGHT_POOL[index].youtubeId]
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleShuffle = useCallback(() => {
    if (transitionRef.current) return
    transitionRef.current = true
    setIsTransitioning(true)
    setIsHovering(false)
    setIsMuted(true)
    setTimeout(() => {
      const history = historyRef.current || []
      const nextIdx = diversePick(history)
      history.push(SPOTLIGHT_POOL[nextIdx].youtubeId)
      if (history.length > HISTORY_SIZE) history.shift()
      historyRef.current = history
      setIndex(nextIdx)
      transitionRef.current = false
      setIsTransitioning(false)
    }, 400)
  }, [])

  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${video.youtubeId}&enablejsapi=1`

  // CSS custom properties drive the cinematic parallax + dolly zoom
  const cinematicStyle = {
    '--scroll-progress': scrollProgress,
    '--parallax-y': `${(1 - scrollProgress) * 20}px`,
    '--dolly-scale': 1 + scrollProgress * 0.04,
    '--info-offset': `${(1 - scrollProgress) * 15}px`,
  }

  return (
    <section
      className={`now-playing ${isRevealed ? 'revealed' : ''}`}
      ref={sectionRef}
      style={cinematicStyle}
      aria-label="Now Playing — Featured video"
    >
      <SpotlightPortal colorIndex={index} />
      <div
        className={`now-playing__viewport ${isTransitioning ? 'transitioning' : ''} ${isHovering ? 'is-playing' : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setIsMuted(true) }}
      >
        <img
          src={getThumbnailUrl(video.youtubeId, 'maxresdefault')}
          alt={`${video.title} by ${video.artist}`}
          className="now-playing__thumb"
        />

        {isHovering && (
          <iframe
            key={`${video.youtubeId}-${isMuted}`}
            className="now-playing__iframe"
            src={embedUrl}
            title={`Preview: ${video.title}`}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        )}

        <div className="now-playing__overlay" aria-hidden="true" />

        <div className="now-playing__badge" aria-hidden="true">
          <span className="now-playing__dot" />
          NOW PLAYING
        </div>

        {isHovering && (
          <button
            className="now-playing__mute"
            onClick={() => setIsMuted(m => !m)}
            aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              {isMuted
                ? <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-3.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              }
            </svg>
          </button>
        )}

        <div className="now-playing__info">
          <span className="now-playing__artist">{video.artist}</span>
          <h3 className="now-playing__title">{video.title}</h3>
          <div className="now-playing__meta">
            <span>{formatViews(video.viewCount)} views</span>
            {year && <span className="now-playing__year">{year}</span>}
          </div>
          <div className="now-playing__actions">
            <Link to={`/video/${video.youtubeId}`} className="now-playing__cta">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z" /></svg>
              WATCH NOW
            </Link>
            <button
              className="now-playing__shuffle"
              onClick={handleShuffle}
              disabled={isTransitioning}
              type="button"
              aria-label="Shuffle to next featured video"
            >
              ⟳ NEXT
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
