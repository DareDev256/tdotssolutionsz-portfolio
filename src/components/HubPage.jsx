import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImpactNumbers from './ImpactNumbers'
import LatestDrops from './LatestDrops'
import SpotlightHero from './SpotlightHero'
import WebDesignShowcase from './WebDesignShowcase'
import Icon from './ui/Icon'
import { PORTFOLIO_STATS } from '../utils/videoData'
import './HubPage.css'

export default function HubPage() {
  const [showToast, setShowToast] = useState(false)
  const [introPhase, setIntroPhase] = useState('hold') // hold → shrink → done

  useEffect(() => {
    // Hold the centered logo for a beat
    const holdTimer = setTimeout(() => setIntroPhase('shrink'), 900)
    // Remove intro overlay after animation completes
    const doneTimer = setTimeout(() => setIntroPhase('done'), 2400)
    return () => { clearTimeout(holdTimer); clearTimeout(doneTimer) }
  }, [])

  function handleLockedClick(e) {
    e.preventDefault()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  return (
    <div className="hub-page">
      {/* Intro overlay — logo + staggered letter reveal */}
      {introPhase !== 'done' && (
        <div className={`hub-intro ${introPhase === 'shrink' ? 'hub-intro--shrink' : ''}`} aria-hidden="true">
          <div className="hub-intro__content">
            <img
              src="/logo.png"
              alt=""
              className="hub-intro__logo"
              width="200"
              height="200"
            />
            <div className="hub-intro__line" />
            <span className="hub-intro__letters">
              {'TDOTSSOLUTIONSZ'.split('').map((char, i) => (
                <span
                  key={i}
                  className="hub-intro__letter"
                  style={{ '--letter-index': i }}
                >
                  {char}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      <div className="hub-grain" aria-hidden="true" />

      <header className="hub-header">
        <img
          src="/logo.png"
          alt="TdotsSolutionsz Logo"
          className="hub-logo"
          width="200"
          height="200"
        />
        <h1 className="hub-title">
          <span className="hub-title-top">TDOTS</span>
          <span className="hub-title-bottom">SOLUTIONSZ</span>
        </h1>
        <div className="hub-header-line" />
        <p className="hub-tagline">TORONTO — CREATIVE PRODUCTION</p>
      </header>

      <SpotlightHero />
      <LatestDrops />
      <ImpactNumbers />

      <nav className="hub-cards" aria-label="Portfolio sections">
        <Link
          to="/videos"
          className="hub-card"
          aria-label="View Music Videos portfolio"
        >
          <span className="hub-card-icon"><Icon name="film" size={24} /></span>
          <h2 className="hub-card-title">Music Videos</h2>
          <span className="hub-card-subtitle">{PORTFOLIO_STATS.totalVideos} VIDEOS — {PORTFOLIO_STATS.totalArtists} ARTISTS</span>
          <p className="hub-card-desc">A decade of Toronto hip-hop videography — immersive 3D viewing experience</p>
          <span className="hub-card-cta">
            ENTER <span aria-hidden="true">→</span>
          </span>
        </Link>

        <Link
          to="/web-design"
          className="hub-card"
          aria-label="View Web Design portfolio"
        >
          <span className="hub-card-icon"><Icon name="camera" size={24} /></span>
          <h2 className="hub-card-title">Web Design</h2>
          <span className="hub-card-subtitle">SITES & DIGITAL</span>
          <p className="hub-card-desc">Custom websites for artists, brands, and creative projects</p>
          <span className="hub-card-cta">
            VIEW WORK <span aria-hidden="true">→</span>
          </span>
        </Link>

        {/* Photography — intentionally locked/coming soon */}
        <button
          className="hub-card hub-card--locked"
          onClick={handleLockedClick}
          aria-label="Photography — Coming Soon"
          type="button"
        >
          <span className="hub-card-icon"><Icon name="camera" size={24} /></span>
          <h2 className="hub-card-title">Photography</h2>
          <span className="hub-card-subtitle">COMING SOON</span>
          <p className="hub-card-desc">Portraits, events, artist EPKs, and urban street photography</p>
          <span className="hub-card-cta hub-card-cta--locked">
            COMING SOON
          </span>
        </button>
      </nav>

      <WebDesignShowcase />

      {showToast && (
        <div className="hub-toast" role="status" aria-live="polite">
          COMING SOON
        </div>
      )}

      <footer className="hub-footer">
        <div className="hub-footer-rule" aria-hidden="true" />
        <span className="hub-footer-brand">TDOTSSOLUTIONSZ</span>
        <div className="hub-footer-links">
          <a href="https://www.youtube.com/@Tdotssolutionsz" target="_blank" rel="noopener noreferrer" className="hub-footer-link">YouTube</a>
          <a href="https://www.instagram.com/tdotssolutionsz" target="_blank" rel="noopener noreferrer" className="hub-footer-link">Instagram</a>
          <a href="https://x.com/tdotssolutionsz" target="_blank" rel="noopener noreferrer" className="hub-footer-link">X</a>
          <a href="mailto:tdotssolutionsz@gmail.com" className="hub-footer-link hub-footer-link--cta">Book a Session</a>
        </div>
        <span className="hub-footer-loc">TORONTO, CANADA</span>
      </footer>
    </div>
  )
}
