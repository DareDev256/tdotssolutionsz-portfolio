/**
 * ProductionPulse — Interactive year-by-year production activity visualization.
 * Shows a neon bar chart of videos produced each year with hover details,
 * animated bar growth on scroll-reveal, and total views per year on hover.
 *
 * Data is derived from videos.json upload dates — zero API cost.
 */
import { useState, useEffect, useRef } from 'react'
import { VIDEOS, NEON_COLORS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import './ProductionPulse.css'

/** Aggregate videos by year with stats */
export function buildYearData() {
  const byYear = {}
  for (const v of VIDEOS) {
    const year = v.uploadDate?.slice(0, 4)
    if (!year) continue
    if (!byYear[year]) byYear[year] = { year, count: 0, views: 0, artists: new Set() }
    byYear[year].count++
    byYear[year].views += v.viewCount
    byYear[year].artists.add(v.artist)
  }
  return Object.values(byYear)
    .sort((a, b) => a.year.localeCompare(b.year))
    .map(d => ({ ...d, artistCount: d.artists.size, artists: undefined }))
}

const YEAR_DATA = buildYearData()
const MAX_COUNT = Math.max(...YEAR_DATA.map(d => d.count))

export default function ProductionPulse() {
  const [hoveredYear, setHoveredYear] = useState(null)
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const hovered = hoveredYear ? YEAR_DATA.find(d => d.year === hoveredYear) : null

  return (
    <section
      className="pulse-section"
      ref={sectionRef}
      aria-label="Production activity by year"
    >
      <h3 className="pulse-title">PRODUCTION PULSE</h3>
      <p className="pulse-subtitle">Videos produced each year</p>

      <div className="pulse-chart" role="img" aria-label={`Bar chart showing video production from ${YEAR_DATA[0]?.year} to ${YEAR_DATA.at(-1)?.year}`}>
        {YEAR_DATA.map((d, i) => {
          const heightPct = (d.count / MAX_COUNT) * 100
          const color = NEON_COLORS[i % NEON_COLORS.length]
          const isActive = hoveredYear === d.year

          return (
            <div
              key={d.year}
              className={`pulse-bar-group ${isActive ? 'pulse-bar-group--active' : ''}`}
              onMouseEnter={() => setHoveredYear(d.year)}
              onMouseLeave={() => setHoveredYear(null)}
              onFocus={() => setHoveredYear(d.year)}
              onBlur={() => setHoveredYear(null)}
              tabIndex={0}
              role="button"
              aria-label={`${d.year}: ${d.count} videos, ${formatViews(d.views)} views, ${d.artistCount} artists`}
            >
              <span
                className="pulse-count"
                style={{ opacity: isActive ? 1 : 0 }}
                aria-hidden="true"
              >
                {d.count}
              </span>
              <div
                className="pulse-bar"
                style={{
                  '--bar-height': visible ? `${heightPct}%` : '0%',
                  '--bar-color': color,
                  '--bar-delay': `${i * 80}ms`,
                }}
              />
              <span className="pulse-year" aria-hidden="true">{d.year.slice(2)}</span>
            </div>
          )
        })}
      </div>

      <div
        className={`pulse-detail ${hovered ? 'pulse-detail--visible' : ''}`}
        aria-live="polite"
      >
        {hovered && (
          <>
            <span className="pulse-detail-year">{hovered.year}</span>
            <span className="pulse-detail-stat">{hovered.count} video{hovered.count !== 1 ? 's' : ''}</span>
            <span className="pulse-detail-divider">·</span>
            <span className="pulse-detail-stat">{formatViews(hovered.views)} views</span>
            <span className="pulse-detail-divider">·</span>
            <span className="pulse-detail-stat">{hovered.artistCount} artist{hovered.artistCount !== 1 ? 's' : ''}</span>
          </>
        )}
      </div>
    </section>
  )
}
