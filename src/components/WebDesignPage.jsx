/**
 * WebDesignPage — Living particle network visualization.
 * A breathing mesh of floating particles with tdotssolutionsz.com
 * as the gravitational center. Client sites are bright anchor nodes
 * connected by organic curved paths. Particles drift and connect
 * to nearby neighbors, creating a living world wide web.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import './WebDesignPage.css'

const SITES = [
  {
    id: 'syreneffect',
    name: 'SyrenEffect',
    type: 'Creator Site',
    url: 'https://syreneffect-site.vercel.app',
    icon: '/sites/syren-icon.png',
    description: 'Custom site for Twitch streamer — dark aesthetic, live integration, brand identity.',
    tech: ['Next.js', 'React', 'Vercel'],
  },
  {
    id: 'savv4x',
    name: 'Savv4x',
    type: 'Artist Platform',
    url: 'https://savv4x.com',
    icon: '/sites/savv-icon.png',
    description: 'Personal brand site — animated particles, music videos, discography, floating now-playing bar.',
    tech: ['Next.js', 'React', 'Cloudflare'],
  },
  {
    id: 'frenchies',
    name: 'MustHaveFrenchies',
    type: 'Business Site',
    url: 'https://musthavefrenchies.com',
    icon: '/sites/frenchies-icon.png',
    description: 'Premium French Bulldog breeder — puppy listings, litter management, co-ownership program.',
    tech: ['HTML/CSS/JS', 'Vercel'],
  },
]

/** Create floating background particles */
function createParticles(count, width, height) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.3 + 0.05,
  }))
}

/** Get anchor positions for site nodes */
function getAnchors(width, height) {
  const cx = width / 2
  const cy = height / 2
  const rx = Math.min(width * 0.32, 280)
  const ry = Math.min(height * 0.3, 220)
  const offset = -Math.PI / 2

  const anchors = {
    hub: { x: cx, y: cy },
  }
  SITES.forEach((site, i) => {
    const angle = offset + (i / SITES.length) * Math.PI * 2
    anchors[site.id] = {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    }
  })
  return anchors
}

export default function WebDesignPage() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [activeId, setActiveId] = useState(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const particlesRef = useRef([])
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animRef = useRef(null)

  const anchors = useMemo(() => getAnchors(dims.w, dims.h), [dims])

  // Resize
  useEffect(() => {
    function onResize() {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      setDims({ w: r.width, h: r.height })
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Init particles when dimensions change
  useEffect(() => {
    const isMobile = dims.w < 600
    particlesRef.current = createParticles(isMobile ? 50 : 120, dims.w, dims.h)
  }, [dims])

  // Mouse tracking
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 }
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = dims.w * dpr
    canvas.height = dims.h * dpr
    canvas.style.width = `${dims.w}px`
    canvas.style.height = `${dims.h}px`
    ctx.scale(dpr, dpr)

    const CONNECTION_DIST = 100
    const MOUSE_DIST = 150

    function frame(time) {
      ctx.clearRect(0, 0, dims.w, dims.h)
      const particles = particlesRef.current
      const mouse = mouseRef.current

      // Update particles
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        // Wrap around edges
        if (p.x < 0) p.x = dims.w
        if (p.x > dims.w) p.x = 0
        if (p.y < 0) p.y = dims.h
        if (p.y > dims.h) p.y = 0

        // Subtle mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const md = Math.hypot(dx, dy)
        if (md < MOUSE_DIST && md > 0) {
          const force = (1 - md / MOUSE_DIST) * 0.5
          p.vx += (dx / md) * force
          p.vy += (dy / md) * force
        }

        // Dampen velocity
        p.vx *= 0.99
        p.vy *= 0.99
      }

      // Draw particle-to-particle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.08
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
        ctx.fill()
      }

      // Draw curved connections from hub to each site
      const hubPos = anchors.hub
      for (const site of SITES) {
        const nodePos = anchors[site.id]
        const isActive = activeId === site.id
        const midX = (hubPos.x + nodePos.x) / 2
        const midY = (hubPos.y + nodePos.y) / 2 - 30

        ctx.beginPath()
        ctx.moveTo(hubPos.x, hubPos.y)
        ctx.quadraticCurveTo(midX, midY, nodePos.x, nodePos.y)
        ctx.strokeStyle = isActive
          ? 'rgba(74, 124, 255, 0.4)'
          : 'rgba(74, 124, 255, 0.08)'
        ctx.lineWidth = isActive ? 1.5 : 0.8
        ctx.stroke()

        // Traveling pulse on active connection
        if (isActive) {
          const t = (Math.sin(time * 0.002) + 1) / 2
          const invT = 1 - t
          const px = invT * invT * hubPos.x + 2 * invT * t * midX + t * t * nodePos.x
          const py = invT * invT * hubPos.y + 2 * invT * t * midY + t * t * nodePos.y
          ctx.beginPath()
          ctx.arc(px, py, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(74, 124, 255, 0.9)'
          ctx.fill()
        }
      }

      // Draw hub node with pulse ring
      const hubPulse = Math.sin(time * 0.002) * 0.3 + 0.7
      ctx.beginPath()
      ctx.arc(hubPos.x, hubPos.y, 18, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(74, 124, 255, ${hubPulse * 0.15})`
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(hubPos.x, hubPos.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = '#4a7cff'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(hubPos.x, hubPos.y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()

      // Draw site nodes
      for (const site of SITES) {
        const pos = anchors[site.id]
        const isActive = activeId === site.id
        const r = isActive ? 8 : 5

        if (isActive) {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(74, 124, 255, 0.2)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
        ctx.fillStyle = isActive ? '#4a7cff' : 'rgba(255, 255, 255, 0.4)'
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(animRef.current)
  }, [dims, anchors, activeId])

  // Click handler
  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check hub
    const hubDist = Math.hypot(x - anchors.hub.x, y - anchors.hub.y)
    if (hubDist < 20) {
      setActiveId(null)
      return
    }

    for (const site of SITES) {
      const pos = anchors[site.id]
      if (Math.hypot(x - pos.x, y - pos.y) < 28) {
        setActiveId(prev => prev === site.id ? null : site.id)
        return
      }
    }
    setActiveId(null)
  }, [anchors])

  const activeSite = SITES.find(s => s.id === activeId)

  return (
    <div className="webdesign-page">
      <div className="webdesign-page__header">
        <Link to="/" className="webdesign-page__back" aria-label="Back to hub">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <div>
          <h1 className="webdesign-page__title">Web Design</h1>
          <p className="webdesign-page__sub">The network — sites built & managed by TdotsSolutionsz</p>
        </div>
      </div>

      <div
        className="webdesign-page__network"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          className="webdesign-page__canvas"
          onClick={handleClick}
        />

        {/* Hub label */}
        <div
          className="webdesign-page__hub-label"
          style={{ left: anchors.hub.x, top: anchors.hub.y }}
        >
          tdotssolutionsz.com
        </div>

        {/* Site node labels */}
        {SITES.map((site) => {
          const pos = anchors[site.id]
          return (
            <button
              key={site.id}
              className={`webdesign-page__node-label ${activeId === site.id ? 'webdesign-page__node-label--active' : ''}`}
              style={{ left: pos.x, top: pos.y }}
              onClick={() => setActiveId(prev => prev === site.id ? null : site.id)}
            >
              {site.icon && <img src={site.icon} alt="" className="webdesign-page__node-icon" />}
              <span>{site.name}</span>
            </button>
          )
        })}
      </div>

      {/* Preview card */}
      {activeSite && (
        <div className="webdesign-page__card" key={activeSite.id}>
          <div className="webdesign-page__card-header">
            {activeSite.icon && <img src={activeSite.icon} alt="" className="webdesign-page__card-icon" />}
            <div>
              <h2 className="webdesign-page__card-name">{activeSite.name}</h2>
              <span className="webdesign-page__card-type">{activeSite.type}</span>
            </div>
            <span className="webdesign-page__card-status">LIVE</span>
          </div>
          <p className="webdesign-page__card-desc">{activeSite.description}</p>
          <div className="webdesign-page__card-tech">
            {activeSite.tech.map(t => <span key={t} className="webdesign-page__card-tag">{t}</span>)}
          </div>
          <div className="webdesign-page__card-preview">
            <iframe
              src={activeSite.url}
              title={`${activeSite.name} preview`}
              className="webdesign-page__card-iframe"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
          <a
            href={activeSite.url}
            target="_blank"
            rel="noopener noreferrer"
            className="webdesign-page__card-cta"
          >
            VISIT SITE
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
          </a>
        </div>
      )}

      {/* Mobile site list */}
      <div className="webdesign-page__list">
        {SITES.map((site) => (
          <button
            key={site.id}
            className={`webdesign-page__list-item ${activeId === site.id ? 'webdesign-page__list-item--active' : ''}`}
            onClick={() => setActiveId(prev => prev === site.id ? null : site.id)}
          >
            {site.icon && <img src={site.icon} alt="" className="webdesign-page__list-icon" />}
            <div className="webdesign-page__list-info">
              <span className="webdesign-page__list-name">{site.name}</span>
              <span className="webdesign-page__list-type">{site.type}</span>
            </div>
            <span className="webdesign-page__list-badge">LIVE</span>
          </button>
        ))}
      </div>
    </div>
  )
}
