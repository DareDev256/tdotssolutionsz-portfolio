/**
 * ImpactNumbers — Animated portfolio stats counter for the HubPage.
 *
 * Displays four key portfolio metrics (videos, artists, views, years)
 * with scroll-triggered counting animations. Each number uses easeOutExpo
 * for a cinematic "slot machine" feel. The section uses IntersectionObserver
 * to trigger only when visible, preventing wasted animation off-screen.
 *
 * All data is sourced from PORTFOLIO_STATS (pre-computed at import time).
 */
import { useRef } from 'react'
import { PORTFOLIO_STATS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import useScrollReveal from '../hooks/useScrollReveal'
import useCountUp from '../hooks/useCountUp'
import './ImpactNumbers.css'

/** Compute years active from earliest upload to now */
const yearsActive = (() => {
  if (!PORTFOLIO_STATS.earliestDate) return 0
  const start = new Date(PORTFOLIO_STATS.earliestDate).getFullYear()
  return new Date().getFullYear() - start
})()

/** Format large view counts for the counter target (raw number for animation) */
const viewMillions = Math.round(PORTFOLIO_STATS.totalViews / 100000) / 10 // e.g. 10.3

export default function ImpactNumbers() {
  const sectionRef = useRef(null)
  const isRevealed = useScrollReveal(sectionRef, 0.3)

  const videoCount = useCountUp(PORTFOLIO_STATS.totalVideos, 1800, isRevealed)
  const artistCount = useCountUp(PORTFOLIO_STATS.totalArtists, 2000, isRevealed)
  const viewCount = useCountUp(Math.round(viewMillions * 10), 2400, isRevealed)
  const yearCount = useCountUp(yearsActive, 1600, isRevealed)

  /** Format the view count with decimal for display */
  const viewDisplay = (viewCount / 10).toFixed(1)

  const stats = [
    {
      value: videoCount,
      suffix: '',
      label: 'VIDEOS',
      color: '#ff2a6d',
      delay: '0ms',
    },
    {
      value: artistCount,
      suffix: '',
      label: 'ARTISTS',
      color: '#05d9e8',
      delay: '100ms',
    },
    {
      value: viewDisplay,
      suffix: 'M+',
      label: 'TOTAL VIEWS',
      color: '#ffcc00',
      delay: '200ms',
    },
    {
      value: yearCount,
      suffix: '',
      label: 'YEARS ACTIVE',
      color: '#00ff88',
      delay: '300ms',
    },
  ]

  return (
    <section
      className={`impact-numbers ${isRevealed ? 'impact-numbers--visible' : ''}`}
      ref={sectionRef}
      aria-label="Portfolio impact statistics"
    >
      <div className="impact-numbers__track">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="impact-numbers__item"
            style={{
              '--stat-color': stat.color,
              '--reveal-delay': stat.delay,
            }}
          >
            <div className="impact-numbers__value-wrap">
              <span className="impact-numbers__value">
                {stat.value}
              </span>
              {stat.suffix && (
                <span className="impact-numbers__suffix">{stat.suffix}</span>
              )}
            </div>
            <span className="impact-numbers__label">{stat.label}</span>
            <div className="impact-numbers__bar" aria-hidden="true" />
          </div>
        ))}
      </div>
      <div className="impact-numbers__glow" aria-hidden="true" />
    </section>
  )
}
