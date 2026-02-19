/**
 * AudioVisualizer — Procedural beat-synced visualizer overlay.
 * YouTube iframes block audio access (CORS), so this generates rhythmic
 * visuals using layered sine waves. Renders frequency bars, floating
 * particles, a pulsing bass ring, and a horizontal scanner sweep on Canvas2D.
 *
 * Refactored: draw functions isolated with ctx.save/restore for composability,
 * prefers-reduced-motion support, configurable BPM, and bass ring redesigned
 * as concentric speaker-cone rings with radial tick marks.
 *
 * @param {Object} props
 * @param {boolean} props.active - Whether the visualizer is visible and animating
 * @param {string} [props.color='#05d9e8'] - Accent color for the center ring
 * @param {number} [props.bpm=128] - Beats per minute driving the animation rhythm
 */
import { useRef, useEffect, useCallback } from 'react'
import './AudioVisualizer.css'

const NEON = ['#05d9e8', '#ff2a6d', '#d300c5', '#7700ff', '#ff6b35']
const BAR_COUNT = 48
const PARTICLE_COUNT = 20
const RING_TICKS = 32
const TWO_PI = Math.PI * 2

/* ── Draw: Frequency bars (bottom) with mirrored ghost (top) ── */
function drawBars(ctx, W, H, sec, beatHz, beat) {
  ctx.save()
  const barW = W / BAR_COUNT
  const maxH = H * 0.45
  for (let i = 0; i < BAR_COUNT; i++) {
    const n = i / BAR_COUNT
    const amp = Math.min(
      (Math.sin(sec * beatHz * TWO_PI + n * 6) * 0.5 + 0.5) +
      (Math.sin(sec * beatHz * 0.5 * TWO_PI + n * 4) * 0.3 + 0.3) +
      (Math.sin(sec * 3.7 + n * 10) * 0.2 + 0.2), 1)
    const ci = Math.floor(n * (NEON.length - 1))
    const barH = amp * maxH
    const x = i * barW + 1
    const bw = barW - 2

    // Main bar
    ctx.fillStyle = NEON[ci]
    ctx.globalAlpha = 0.6 + beat * 0.3
    ctx.fillRect(x, H - barH, bw, barH)
    // Glow cap — bright top edge
    ctx.globalAlpha = 0.9
    ctx.fillRect(x, H - barH, bw, 2)
    // Mirror ghost (top)
    ctx.globalAlpha = 0.12
    ctx.fillRect(x, 0, bw, amp * maxH * 0.35)
  }
  ctx.restore()
}

/* ── Draw: Floating neon particles with soft glow halo ── */
function drawParticles(ctx, W, H, sec, beat, particles) {
  if (!particles) return
  ctx.save()
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    const sz = p.r + beat * 2
    const a = 0.4 + Math.sin(sec * 2 + p.phase) * 0.3
    // Outer glow halo
    ctx.beginPath()
    ctx.arc(p.x, p.y, sz * 3, 0, TWO_PI)
    ctx.fillStyle = p.color
    ctx.globalAlpha = a * 0.15
    ctx.fill()
    // Core dot
    ctx.beginPath()
    ctx.arc(p.x, p.y, sz, 0, TWO_PI)
    ctx.globalAlpha = a
    ctx.fill()
    // Respawn when off-screen
    if (p.y < -10 || p.x < -10 || p.x > W + 10) {
      p.x = Math.random() * W
      p.y = H + 10
      p.vy = -Math.random() * 1.2 - 0.3
    }
  }
  ctx.restore()
}

/* ── Draw: Bass ring — concentric speaker-cone rings with radial ticks ── */
function drawBassRing(ctx, W, H, beat, sec, color) {
  ctx.save()
  const cx = W / 2
  const cy = H / 2
  const baseR = 36 + beat * 28

  // Outer halo ring
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.globalAlpha = beat * 0.12
  ctx.beginPath()
  ctx.arc(cx, cy, baseR + 22, 0, TWO_PI)
  ctx.stroke()

  // Main ring
  ctx.lineWidth = 2.5
  ctx.globalAlpha = beat * 0.3
  ctx.beginPath()
  ctx.arc(cx, cy, baseR, 0, TWO_PI)
  ctx.stroke()

  // Inner ring
  ctx.lineWidth = 1
  ctx.globalAlpha = beat * 0.2
  ctx.beginPath()
  ctx.arc(cx, cy, baseR * 0.6, 0, TWO_PI)
  ctx.stroke()

  // Radial tick marks — rotating speaker cone illusion
  ctx.globalAlpha = beat * 0.18
  ctx.lineWidth = 1
  const rotation = sec * 0.4
  for (let i = 0; i < RING_TICKS; i++) {
    const angle = (i / RING_TICKS) * TWO_PI + rotation
    const inner = baseR * 0.65
    const outer = baseR - 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
    ctx.stroke()
  }
  ctx.restore()
}

/* ── Draw: Horizontal scanner sweep — VHS tracking line feel ── */
function drawScanner(ctx, W, H, sec, color) {
  ctx.save()
  const y = (sec * 40) % H
  ctx.globalAlpha = 0.06
  ctx.fillStyle = color
  ctx.fillRect(0, y, W, 2)
  // Soft glow around the line
  ctx.globalAlpha = 0.025
  ctx.fillRect(0, y - 6, W, 14)
  ctx.restore()
}

export default function AudioVisualizer({ active, color = '#05d9e8', bpm = 128 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef(null)
  const reducedMotionRef = useRef(false)

  const initParticles = useCallback((w, h) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.2 - 0.3,
      r: Math.random() * 3 + 1,
      color: NEON[Math.floor(Math.random() * NEON.length)],
      phase: Math.random() * TWO_PI,
    }))
  }, [])

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mq.matches
    const onChange = (e) => { reducedMotionRef.current = e.matches }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!active) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const beatHz = bpm / 60

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      initParticles(canvas.offsetWidth, canvas.offsetHeight)
    }
    resize()
    window.addEventListener('resize', resize)

    const render = (t) => {
      const sec = t / 1000
      const beat = Math.sin(sec * beatHz * TWO_PI) * 0.5 + 0.5
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      ctx.clearRect(0, 0, W, H)

      if (reducedMotionRef.current) {
        // Static fallback: draw bars at fixed amplitude, skip particles/scanner
        drawBars(ctx, W, H, 0, beatHz, 0.5)
        drawBassRing(ctx, W, H, 0.5, 0, color)
      } else {
        drawBars(ctx, W, H, sec, beatHz, beat)
        drawParticles(ctx, W, H, sec, beat, particlesRef.current)
        drawBassRing(ctx, W, H, beat, sec, color)
        drawScanner(ctx, W, H, sec, color)
      }

      animRef.current = requestAnimationFrame(render)
    }
    animRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [active, color, bpm, initParticles])

  if (!active) return null
  return (
    <div className="visualizer-overlay" aria-hidden="true">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  )
}
