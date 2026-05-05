import { useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { VIDEOS, PORTFOLIO_STATS } from '../utils/videoData'
import { topByViews } from '../utils/videoFilters'
import { getThumbnailUrl } from '../utils/youtube'
import { formatViews } from '../utils/formatters'
import './HubPageCinema.css'

gsap.registerPlugin(ScrollTrigger)

const FEATURED = topByViews(VIDEOS, 8)

const WEB_PROJECTS = [
  { name: 'Savv4x', type: 'Artist Platform', url: 'https://savv4x.com', preview: '/sites/savv-preview.jpg', icon: '/sites/savv-icon.png' },
  { name: 'SyrenEffect', type: 'Creator Site', url: 'https://syreneffect.com', preview: '/sites/syren-preview.jpg', icon: '/sites/syren-icon.png' },
]

function splitIntoLetters(text) {
  return text.split('').map((char, i) => (
    <span key={i} className="cinema-letter" style={{ animationDelay: `${i * 0.03}s` }}>
      {char === ' ' ? ' ' : char}
    </span>
  ))
}

// Pre-bake one sprite per tint color: the inverted logo + a soft glow halo
// already composited in. Per-particle render then becomes a single drawImage
// — no shadowBlur, no source-atop composite, no per-frame canvas state changes.
function bakeLogoSprite(logoImg, glowColor) {
  const SIZE = 128             // canvas (extra room for glow halo)
  const LOGO = 88              // inverted-logo size centered inside
  const off = document.createElement('canvas')
  off.width = SIZE; off.height = SIZE
  const ctx = off.getContext('2d')
  const cx = SIZE / 2, cy = SIZE / 2

  // Glow halo — radial gradient (much cheaper than runtime shadowBlur).
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, SIZE / 2)
  grad.addColorStop(0, glowColor)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, SIZE, SIZE)

  // White-inverted logo on top.
  ctx.filter = 'invert(1) brightness(1.4)'
  ctx.drawImage(logoImg, cx - LOGO / 2, cy - LOGO / 2, LOGO, LOGO)
  ctx.filter = 'none'
  return off
}

function ParticleCanvas() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const activeRef = useRef(false)
  const spritesRef = useRef(null)        // { white, blue, orange }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const logo = new Image()
    logo.src = '/logo.png'
    logo.onload = () => {
      spritesRef.current = {
        white:  bakeLogoSprite(logo, 'rgba(255,255,255,0.55)'),
        blue:   bakeLogoSprite(logo, 'rgba(74,124,255,0.7)'),
        orange: bakeLogoSprite(logo, 'rgba(232,93,52,0.75)'),
      }
    }

    // Cap particle count on phones — same visual energy with less GPU overhead.
    const mobileScale = window.matchMedia('(max-width: 768px)').matches ? 0.55 : 1

    window.__spawnParticles = (cx, cy, count, tag) => {
      const n = Math.max(1, Math.round(count * mobileScale))
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2.5 + Math.random() * 7
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, decay: 0.006 + Math.random() * 0.012,
          size: 22 + Math.random() * 26,
          rotation: Math.random() * Math.PI * 2,
          rotVel: (Math.random() - 0.5) * 0.25,
          variant: tag || 'white',
        })
      }
      if (!activeRef.current) { activeRef.current = true; requestAnimationFrame(animate) }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      const sprites = spritesRef.current

      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.vx *= 0.995
        p.rotation += p.rotVel
        p.life -= p.decay

        ctx.globalAlpha = p.life < 1 ? Math.max(0, p.life) : 1
        ctx.setTransform(1, 0, 0, 1, p.x, p.y)
        ctx.rotate(p.rotation)

        if (sprites) {
          const sprite = sprites[p.variant] || sprites.white
          ctx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size)
        } else {
          // Sprite still loading — minimal fallback
          ctx.fillStyle = '#fff'
          ctx.fillRect(-2, -2, 4, 4)
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1

      if (particlesRef.current.length > 0) requestAnimationFrame(animate)
      else activeRef.current = false
    }

    return () => { window.removeEventListener('resize', resize); delete window.__spawnParticles }
  }, [])

  return <canvas ref={canvasRef} className="cinema-particles" />
}

export default function HubPageCinema() {
  const wrapperRef = useRef(null)
  const viewportRef = useRef(null)
  const videoRefs = useRef({})
  const sessionPlayed = useRef(false)

  const setVideoRef = useCallback((id) => (el) => { videoRefs.current[id] = el }, [])

  useEffect(() => {
    const track = document.querySelector('.cinema-track')
    if (!track) return

    const st = (start, end, scrub = 1) => ({
      trigger: track, start: `${start}% top`, end: `${end}% top`, scrub
    })

    // === SCENE 1: Hero (0-14%) ===
    const heroTL = gsap.timeline({ scrollTrigger: st(0, 6) })
    heroTL
      .to('.cinema-hero-label', { opacity: 1, duration: 0.3 })
      .fromTo('.cinema-hero-title .cinema-line-1 .cinema-letter',
        { y: 80, opacity: 0, rotateX: -90 },
        { y: 0, opacity: 1, rotateX: 0, stagger: 0.05, duration: 0.3, ease: 'back.out(1.4)' }, 0.1)
      .fromTo('.cinema-hero-title .cinema-line-2 .cinema-letter',
        { y: 80, opacity: 0, rotateX: -90 },
        { y: 0, opacity: 1, rotateX: 0, stagger: 0.05, duration: 0.3, ease: 'back.out(1.4)' }, 0.25)
      .to('.cinema-hero-sub', { opacity: 1, duration: 0.2 }, 0.5)
      .to('.cinema-hero-stats', { opacity: 1, y: 0, duration: 0.2 }, 0.6)

    gsap.to('.cinema-scroll-cue', { opacity: 0, scrollTrigger: st(2, 4, 0.5) })

    // Scatter 1: Hero → Scene 2 (10-16%)
    const scatter1 = gsap.timeline({
      scrollTrigger: {
        ...st(10, 16),
        onUpdate: (self) => {
          if (self.progress > 0.75 && self.progress < 0.85 && window.__spawnParticles)
            window.__spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 18)
        }
      }
    })
    scatter1.to('.cinema-hero-title .cinema-line-1 .cinema-letter', {
      x: () => (Math.random() - 0.5) * window.innerWidth * 1.5,
      y: () => (Math.random() - 0.5) * window.innerHeight * 1.5,
      rotation: () => (Math.random() - 0.5) * 720,
      scale: () => 0.1 + Math.random() * 2, opacity: 0, stagger: 0.02, duration: 1, ease: 'power3.in',
    }, 0)
    scatter1.to('.cinema-hero-title .cinema-line-2 .cinema-letter', {
      x: () => (Math.random() - 0.5) * window.innerWidth * 1.5,
      y: () => (Math.random() - 0.5) * window.innerHeight * 1.5,
      rotation: () => (Math.random() - 0.5) * 720,
      scale: () => 0.1 + Math.random() * 2, opacity: 0, stagger: 0.02, duration: 1, ease: 'power3.in',
    }, 0.1)
    scatter1.to('.cinema-hero-label, .cinema-hero-sub, .cinema-hero-stats', { y: -200, opacity: 0, scale: 0.5, duration: 0.5 }, 0)
    scatter1.to('#cinema-scene1', { opacity: 0, duration: 0.3 }, 0.6)
    scatter1.to('#cinema-scene2', { opacity: 1, duration: 0.3 }, 0.6)
    scatter1.to('.cinema-flash', { opacity: 0.9, duration: 0.15, ease: 'power4.in' }, 0.7)
    scatter1.to('.cinema-flash', { opacity: 0, duration: 0.3, ease: 'power2.out' }, 0.85)

    // === SCENE 2: Music Videos entrance (16-26%) ===
    const scene2TL = gsap.timeline({ scrollTrigger: st(16, 26) })
    scene2TL.fromTo('.cinema-s2-title .cinema-line-1 .cinema-letter',
      { x: () => (Math.random() - 0.5) * 400, y: () => (Math.random() - 0.5) * 400, rotation: () => (Math.random() - 0.5) * 180, opacity: 0, scale: 0 },
      { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, stagger: 0.04, duration: 0.5, ease: 'back.out(2)' }, 0)
    scene2TL.fromTo('.cinema-s2-title .cinema-line-2 .cinema-letter',
      { x: () => (Math.random() - 0.5) * 400, y: () => (Math.random() - 0.5) * 400, rotation: () => (Math.random() - 0.5) * 180, opacity: 0, scale: 0 },
      { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, stagger: 0.04, duration: 0.5, ease: 'back.out(2)' }, 0.1)
    scene2TL.fromTo('.cinema-s2-sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3)
    scene2TL.fromTo('.cinema-frame',
      { x: (i) => (i % 2 === 0 ? -300 : 300), y: (i) => (i < 3 ? -200 : 200), rotation: (i) => (i % 2 === 0 ? -15 : 10), opacity: 0, scale: 0.6 },
      { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out' }, 0.2)

    // Scatter 2: Scene 2 → Scene 3 (30-36%)
    const scatter2 = gsap.timeline({
      scrollTrigger: {
        ...st(30, 36),
        onUpdate: (self) => {
          if (self.progress > 0.4 && self.progress < 0.5 && window.__spawnParticles)
            window.__spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 14, 'blue')
        }
      }
    })
    scatter2.to('.cinema-s2-title .cinema-letter', {
      y: () => -100 - Math.random() * 300, x: () => (Math.random() - 0.5) * 600,
      rotation: () => (Math.random() - 0.5) * 360, opacity: 0, stagger: 0.02, duration: 0.5,
    }, 0)
    scatter2.to('.cinema-s2-sub', { opacity: 0, y: -50, duration: 0.3 }, 0)
    scatter2.to('.cinema-frame', { x: (i) => (i % 2 === 0 ? -500 : 500), y: (i) => (i < 3 ? -400 : 400), rotation: (i) => (i % 2 === 0 ? -30 : 20), opacity: 0, duration: 0.5, stagger: 0.05 }, 0.1)
    scatter2.to('#cinema-scene2', { opacity: 0, duration: 0.3 }, 0.5)
    scatter2.to('#cinema-scene3', { opacity: 1, duration: 0.3 }, 0.5)
    scatter2.to('.cinema-flash', { opacity: 0.6, duration: 0.1 }, 0.5)
    scatter2.to('.cinema-flash', { opacity: 0, duration: 0.2 }, 0.6)

    // === SCENE 3: Web Design entrance (36-46%) ===
    const scene3TL = gsap.timeline({ scrollTrigger: st(36, 46) })
    scene3TL.fromTo('.cinema-s3-title .cinema-line-1 .cinema-letter',
      { scale: 3, opacity: 0, rotation: () => (Math.random() - 0.5) * 90 },
      { scale: 1, opacity: 1, rotation: 0, stagger: 0.06, duration: 0.4, ease: 'expo.out' }, 0)
    scene3TL.fromTo('.cinema-s3-title .cinema-line-2 .cinema-letter',
      { scale: 3, opacity: 0, rotation: () => (Math.random() - 0.5) * 90 },
      { scale: 1, opacity: 1, rotation: 0, stagger: 0.06, duration: 0.4, ease: 'expo.out' }, 0.15)
    scene3TL.fromTo('.cinema-s3-sub', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.3)
    scene3TL.fromTo('.cinema-browser',
      { x: (i) => (i === 0 ? -500 : i === 1 ? 500 : 0), y: (i) => (i === 2 ? 400 : 0), rotateY: (i) => (i === 0 ? 45 : i === 1 ? -45 : 0), rotateX: (i) => (i === 2 ? 30 : 0), opacity: 0, scale: 0.5 },
      { x: 0, y: 0, rotateY: 0, rotateX: 0, opacity: 1, scale: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' }, 0.2)

    // Scatter 3: Scene 3 → Scene 4 CTA (55-62%)
    const scatter3 = gsap.timeline({
      scrollTrigger: {
        ...st(55, 62),
        onUpdate: (self) => {
          if (self.progress > 0.55 && self.progress < 0.65 && window.__spawnParticles)
            window.__spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 16, 'orange')
        }
      }
    })
    scatter3.to('.cinema-s3-title .cinema-letter', { y: () => 100 + Math.random() * 200, opacity: 0, stagger: 0.02, duration: 0.4 }, 0)
    scatter3.to('.cinema-s3-sub', { opacity: 0, duration: 0.2 }, 0)
    scatter3.to('.cinema-browser', { x: (i) => (i === 0 ? -600 : i === 1 ? 600 : 0), y: (i) => (i === 2 ? 500 : 0), opacity: 0, duration: 0.5, stagger: 0.05 }, 0.1)
    scatter3.to('#cinema-scene3', { opacity: 0, duration: 0.3 }, 0.4)
    scatter3.to('#cinema-scene4', { opacity: 1, duration: 0.5 }, 0.4)

    // === SCENE 4: CTA entrance (62-80%) ===
    const scene4TL = gsap.timeline({ scrollTrigger: st(62, 80) })
    scene4TL.fromTo('.cinema-s4-label', { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, 0)
    scene4TL.fromTo('.cinema-s4-title', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }, 0.1)
    scene4TL.fromTo('.cinema-s4-sub', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, 0.3)
    scene4TL.fromTo('.cinema-cta-btn', { y: 60, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 0.5)

    // Progress bar
    gsap.to('.cinema-progress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    })

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  // Scroll-scrubbed video
  useEffect(() => {
    const videos = [
      { id: 'v1', start: 0, end: 0.16 },
      { id: 'v2', start: 0.16, end: 0.36 },
      { id: 'v3', start: 0.36, end: 0.55 },
      { id: 'v4', start: 0.55, end: 1.0 },
    ]
    const loaded = new Set(['v1'])
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        if (maxScroll <= 0) { ticking = false; return }
        const progress = Math.min(window.scrollY / maxScroll, 1)
        videos.forEach(v => {
          const el = videoRefs.current[v.id]
          if (!el) return
          if (!loaded.has(v.id) && progress >= v.start - 0.05) {
            el.preload = 'auto'
            el.load()
            loaded.add(v.id)
          }
          if (!el.duration) return
          if (progress >= v.start && progress <= v.end) {
            const local = (progress - v.start) / (v.end - v.start)
            const targetTime = Math.min(local * el.duration, el.duration - 0.01)
            if (Math.abs(el.currentTime - targetTime) > 0.03) {
              if (el.fastSeek) el.fastSeek(targetTime)
              else el.currentTime = targetTime
            }
          }
        })
        ticking = false
      })
      ticking = true
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scene dots
  const sceneBreaks = useMemo(() => [0, 0.25, 0.55, 0.85], [])

  return (
    <div ref={wrapperRef}>
      <div className="cinema-grain" aria-hidden="true" />
      <div className="cinema-progress" />

      <div className="cinema-viewport" ref={viewportRef}>
        <ParticleCanvas />
        <div className="cinema-flash" />

        {/* SCENE 1: Hero — real CN Tower drift (replaces Seedance arrival) */}
        <div className="cinema-scene" id="cinema-scene1">
          <video
            className="cinema-video-bg"
            ref={setVideoRef('v1')}
            poster="/videos/seedance/scene1-cn-tower-poster.jpg"
            muted
            playsInline
            preload="auto"
          >
            <source src="/videos/seedance/scene1-cn-tower.webm" type="video/webm" />
            <source src="/videos/seedance/scene1-cn-tower.mp4" type="video/mp4" />
          </video>
          <div className="cinema-corner-mask" aria-hidden="true" />
          <div className="cinema-video-overlay" style={{ background: 'linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.7))' }} />

          <div className="cinema-hero-text">
            <p className="cinema-hero-label">Toronto — Creative Production</p>
            <h1 className="cinema-hero-title">
              <span className="cinema-line-1">{splitIntoLetters('TDOTS')}</span>
              <span className="cinema-line-2">{splitIntoLetters('SOLUTIONSZ')}</span>
            </h1>
            <img src="/logo.png" alt="TdotsSolutionsz" className="cinema-hero-logo" />
            <p className="cinema-hero-sub">Music Video Direction &bull; Web Design &bull; Visual Storytelling</p>
            <div className="cinema-hero-stats">
              <span>{PORTFOLIO_STATS.totalVideos} Videos</span>
              <span className="cinema-stat-dot">&bull;</span>
              <span>{PORTFOLIO_STATS.totalArtists} Artists</span>
              <span className="cinema-stat-dot">&bull;</span>
              <span>{formatViews(PORTFOLIO_STATS.totalViews)} Views</span>
            </div>
          </div>
          <div className="cinema-scroll-cue">SCROLL</div>
        </div>

        {/* SCENE 2: Music Videos */}
        <div className="cinema-scene cinema-scene--hidden" id="cinema-scene2">
          <video
            className="cinema-video-bg"
            ref={setVideoRef('v2')}
            poster="/videos/seedance/scene2-videos-poster.jpg"
            muted
            playsInline
            preload="metadata"
          >
            <source src="/videos/seedance/scene2-videos.webm" type="video/webm" />
            <source src="/videos/seedance/scene2-videos.mp4" type="video/mp4" />
          </video>
          <div className="cinema-corner-mask" aria-hidden="true" />
          <div className="cinema-video-overlay" style={{ background: 'radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0.3),rgba(0,0,0,0.7))' }} />

          <p className="cinema-s2-sub">{PORTFOLIO_STATS.totalVideos} VIDEOS &bull; {PORTFOLIO_STATS.totalArtists} ARTISTS &bull; {formatViews(PORTFOLIO_STATS.totalViews)} VIEWS</p>
          <h2 className="cinema-s2-title cinema-section-title">
            <span className="cinema-line-1">{splitIntoLetters('Music')}</span>
            <span className="cinema-line-2">{splitIntoLetters('Videos')}</span>
          </h2>

          <div className="cinema-floating-frames">
            {FEATURED.slice(0, 6).map((video, i) => (
              <Link to={`/video/${video.youtubeId}`} key={video.id} className="cinema-frame" style={{
                width: [280, 300, 240, 220, 260, 200][i],
                height: [180, 190, 155, 140, 165, 130][i],
                top: ['8%', '55%', '72%', '5%', '40%', '80%'][i],
                left: [8, undefined, 12, undefined, 3, undefined][i] != null ? `${[8, 0, 12, 0, 3, 0][i]}%` : undefined,
                right: [undefined, 5, undefined, 18, undefined, 10][i] != null ? `${[0, 5, 0, 18, 0, 10][i]}%` : undefined,
              }}>
                <img src={getThumbnailUrl(video.youtubeId, 'hqdefault')} alt={video.title} className="cinema-frame-img" loading="lazy" />
                <div className="cinema-frame-label">
                  {video.title}
                  <span>{video.artist} &bull; {formatViews(video.viewCount)} views</span>
                </div>
              </Link>
            ))}
          </div>

          <Link to="/videos" className="cinema-enter-btn">
            ENTER PORTFOLIO <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* SCENE 3: Web Design */}
        <div className="cinema-scene cinema-scene--hidden" id="cinema-scene3">
          <video
            className="cinema-video-bg"
            ref={setVideoRef('v3')}
            poster="/videos/seedance/scene3-webdesign-poster.jpg"
            muted
            playsInline
            preload="metadata"
          >
            <source src="/videos/seedance/scene3-webdesign.webm" type="video/webm" />
            <source src="/videos/seedance/scene3-webdesign.mp4" type="video/mp4" />
          </video>
          <div className="cinema-corner-mask" aria-hidden="true" />
          <div className="cinema-video-overlay" style={{ background: 'radial-gradient(ellipse at 60% 50%,rgba(0,0,0,0.3),rgba(0,0,0,0.7))' }} />

          <p className="cinema-s3-sub">SITES &bull; BRANDS &bull; DIGITAL EXPERIENCES</p>
          <h2 className="cinema-s3-title cinema-section-title">
            <span className="cinema-line-1">{splitIntoLetters('Web')}</span>
            <span className="cinema-line-2">{splitIntoLetters('Design')}</span>
          </h2>

          <div className="cinema-browsers">
            {WEB_PROJECTS.map((project, i) => (
              <a key={project.name} href={project.url} target="_blank" rel="noopener noreferrer" className="cinema-browser" style={{
                width: [400, 360][i], height: [280, 250][i],
                top: ['12%', '55%'][i],
                left: i === 0 ? '8%' : undefined,
                right: i === 1 ? '8%' : undefined,
              }}>
                <div className="cinema-browser-chrome">
                  <div className="cinema-browser-dot" style={{ background: '#ff5f57' }} />
                  <div className="cinema-browser-dot" style={{ background: '#febc2e' }} />
                  <div className="cinema-browser-dot" style={{ background: '#28c840' }} />
                  <span className="cinema-browser-url">{project.name.toLowerCase()}.com</span>
                </div>
                <div className="cinema-browser-body">
                  {project.preview
                    ? <img src={project.preview} alt={project.name} className="cinema-browser-preview" />
                    : <div className="cinema-browser-placeholder">{project.name}</div>
                  }
                </div>
              </a>
            ))}
          </div>

          <Link to="/web-design" className="cinema-enter-btn">
            VIEW WORK <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* SCENE 4: CTA — Toronto twilight (replaces fake-tower aerial) */}
        <div className="cinema-scene cinema-scene--hidden" id="cinema-scene4">
          <video
            className="cinema-video-bg"
            ref={setVideoRef('v4')}
            poster="/videos/seedance/scene4-toronto-twilight-poster.jpg"
            muted
            playsInline
            preload="metadata"
          >
            <source src="/videos/seedance/scene4-toronto-twilight.webm" type="video/webm" />
            <source src="/videos/seedance/scene4-toronto-twilight.mp4" type="video/mp4" />
          </video>
          <div className="cinema-corner-mask" aria-hidden="true" />
          <div className="cinema-video-overlay" style={{ background: 'radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0.4),rgba(0,0,0,0.8))' }} />

          <p className="cinema-s4-label">LET'S WORK</p>
          <h2 className="cinema-s4-title">Book a<br />Session</h2>
          <p className="cinema-s4-sub">Ready to bring your vision to life?<br />Let's create something unforgettable.</p>
          <a href="mailto:info@tdotssolutionsz.com?subject=Project%20Inquiry&body=Hey%20James%2C%0A%0AI%27m%20interested%20in%20working%20together.%0A%0A" className="cinema-cta-btn">
            GET STARTED <span>&rarr;</span>
          </a>
          <footer className="cinema-footer">
            <p>TdotsSolutionsz</p>
            <p>Toronto, Ontario &bull; &copy; {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>

      <div className="cinema-track" />
    </div>
  )
}
