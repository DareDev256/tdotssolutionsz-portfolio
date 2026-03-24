/**
 * FilmStrip — Cinematic 35mm film strip with scrolling video thumbnails.
 * Continuous CSS animation creates ambient motion between HubPage sections.
 * Respects prefers-reduced-motion. Clicking a frame navigates to the video.
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { topByViews } from '../utils/videoFilters'
import { getThumbnailUrl } from '../utils/youtube'
import './FilmStrip.css'

const FRAME_COUNT = 14

export default function FilmStrip() {
  const navigate = useNavigate()

  const frames = useMemo(() => topByViews(VIDEOS, FRAME_COUNT), [])

  // Duplicate frames for seamless infinite scroll loop
  const doubledFrames = useMemo(() => [...frames, ...frames], [frames])

  function handleFrameClick(video) {
    navigate(`/video/${video.youtubeId}`)
  }

  return (
    <div className="film-strip" aria-label="Featured videos film strip" role="marquee">
      <div className="film-strip__track">
        {doubledFrames.map((video, i) => (
          <button
            key={`${video.youtubeId}-${i}`}
            className="film-strip__frame"
            onClick={() => handleFrameClick(video)}
            aria-label={`${video.title} by ${video.artist}`}
            type="button"
          >
            <div className="film-strip__sprockets" aria-hidden="true">
              <span className="film-strip__hole" />
              <span className="film-strip__hole" />
            </div>
            <div className="film-strip__image-wrap">
              <img
                src={getThumbnailUrl(video.youtubeId, 'mqdefault')}
                alt=""
                className="film-strip__image"
                loading="lazy"
                draggable="false"
              />
              <span className="film-strip__frame-label">{video.artist}</span>
            </div>
            <div className="film-strip__sprockets film-strip__sprockets--bottom" aria-hidden="true">
              <span className="film-strip__hole" />
              <span className="film-strip__hole" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
