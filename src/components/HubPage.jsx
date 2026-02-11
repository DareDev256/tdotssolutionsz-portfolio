import { Link } from 'react-router-dom'
import './HubPage.css'

export default function HubPage() {
  return (
    <div className="hub-page">
      <div className="hub-bg-grid" aria-hidden="true" />
      <div className="hub-bg-glow" aria-hidden="true" />

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

      <nav className="hub-cards" aria-label="Portfolio sections">
        <Link
          to="/videos"
          className="hub-card hub-card--pink"
          aria-label="View Music Videos portfolio"
        >
          <span className="hub-card-icon">🎬</span>
          <h2 className="hub-card-title">Music Videos</h2>
          <span className="hub-card-subtitle">87 VIDEOS — 49 ARTISTS</span>
          <p className="hub-card-desc">Immersive 3D experience showcasing a decade of Toronto hip-hop videography</p>
          <span className="hub-card-cta">
            ENTER <span aria-hidden="true">→</span>
          </span>
        </Link>

        <Link
          to="/photos"
          className="hub-card hub-card--cyan"
          aria-label="View Photography portfolio"
        >
          <span className="hub-card-icon">📸</span>
          <h2 className="hub-card-title">Photography</h2>
          <span className="hub-card-subtitle">25 PHOTOS — 4 CATEGORIES</span>
          <p className="hub-card-desc">Portraits, events, artist EPKs, and urban street photography</p>
          <span className="hub-card-cta">
            ENTER <span aria-hidden="true">→</span>
          </span>
        </Link>
      </nav>

      <footer className="hub-footer">
        <span className="hub-footer-brand">TDOTSSOLUTIONSZ</span>
        <span className="hub-footer-loc">TORONTO, CANADA</span>
      </footer>
    </div>
  )
}
