/**
 * DirectorsReel — Editorial montage section for the HubPage.
 * Asymmetric clip-path masked video thumbnails in a magazine-style
 * collage layout. Each cell is an organic shape that glows on hover.
 * Uses top-viewed videos with diverse artist selection.
 */
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { topByViews } from '../utils/videoFilters'
import { getThumbnailUrl } from '../utils/youtube'
import { formatViews } from '../utils/formatters'
import useScrollReveal from '../hooks/useScrollReveal'
import SectionLabel from './ui/SectionLabel'
import './DirectorsReel.css'

/**
 * Pick 5 top videos, ensuring artist diversity — no repeated artists.
 * Scans the top-viewed list and skips videos from artists already selected.
 */
function pickDiverseTop(count) {
  const seen = new Set()
  const picks = []
  for (const v of topByViews(VIDEOS)) {
    if (seen.has(v.artist)) continue
    seen.add(v.artist)
    picks.push(v)
    if (picks.length >= count) break
  }
  return picks
}

const REEL_VIDEOS = pickDiverseTop(5)

export default function DirectorsReel() {
  const sectionRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef, 0.15)

  return (
    <section
      className={`directors-reel ${isRevealed ? 'revealed' : ''}`}
      ref={sectionRef}
      aria-label="Director's Reel — Featured montage"
    >
      <SectionLabel text="DIRECTOR'S REEL" color="rgba(255, 0, 128, 0.6)" />
      <div className="directors-reel__grid">
        {REEL_VIDEOS.map((video, i) => (
          <Link
            key={video.youtubeId}
            to={`/video/${video.youtubeId}`}
            className={`directors-reel__cell directors-reel__cell--${i}`}
            style={{ '--cell-delay': `${i * 0.12}s` }}
            aria-label={`${video.title} by ${video.artist} — ${formatViews(video.viewCount)} views`}
          >
            <div className="directors-reel__frame">
              <img
                src={getThumbnailUrl(video.youtubeId, 'maxresdefault')}
                alt=""
                className="directors-reel__thumb"
                loading="lazy"
              />
              <div className="directors-reel__vignette" aria-hidden="true" />
            </div>
            <div className="directors-reel__info">
              <span className="directors-reel__artist">{video.artist}</span>
              <span className="directors-reel__title">{video.title}</span>
              <span className="directors-reel__views">{formatViews(video.viewCount)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
