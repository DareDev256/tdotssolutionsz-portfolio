/**
 * NowPlayingOverlay — Astroworld-inspired "Now Playing" bar.
 *
 * A persistent, fixed-bottom overlay that showcases a featured track
 * with a glowing portal thumbnail, equalizer animation, artist info,
 * and a subtle progress bar that loops. Appears after a 3s delay on
 * the HubPage and can be dismissed. Picks from the top-viewed videos
 * and rotates the featured track every 30 seconds.
 *
 * Design reference: Travis Scott Astroworld site — glowing portals,
 * neon luminescence against deep dark backdrop.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { VIDEOS } from '../utils/videoData'
import { getThumbnailUrl } from '../utils/youtube'
import './NowPlayingOverlay.css'

/** Top 8 most-viewed — the "featured" rotation pool */
const FEATURED_POOL = [...VIDEOS]
  .sort((a, b) => b.viewCount - a.viewCount)
  .slice(0, 8)

/** Accent colors that cycle with each track */
const ACCENTS = ['#ff2a6d', '#05d9e8', '#d300c5', '#00ff88', '#ff6b35']

/** Duration of one simulated "playback" cycle in ms */
const CYCLE_MS = 30_000

export default function NowPlayingOverlay() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [trackIdx, setTrackIdx] = useState(() => Math.floor(Math.random() * FEATURED_POOL.length))
  const [progress, setProgress] = useState(0)
  const startRef = useRef(Date.now())
  const rafRef = useRef(null)

  const track = FEATURED_POOL[trackIdx]
  const accent = ACCENTS[trackIdx % ACCENTS.length]

  // Appear after a 3s delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Animate progress & rotate tracks
  useEffect(() => {
    if (dismissed) return
    startRef.current = Date.now()
    setProgress(0)

    function tick() {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min((elapsed / CYCLE_MS) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        setTrackIdx(prev => (prev + 1) % FEATURED_POOL.length)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [trackIdx, dismissed])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  if (dismissed && !visible) return null

  const cls = [
    'now-playing',
    visible && !dismissed ? 'np-visible' : '',
    dismissed ? 'np-dismissed' : '',
  ].filter(Boolean).join(' ')

  return (
    <aside
      className={cls}
      style={{ '--np-accent': accent, '--np-progress': `${progress}%` }}
      role="complementary"
      aria-label={`Now featuring: ${track.title} by ${track.artist}`}
    >
      <div className="np-glow" aria-hidden="true" />
      <div className="np-bar">
        <div className="np-progress-track" aria-hidden="true">
          <div className="np-progress-fill" />
        </div>

        <div className="np-thumb-wrap">
          <img
            className="np-thumb"
            src={getThumbnailUrl(track.youtubeId)}
            alt={`${track.title} thumbnail`}
            loading="lazy"
            width="56"
            height="56"
          />
          <div className="np-eq" aria-hidden="true">
            <span className="np-eq-bar" />
            <span className="np-eq-bar" />
            <span className="np-eq-bar" />
          </div>
        </div>

        <div className="np-info">
          <span className="np-label">NOW PLAYING</span>
          <span className="np-title">{track.description || track.title}</span>
          <span className="np-artist">{track.artist}</span>
        </div>

        <Link
          to={`/videos?v=${track.youtubeId}`}
          className="np-cta"
          aria-label={`Watch ${track.title}`}
        >
          WATCH
        </Link>

        <button
          className="np-close"
          onClick={handleDismiss}
          aria-label="Dismiss now playing"
          type="button"
        >
          ✕
        </button>
      </div>
    </aside>
  )
}
