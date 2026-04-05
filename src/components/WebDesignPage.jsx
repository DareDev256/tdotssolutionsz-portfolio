/**
 * WebDesignPage — Interactive 2D network graph visualization.
 * tdotssolutionsz.com as the center hub, client sites radiate outward
 * connected by animated lines. Click a node to expand a preview card.
 * Canvas-based for performance, overlaid with DOM cards for accessibility.
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
    status: 'live',
  },
  {
    id: 'savv4x',
    name: 'Savv4x',
    type: 'Artist Platform',
    url: 'https://savv4x.com',
    icon: '/sites/savv-icon.png',
    description: 'Personal brand site — animated particles, music videos, discography, floating now-playing bar.',
    tech: ['Next.js', 'React', 'Cloudflare'],
    status: 'live',
  },
  {
    id: 'frenchies',
    name: 'MustHaveFrenchies',
    type: 'Business Site',
    url: 'https://musthavefrenchies.com',
    icon: '/sites/frenchies-icon.png',
    description: 'Premium French Bulldog breeder — puppy listings, litter management, co-ownership program.',
    tech: ['HTML/CSS/JS', 'Vercel'],
    status: 'live',
  },
]

const HUB = {
  id: 'hub',
  name: 'tdotssolutionsz.com',
  type: 'Hub',
}

/** Calculate node positions in a circle around center */
function getNodePositions(width, height, siteCount) {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.3
  const positions = { hub: { x: cx, y: cy } }
  const angleOffset = -Math.PI / 2 // Start from top

  SITES.forEach((site, i) => {
    const angle = angleOffset + (i / siteCount) * 2 * Math.PI
    positions[site.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })
  return positions
}

/** Draw the network on canvas */
function drawNetwork(ctx, positions, width, height, activeId, time) {
  ctx.clearRect(0, 0, width, height)
  const dpr = window.devicePixelRatio || 1

  // Draw connection lines
  const hubPos = positions.hub
  SITES.forEach((site) => {
    const nodePos = positions[site.id]
    const isActive = activeId === site.id

    ctx.beginPath()
    ctx.moveTo(hubPos.x * dpr, hubPos.y * dpr)
    ctx.lineTo(nodePos.x * dpr, nodePos.y * dpr)
    ctx.strokeStyle = isActive
      ? 'rgba(74, 124, 255, 0.5)'
      : 'rgba(255, 255, 255, 0.06)'
    ctx.lineWidth = isActive ? 2 * dpr : 1 * dpr
    ctx.stroke()

    // Traveling pulse dot on active line
    if (isActive) {
      const pulse = (Math.sin(time * 0.003) + 1) / 2
      const px = hubPos.x + (nodePos.x - hubPos.x) * pulse
      const py = hubPos.y + (nodePos.y - hubPos.y) * pulse
      ctx.beginPath()
      ctx.arc(px * dpr, py * dpr, 3 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(74, 124, 255, 0.8)'
      ctx.fill()
    }
  })

  // Draw hub node
  const hubR = 8
  ctx.beginPath()
  ctx.arc(hubPos.x * dpr, hubPos.y * dpr, hubR * dpr, 0, Math.PI * 2)
  ctx.fillStyle = '#4a7cff'
  ctx.fill()

  // Hub outer ring
  ctx.beginPath()
  ctx.arc(hubPos.x * dpr, hubPos.y * dpr, (hubR + 4) * dpr, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(74, 124, 255, 0.25)'
  ctx.lineWidth = 1 * dpr
  ctx.stroke()

  // Draw site nodes
  SITES.forEach((site) => {
    const pos = positions[site.id]
    const isActive = activeId === site.id
    const r = isActive ? 7 : 5

    ctx.beginPath()
    ctx.arc(pos.x * dpr, pos.y * dpr, r * dpr, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? '#4a7cff' : 'rgba(255, 255, 255, 0.25)'
    ctx.fill()

    if (isActive) {
      ctx.beginPath()
      ctx.arc(pos.x * dpr, pos.y * dpr, (r + 4) * dpr, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(74, 124, 255, 0.3)'
      ctx.lineWidth = 1 * dpr
      ctx.stroke()
    }
  })
}

export default function WebDesignPage() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [activeId, setActiveId] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const animRef = useRef(null)

  const positions = useMemo(
    () => getNodePositions(dimensions.width, dimensions.height, SITES.length),
    [dimensions]
  )

  // Resize handler
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`

    function animate(time) {
      drawNetwork(ctx, positions, dimensions.width, dimensions.height, activeId, time)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [positions, dimensions, activeId])

  // Handle click on canvas to detect node hits
  const handleCanvasClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const hitRadius = 24

    for (const site of SITES) {
      const pos = positions[site.id]
      const dist = Math.hypot(x - pos.x, y - pos.y)
      if (dist < hitRadius) {
        setActiveId(prev => prev === site.id ? null : site.id)
        return
      }
    }
    // Click on empty space closes card
    setActiveId(null)
  }, [positions])

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
          <p className="webdesign-page__sub">Network of sites built & managed by TdotsSolutionsz</p>
        </div>
      </div>

      <div className="webdesign-page__network" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="webdesign-page__canvas"
          onClick={handleCanvasClick}
          aria-label="Interactive network graph of web design projects"
        />

        {/* DOM labels for each node — positioned absolutely over canvas */}
        <div
          className="webdesign-page__hub-label"
          style={{ left: positions.hub.x, top: positions.hub.y }}
        >
          tdotssolutionsz.com
        </div>

        {SITES.map((site) => {
          const pos = positions[site.id]
          return (
            <button
              key={site.id}
              className={`webdesign-page__node-label ${activeId === site.id ? 'webdesign-page__node-label--active' : ''}`}
              style={{ left: pos.x, top: pos.y }}
              onClick={() => setActiveId(prev => prev === site.id ? null : site.id)}
              aria-label={`${site.name} — ${site.type}`}
            >
              {site.icon && (
                <img src={site.icon} alt="" className="webdesign-page__node-icon" />
              )}
              <span className="webdesign-page__node-name">{site.name}</span>
            </button>
          )
        })}
      </div>

      {/* Expanded preview card */}
      {activeSite && (
        <div className="webdesign-page__card" key={activeSite.id}>
          <div className="webdesign-page__card-header">
            {activeSite.icon && (
              <img src={activeSite.icon} alt="" className="webdesign-page__card-icon" />
            )}
            <div>
              <h2 className="webdesign-page__card-name">{activeSite.name}</h2>
              <span className="webdesign-page__card-type">{activeSite.type}</span>
            </div>
            <span className="webdesign-page__card-status">LIVE</span>
          </div>

          <p className="webdesign-page__card-desc">{activeSite.description}</p>

          <div className="webdesign-page__card-tech">
            {activeSite.tech.map(t => (
              <span key={t} className="webdesign-page__card-tag">{t}</span>
            ))}
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

      {/* Mobile site list — shown below graph on small screens */}
      <div className="webdesign-page__list">
        {SITES.map((site) => (
          <a
            key={site.id}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="webdesign-page__list-item"
          >
            {site.icon && (
              <img src={site.icon} alt="" className="webdesign-page__list-icon" />
            )}
            <div className="webdesign-page__list-info">
              <span className="webdesign-page__list-name">{site.name}</span>
              <span className="webdesign-page__list-type">{site.type}</span>
            </div>
            <span className="webdesign-page__list-status">LIVE</span>
          </a>
        ))}
      </div>
    </div>
  )
}
