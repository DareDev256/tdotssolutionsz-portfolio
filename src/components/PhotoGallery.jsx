import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import photos from '../data/photos.json'
import useBodyScrollLock from '../hooks/useBodyScrollLock'
import './PhotoGallery.css'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'portraits', label: 'Portraits' },
  { key: 'artist', label: 'Artist' },
  { key: 'events', label: 'Events' },
  { key: 'street', label: 'Street' },
]

const CATEGORY_DIRS = {
  portraits: 'portraits',
  artist: 'artist',
  events: 'events',
  street: 'street',
}

function getPhotoSrc(photo) {
  return `/photos/${CATEGORY_DIRS[photo.category]}/${photo.filename}`
}

/** Lazy-loaded image that fades in when it enters the viewport */
function LazyImage({ src, alt, onClick }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`gallery-img-wrap ${loaded ? 'loaded' : ''}`} onClick={onClick}>
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="gallery-img"
        />
      )}
    </div>
  )
}

/** Lightbox modal for full-size photo viewing */
function Lightbox({ photo, onClose, onPrev, onNext }) {
  useBodyScrollLock(true)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext])

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label={photo.title}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>
        <button className="lightbox-nav lightbox-prev" onClick={onPrev} aria-label="Previous photo">‹</button>
        <img
          src={getPhotoSrc(photo)}
          alt={photo.title}
          className="lightbox-img"
        />
        <button className="lightbox-nav lightbox-next" onClick={onNext} aria-label="Next photo">›</button>
        <div className="lightbox-info">
          <h3 className="lightbox-title">{photo.title}</h3>
          <p className="lightbox-desc">{photo.description}</p>
          <span className="lightbox-meta">{photo.subject} — {photo.camera}</span>
        </div>
      </div>
    </div>
  )
}

export default function PhotoGallery() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const filtered = activeCategory === 'all'
    ? photos
    : photos.filter((p) => p.category === activeCategory)

  const openLightbox = useCallback((idx) => setLightboxIndex(idx), [])
  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i > 0 ? i - 1 : filtered.length - 1))
  }, [filtered.length])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i < filtered.length - 1 ? i + 1 : 0))
  }, [filtered.length])

  return (
    <div className="photo-gallery">
      <div className="gallery-bg-grid" aria-hidden="true" />
      <div className="gallery-bg-glow" aria-hidden="true" />

      <header className="gallery-header">
        <Link to="/" className="gallery-back" aria-label="Back to hub">
          ← BACK
        </Link>
        <div className="gallery-header-text">
          <img src="/logo.png" alt="" className="gallery-logo" width="60" height="60" />
          <h1 className="gallery-title">PHOTOGRAPHY</h1>
          <p className="gallery-subtitle">{photos.length} PHOTOS — TORONTO CREATIVE PRODUCTION</p>
        </div>
      </header>

      <nav className="gallery-tabs" aria-label="Photo categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`gallery-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
            aria-pressed={activeCategory === cat.key}
          >
            {cat.label}
            <span className="gallery-tab-count">
              {cat.key === 'all'
                ? photos.length
                : photos.filter((p) => p.category === cat.key).length}
            </span>
          </button>
        ))}
      </nav>

      <div className="gallery-grid">
        {filtered.map((photo, idx) => (
          <LazyImage
            key={photo.id}
            src={getPhotoSrc(photo)}
            alt={photo.title}
            onClick={() => openLightbox(idx)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="gallery-empty">No photos in this category yet.</p>
      )}

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <Lightbox
          photo={filtered[lightboxIndex]}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}

      <footer className="gallery-footer">
        <span className="gallery-footer-brand">TDOTSSOLUTIONSZ</span>
        <span className="gallery-footer-loc">TORONTO, CANADA</span>
      </footer>
    </div>
  )
}
