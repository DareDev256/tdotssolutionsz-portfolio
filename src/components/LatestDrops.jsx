/**
 * LatestDrops — Asymmetric editorial grid for recent releases.
 * Magazine spread layout: one hero card + smaller stacked cards.
 * Not a uniform rail — editorial tension through size contrast.
 */
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { latestFirst } from '../utils/videoFilters'
import { formatViews, formatDate } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './LatestDrops.css'

const LATEST = latestFirst(VIDEOS, 5)

const FRESH_THRESHOLD_MS = 180 * 24 * 60 * 60 * 1000

function isFresh(uploadDate) {
  return Date.now() - new Date(uploadDate).getTime() < FRESH_THRESHOLD_MS
}

export default function LatestDrops() {
  const sectionRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef)

  const hero = LATEST[0]
  const rest = LATEST.slice(1)

  return (
    <section
      className={`latest-drops ${isRevealed ? 'latest-drops--visible' : ''}`}
      ref={sectionRef}
      aria-label="Latest video releases"
    >
      <SectionLabel text="LATEST DROPS" color="rgba(74, 124, 255, 0.45)" as="h2" />

      <div className="latest-drops__grid">
        {/* Hero card — large left */}
        <Link
          to={`/video/${hero.youtubeId}`}
          className="latest-drops__hero"
          aria-label={`${hero.title} by ${hero.artist}`}
        >
          <div className="latest-drops__hero-img">
            <img
              src={getThumbnailUrl(hero.youtubeId, 'hqdefault')}
              alt=""
              loading="lazy"
              draggable="false"
            />
            <div className="latest-drops__hero-overlay" aria-hidden="true" />
            <div className="latest-drops__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
            {isFresh(hero.uploadDate) && (
              <span className="latest-drops__badge">NEW</span>
            )}
          </div>
          <div className="latest-drops__hero-info">
            <span className="latest-drops__artist">{hero.artist}</span>
            <h3 className="latest-drops__hero-title">{hero.title}</h3>
            <div className="latest-drops__meta">
              <span>{formatViews(hero.viewCount)} views</span>
              <span className="latest-drops__dot">·</span>
              <span>{formatDate(hero.uploadDate)}</span>
            </div>
          </div>
        </Link>

        {/* Stacked cards — right column */}
        <div className="latest-drops__stack">
          {rest.map((video, i) => (
            <Link
              to={`/video/${video.youtubeId}`}
              key={video.youtubeId}
              className="latest-drops__card"
              style={{ '--stack-index': i }}
              aria-label={`${video.title} by ${video.artist}`}
            >
              <div className="latest-drops__card-img">
                <img
                  src={getThumbnailUrl(video.youtubeId, 'mqdefault')}
                  alt=""
                  loading="lazy"
                  draggable="false"
                />
                <div className="latest-drops__play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </div>
                {isFresh(video.uploadDate) && (
                  <span className="latest-drops__badge latest-drops__badge--sm">NEW</span>
                )}
              </div>
              <div className="latest-drops__card-info">
                <span className="latest-drops__artist">{video.artist}</span>
                <h3 className="latest-drops__card-title">{video.title}</h3>
                <span className="latest-drops__card-meta">{formatViews(video.viewCount)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
