/**
 * EraTimeline — Interactive production era timeline for the HubPage.
 * Groups the 101-video catalog into distinct eras, showing the evolution
 * of TdotsSolutionsz across 14+ years of Toronto hip-hop videography.
 *
 * All data is pre-computed at import time (zero runtime API cost).
 * Uses IntersectionObserver for scroll-triggered reveal animations.
 */
import { useEffect, useRef } from 'react'
import { VIDEOS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { getThumbnailUrl } from '../utils/youtube'
import './EraTimeline.css'

/** Era definitions — each represents a chapter in the production journey */
const ERA_DEFS = [
  { id: 'origins', label: 'THE ORIGINS', range: [2010, 2014], color: '#7700ff', icon: '🌱' },
  { id: 'rise', label: 'THE RISE', range: [2015, 2017], color: '#ff2a6d', icon: '🔥' },
  { id: 'peak', label: 'PEAK ERA', range: [2018, 2020], color: '#05d9e8', icon: '⚡' },
  { id: 'modern', label: 'NEW WAVE', range: [2021, 2026], color: '#00ff88', icon: '🚀' },
]

/** Pre-compute era stats from video data */
const ERAS = ERA_DEFS.map(era => {
  const videos = VIDEOS.filter(v => {
    const year = new Date(v.uploadDate).getFullYear()
    return year >= era.range[0] && year <= era.range[1]
  }).sort((a, b) => b.viewCount - a.viewCount)

  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0)
  const uniqueArtists = new Set(videos.map(v => v.artist)).size
  const topVideo = videos[0] || null

  return { ...era, videos, totalViews, uniqueArtists, topVideo, count: videos.length }
}).filter(era => era.count > 0)

export default function EraTimeline() {
  const trackRef = useRef(null)

  useEffect(() => {
    const cards = trackRef.current?.querySelectorAll('.era-card')
    if (!cards?.length) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('era-card--visible')
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    )

    cards.forEach(card => observer.observe(card))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="era-timeline" aria-label="Production era timeline">
      <div className="era-timeline-header">
        <span className="era-timeline-line" />
        <h2 className="era-timeline-title">PRODUCTION ERAS</h2>
        <span className="era-timeline-line" />
      </div>
      <p className="era-timeline-sub">14 years of Toronto hip-hop videography</p>

      <div className="era-track" ref={trackRef}>
        {ERAS.map((era, i) => (
          <article
            key={era.id}
            className="era-card"
            style={{
              '--era-color': era.color,
              '--era-delay': `${i * 120}ms`,
            }}
          >
            {/* Era accent line */}
            <div className="era-accent" aria-hidden="true" />

            {/* Top video thumbnail */}
            {era.topVideo && (
              <div className="era-thumb-wrap">
                <img
                  src={getThumbnailUrl(era.topVideo.youtubeId, 'mqdefault')}
                  alt={`${era.topVideo.artist} - ${era.topVideo.title}`}
                  className="era-thumb"
                  loading="lazy"
                  width="320"
                  height="180"
                />
                <div className="era-thumb-overlay">
                  <span className="era-thumb-label">TOP VIDEO</span>
                  <span className="era-thumb-title">{era.topVideo.title}</span>
                  <span className="era-thumb-views">{formatViews(era.topVideo.viewCount)} views</span>
                </div>
              </div>
            )}

            {/* Era info */}
            <div className="era-info">
              <span className="era-icon" aria-hidden="true">{era.icon}</span>
              <h3 className="era-label">{era.label}</h3>
              <span className="era-range">{era.range[0]}–{era.range[1]}</span>
            </div>

            {/* Stats row */}
            <div className="era-stats">
              <div className="era-stat">
                <span className="era-stat-val">{era.count}</span>
                <span className="era-stat-key">Videos</span>
              </div>
              <div className="era-stat-divider" />
              <div className="era-stat">
                <span className="era-stat-val">{era.uniqueArtists}</span>
                <span className="era-stat-key">Artists</span>
              </div>
              <div className="era-stat-divider" />
              <div className="era-stat">
                <span className="era-stat-val">{formatViews(era.totalViews)}</span>
                <span className="era-stat-key">Views</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Timeline connector */}
      <div className="era-connector" aria-hidden="true">
        {ERAS.map(era => (
          <div key={era.id} className="era-dot" style={{ '--era-color': era.color }} />
        ))}
      </div>
    </section>
  )
}
