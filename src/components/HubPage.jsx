import { Link } from 'react-router-dom'
import './HubPage.css'

const CATEGORIES = [
  {
    title: 'Music Videos',
    subtitle: '87 VIDEOS — 49 ARTISTS',
    description: 'Immersive 3D experience showcasing a decade of Toronto hip-hop videography',
    path: '/videos',
    icon: '🎬',
    accent: 'pink',
  },
  {
    title: 'Photography',
    subtitle: '25 PHOTOS — 5 CATEGORIES',
    description: 'Portraits, events, artist EPKs, and urban street photography',
    path: '/photos',
    icon: '📸',
    accent: 'cyan',
  },
]

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
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.path}
            to={cat.path}
            className={`hub-card hub-card--${cat.accent}`}
            aria-label={`View ${cat.title} portfolio`}
          >
            <span className="hub-card-icon">{cat.icon}</span>
            <h2 className="hub-card-title">{cat.title}</h2>
            <span className="hub-card-subtitle">{cat.subtitle}</span>
            <p className="hub-card-desc">{cat.description}</p>
            <span className="hub-card-cta">
              ENTER <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </nav>

      <footer className="hub-footer">
        <span className="hub-footer-brand">TDOTSSOLUTIONSZ</span>
        <span className="hub-footer-loc">TORONTO, CANADA</span>
      </footer>
    </div>
  )
}
