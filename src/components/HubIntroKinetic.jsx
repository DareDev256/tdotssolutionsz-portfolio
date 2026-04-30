/**
 * HubIntroKinetic — cinematic 5-second intro overlay.
 *
 * Layered composite (no AI video, no Seedance — pixel-perfect logo, painterly motion):
 *   1. Drifting charcoal dust canvas    (ambient, full viewport)
 *   2. Cobalt hairline draw L→R         (1.4s draw, behind logo)
 *   3. Real /logo.png bloom-in           (blur → focus, 24fps micro-jitter)
 *   4. Warm-orange spark burst           (single accent, 600ms)
 *   5. Radial vignette breathe           (settles into hold)
 *   6. Crossfade out                     (reveals real .hub-header below)
 *
 * Plays once per session (sessionStorage). Honors prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react'
import './HubIntroKinetic.css'

const SESSION_KEY = 'tdots:intro-played-v1'
const TOTAL_MS = 5000

export default function HubIntroKinetic({ onComplete }) {
  const dustRef = useRef(null)
  const sparkRef = useRef(null)
  const dustRafRef = useRef(null)
  const sparkRafRef = useRef(null)
  const [phase, setPhase] = useState('init') // init → reveal → spark → hold → done
  const [skip, setSkip] = useState(false)

  // Phase scheduler + sessionStorage gate + reduced-motion gate
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (sessionStorage.getItem(SESSION_KEY)) {
      setSkip(true)
      onComplete?.()
      return
    }

    // Mark as played only on completion — not on start.
    // This is StrictMode-safe: dev double-mount cleanup cancels timers,
    // so the sessionStorage write never lands until the intro finishes.
    const markPlayed = () => sessionStorage.setItem(SESSION_KEY, '1')

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setPhase('hold')
      const t = setTimeout(() => {
        markPlayed()
        setPhase('done')
        onComplete?.()
      }, 900)
      return () => clearTimeout(t)
    }

    const timers = [
      setTimeout(() => setPhase('reveal'), 400),
      setTimeout(() => setPhase('spark'), 2400),
      setTimeout(() => setPhase('hold'), 3000),
      setTimeout(() => setPhase('done'), TOTAL_MS),
      setTimeout(() => {
        markPlayed()
        onComplete?.()
      }, TOTAL_MS + 50),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  // Dust particle field — runs entire intro
  useEffect(() => {
    if (skip) return
    const canvas = dustRef.current
    if (!canvas) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = canvas.getContext('2d', { alpha: true })
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }
    resize()

    const W = () => window.innerWidth
    const H = () => window.innerHeight

    const PARTICLE_COUNT = window.innerWidth < 768 ? 110 : 220
    const particles = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W(),
        y: Math.random() * H(),
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.04 - Math.random() * 0.18, // ash rises
        r: 0.4 + Math.random() * 1.6,
        a: 0.04 + Math.random() * 0.22,
      })
    }

    const tick = () => {
      ctx.clearRect(0, 0, W(), H())
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -10) { p.y = H() + 10; p.x = Math.random() * W() }
        if (p.x < -10) p.x = W() + 10
        if (p.x > W() + 10) p.x = -10

        ctx.fillStyle = `rgba(220, 220, 220, ${p.a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      dustRafRef.current = requestAnimationFrame(tick)
    }
    dustRafRef.current = requestAnimationFrame(tick)

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (dustRafRef.current) cancelAnimationFrame(dustRafRef.current)
    }
  }, [skip])

  // Orange spark burst — fires when phase enters 'spark'
  useEffect(() => {
    if (phase !== 'spark') return
    const canvas = sparkRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = 320
    const h = 160
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    const sparks = []
    const COUNT = 22
    for (let i = 0; i < COUNT; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6
      const speed = 1 + Math.random() * 3.2
      sparks.push({
        x: w / 2,
        y: h * 0.7,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 0.6 + Math.random() * 1.4,
        life: 1,
        decay: 0.014 + Math.random() * 0.018,
      })
    }

    const start = performance.now()
    const tick = (now) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, w, h)
      let alive = 0
      for (const s of sparks) {
        if (s.life <= 0) continue
        alive++
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.06 // gravity
        s.life -= s.decay

        ctx.fillStyle = `rgba(232, 93, 52, ${Math.max(0, s.life)})`
        ctx.shadowColor = '#e85d34'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      if (alive > 0 && t < 1.4) {
        sparkRafRef.current = requestAnimationFrame(tick)
      }
    }
    sparkRafRef.current = requestAnimationFrame(tick)

    return () => {
      if (sparkRafRef.current) cancelAnimationFrame(sparkRafRef.current)
    }
  }, [phase])

  if (skip || phase === 'done') return null

  return (
    <div
      className={`hub-intro-kinetic hub-intro-kinetic--${phase}`}
      aria-hidden="true"
    >
      <canvas ref={dustRef} className="hub-intro-kinetic__dust" />

      <div className="hub-intro-kinetic__stage">
        <div className="hub-intro-kinetic__line" />
        <div className="hub-intro-kinetic__logo-wrap">
          <img
            src="/logo.png"
            alt=""
            className="hub-intro-kinetic__logo"
            width="240"
            height="240"
            decoding="async"
            fetchpriority="high"
          />
          <canvas ref={sparkRef} className="hub-intro-kinetic__spark" />
        </div>
        <div className="hub-intro-kinetic__caption">
          <span>TORONTO</span>
          <span className="hub-intro-kinetic__caption-dot">·</span>
          <span>CREATIVE PRODUCTION</span>
        </div>
      </div>

      <div className="hub-intro-kinetic__vignette" />
      <div className="hub-intro-kinetic__grain" />
    </div>
  )
}
