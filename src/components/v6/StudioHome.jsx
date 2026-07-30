/**
 * StudioHome.jsx — v6 studio homepage.
 *
 * Replaces the five-panel CN Tower hero stack with an evidence-first editorial
 * page. The argument the page makes, in order:
 *
 *   1. Hero      — the positioning line, over a wall of the studio's own work.
 *   2. Ledger    — the four numbers, set large, on inverted (bone) ground.
 *   3. Reel      — six films as case tiles, credited, with real view counts.
 *   4. Pipeline  — Direct / Design / Ship: why one studio beats three vendors.
 *   5. Builds    — six shipped products, each linking to the live site.
 *   6. Roster    — every artist, as a credit wall.
 *   7. Contact   — one CTA, on bone ground.
 *
 * Design system lives in StudioHome.css under the `.v6` scope so it cannot
 * leak into /videos or /web-design. No Three.js on this route — the page is
 * images, type, and CSS transforms only, so it paints fast on a phone.
 *
 * @module components/v6/StudioHome
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    STATS,
    REEL,
    ROSTER,
    BUILDS,
    PIPELINE,
    CONTACT,
    ALL_VIDEOS,
    compactViews
} from '../../data/studio'
import './StudioHome.css'

/** YouTube serves several thumbnail sizes; the 320px one is enough for the hero wall. */
const smallThumb = (url) => (url || '').replace('maxresdefault', 'mqdefault')

/**
 * YouTube does NOT 404 a missing `maxresdefault.jpg` — it serves a 120x90 grey
 * "no thumbnail" stub with a 200. Pre-2016 uploads frequently have no maxres,
 * so an <img> that merely handles onError still renders the grey box. The only
 * reliable tell is the decoded size, checked on load.
 *
 * `hqdefault.jpg` (480x360) exists for every video ever uploaded, so it is the
 * guaranteed floor.
 *
 * The chain is: locally-extracted poster → YouTube maxres → YouTube hq.
 *
 * @param {{src:string, alt:string, className?:string, fallback?:string}} props
 */
function Thumb({ src, alt, className = '', fallback = '' }) {
    const [current, setCurrent] = useState(src)

    useEffect(() => { setCurrent(src) }, [src])

    const downgrade = () => {
        setCurrent((c) => {
            if (fallback && c !== fallback && !c.includes('img.youtube.com')) return fallback
            if (c.includes('maxresdefault')) return c.replace('maxresdefault', 'hqdefault')
            return c
        })
    }

    return (
        <img
            className={className}
            src={current}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={downgrade}
            onLoad={(e) => {
                // 120x90 is the stub. Anything that small is not a real still.
                if (e.currentTarget.naturalWidth <= 120) downgrade()
            }}
        />
    )
}

/**
 * Reveal-on-scroll wrapper. Adds `is-in` once the element crosses into view,
 * then unobserves — reveals are one-way so scrolling back up doesn't re-animate.
 * Falls back to always-visible when IntersectionObserver is unavailable or the
 * user has asked for reduced motion.
 */
function Reveal({ children, className = '', delay = 0, as: Tag = 'div', ...rest }) {
    const ref = useRef(null)
    const [shown, setShown] = useState(false)

    useEffect(() => {
        const node = ref.current
        if (!node) return
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        if (reduced || typeof IntersectionObserver === 'undefined') {
            setShown(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true)
                    io.unobserve(node)
                }
            },
            { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [])

    return (
        <Tag
            ref={ref}
            className={`v6-reveal ${shown ? 'is-in' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
            {...rest}
        >
            {children}
        </Tag>
    )
}

/**
 * Hero backdrop — three columns of the studio's own thumbnails drifting at
 * different speeds. Deliberately the real catalogue rather than stock imagery:
 * the wall itself is the credential. Marked aria-hidden, and the animation is
 * disabled under prefers-reduced-motion (see CSS).
 */
function WorkWall() {
    const columns = useMemo(() => {
        const pool = ALL_VIDEOS.filter((v) => v.thumbnail).slice(0, 36)
        const cols = [[], [], []]
        pool.forEach((v, i) => cols[i % 3].push(v))
        // Duplicate each column so the marquee loop has no seam.
        return cols.map((c) => [...c, ...c])
    }, [])

    return (
        <div className="v6-wall" aria-hidden="true">
            {columns.map((col, i) => (
                <div className={`v6-wall__col v6-wall__col--${i + 1}`} key={i}>
                    {col.map((v, j) => (
                        <div className="v6-wall__cell" key={`${v.youtubeId}-${j}`}>
                            <img src={smallThumb(v.thumbnail)} alt="" loading="lazy" decoding="async" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

/** The four headline numbers, recomputed from the real dataset at build time. */
function Ledger() {
    const items = [
        { value: String(STATS.films), label: 'Films directed' },
        { value: String(STATS.artists), label: 'Artists' },
        { value: `${(STATS.views / 1_000_000).toFixed(1)}M`, label: 'Views earned' },
        { value: String(BUILDS.length), label: 'Products shipped' }
    ]
    return (
        <section className="v6-ledger" id="ledger">
            <div className="v6-shell">
                <div className="v6-ledger__grid">
                    {items.map((it, i) => (
                        <Reveal className="v6-ledger__item" key={it.label} delay={i * 70}>
                            <span className="v6-ledger__value">{it.value}</span>
                            <span className="v6-ledger__label">{it.label}</span>
                        </Reveal>
                    ))}
                </div>
                <Reveal className="v6-ledger__note" delay={280}>
                    <p>
                        Every figure on this page is counted from the work itself — {STATS.films} released
                        films between {STATS.firstYear} and {STATS.lastYear}, and the public view counts
                        attached to them. Nothing here is an estimate.
                    </p>
                </Reveal>
            </div>
        </section>
    )
}

/**
 * ScrubFrame — a film tile you can scrub.
 *
 * Hovering loads a self-hosted silent loop cut from the actual film
 * (see scripts/build-preview-clips.mjs) and plays it. Moving the cursor across
 * the tile seeks `currentTime` to the cursor's horizontal position — the film
 * scrubs under your hand, the way a timeline does. Going still for a moment
 * hands control back to playback from wherever you left it.
 *
 * Everything degrades cleanly: no clip on disk, a decode failure, a touch
 * pointer, or prefers-reduced-motion all leave the static still in place.
 *
 * @param {{video: any, lead?: boolean}} props
 */
function ScrubFrame({ video, lead = false }) {
    const wrapRef = useRef(null)
    const videoRef = useRef(null)
    const idleRef = useRef(null)
    const [armed, setArmed] = useState(false)     // clip requested
    const [ready, setReady] = useState(false)     // clip has frames to show
    const [progress, setProgress] = useState(0)
    const [scrubbing, setScrubbing] = useState(false)

    const canScrub = () =>
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const enter = () => {
        if (!canScrub()) return
        setArmed(true)
    }

    const move = (e) => {
        const el = videoRef.current
        const wrap = wrapRef.current
        if (!el || !wrap || !ready) return

        const rect = wrap.getBoundingClientRect()
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
        const duration = el.duration
        if (!Number.isFinite(duration) || duration <= 0) return

        setScrubbing(true)
        el.pause()
        el.currentTime = ratio * duration
        setProgress(ratio)

        // Idle for a beat → resume playing from the scrub point.
        clearTimeout(idleRef.current)
        idleRef.current = setTimeout(() => {
            setScrubbing(false)
            el.play?.().catch(() => {})
        }, 420)
    }

    const leave = () => {
        clearTimeout(idleRef.current)
        const el = videoRef.current
        if (el) {
            el.pause()
            try { el.currentTime = 0 } catch { /* seek can throw pre-metadata */ }
        }
        setScrubbing(false)
        setReady(false)
        setArmed(false)
        setProgress(0)
    }

    // Keep playback progress in the rail while the clip runs on its own.
    useEffect(() => {
        const el = videoRef.current
        if (!el || !ready) return
        const onTime = () => {
            if (!scrubbing && el.duration > 0) setProgress(el.currentTime / el.duration)
        }
        el.addEventListener('timeupdate', onTime)
        return () => el.removeEventListener('timeupdate', onTime)
    }, [ready, scrubbing])

    useEffect(() => () => clearTimeout(idleRef.current), [])

    return (
        <div
            className={`v6-film__frame ${ready ? 'has-clip' : ''} ${scrubbing ? 'is-scrubbing' : ''}`}
            ref={wrapRef}
            onPointerEnter={enter}
            onPointerMove={move}
            onPointerLeave={leave}
        >
            <Thumb
                className="v6-film__still"
                src={`/previews/${video.youtubeId}.jpg`}
                fallback={video.thumbnail}
                alt={`Still from ${video.title}, directed by TdotsSolutionsz`}
            />

            {armed && (
                <video
                    ref={videoRef}
                    className="v6-film__clip"
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    tabIndex={-1}
                    onCanPlay={(e) => {
                        setReady(true)
                        e.currentTarget.play?.().catch(() => {})
                    }}
                    onError={() => setArmed(false)}
                >
                    <source src={`/previews/${video.youtubeId}.webm`} type="video/webm" />
                    <source src={`/previews/${video.youtubeId}.mp4`} type="video/mp4" />
                </video>
            )}

            <span className="v6-film__rail" aria-hidden="true">
                <i style={{ transform: `scaleX(${progress})` }} />
            </span>

            <span className="v6-film__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M6 4l14 8-14 8V4z" />
                </svg>
                {ready ? 'Scrub' : 'Watch'}
            </span>

            {lead && (
                <span className="v6-film__hint" aria-hidden="true">
                    Move across to scrub
                </span>
            )}
        </div>
    )
}

/** Six films, credited, with real view counts. Clicking opens the detail route. */
function Reel() {
    return (
        <section className="v6-section v6-section--ink" id="film">
            <div className="v6-shell">
                <Reveal className="v6-head">
                    <span className="v6-eyebrow">01 — Selected film</span>
                    <h2 className="v6-h2">
                        Thirteen years of<br />
                        <em>Toronto on camera.</em>
                    </h2>
                </Reveal>

                <div className="v6-reel">
                    {REEL.map((v, i) => (
                        <Reveal className={`v6-film ${i === 0 ? 'v6-film--lead' : ''}`} key={v.youtubeId} delay={(i % 3) * 80}>
                            <Link to={`/video/${v.youtubeId}`} className="v6-film__link">
                                <ScrubFrame video={v} lead={i === 0} />
                                <div className="v6-film__meta">
                                    <span className="v6-film__artist">{v.artist}</span>
                                    <span className="v6-film__title">{v.title.replace(`${v.artist} - `, '')}</span>
                                    <span className="v6-film__stats">
                                        <span>{v.uploadDate?.slice(0, 4)}</span>
                                        <span className="v6-dot" aria-hidden="true">/</span>
                                        <span>{compactViews(v.viewCount)} views</span>
                                    </span>
                                </div>
                            </Link>
                        </Reveal>
                    ))}
                </div>

                <Reveal className="v6-more" delay={120}>
                    <Link to="/videos" className="v6-btn v6-btn--ghost">
                        All {STATS.films} films
                        <span aria-hidden="true">→</span>
                    </Link>
                </Reveal>
            </div>
        </section>
    )
}

/** Direct / Design / Ship — the reason one studio beats three vendors. */
function Pipeline() {
    return (
        <section className="v6-section v6-section--paper" id="studio">
            <div className="v6-shell">
                <Reveal className="v6-head">
                    <span className="v6-eyebrow">02 — The studio</span>
                    <h2 className="v6-h2">
                        Most people need three vendors.<br />
                        <em>This is one.</em>
                    </h2>
                </Reveal>

                <div className="v6-pipeline">
                    {PIPELINE.map((p, i) => (
                        <Reveal className="v6-pipe" key={p.n} delay={i * 90}>
                            <span className="v6-pipe__n">{p.n}</span>
                            <h3 className="v6-pipe__title">{p.title}</h3>
                            <p className="v6-pipe__lede">{p.lede}</p>
                            <p className="v6-pipe__body">{p.body}</p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

/** Six shipped products. Each card links to the live site, not a case-study stub. */
function Builds() {
    return (
        <section className="v6-section v6-section--ink" id="build">
            <div className="v6-shell">
                <Reveal className="v6-head">
                    <span className="v6-eyebrow">03 — Selected build</span>
                    <h2 className="v6-h2">
                        Software that runs<br />
                        <em>without us.</em>
                    </h2>
                </Reveal>

                <div className="v6-builds">
                    {BUILDS.map((b, i) => (
                        <Reveal className="v6-build" key={b.slug} delay={(i % 3) * 80}>
                            <a
                                className="v6-build__link"
                                href={b.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="v6-build__shot">
                                    {b.preview ? (
                                        <img src={b.preview} alt={`${b.client} website`} loading="lazy" decoding="async" />
                                    ) : (
                                        <span className="v6-build__wordmark">{b.client}</span>
                                    )}
                                </div>
                                <div className="v6-build__body">
                                    <div className="v6-build__row">
                                        <h3 className="v6-build__client">{b.client}</h3>
                                        <span className="v6-build__go" aria-hidden="true">↗</span>
                                    </div>
                                    <span className="v6-build__sector">{b.sector}</span>
                                    <p className="v6-build__summary">{b.summary}</p>
                                    <ul className="v6-build__stack">
                                        {b.stack.map((s) => (
                                            <li key={s}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            </a>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    )
}

/** Credit wall — every artist on the roster. */
function Roster() {
    return (
        <section className="v6-section v6-section--ink v6-section--tight" id="roster">
            <div className="v6-shell">
                <Reveal className="v6-head v6-head--slim">
                    <span className="v6-eyebrow">04 — Credits</span>
                </Reveal>
                <Reveal className="v6-roster">
                    {ROSTER.map((name, i) => (
                        <span className="v6-roster__name" key={name}>
                            {name}
                            {i < ROSTER.length - 1 && <i className="v6-roster__sep" aria-hidden="true">·</i>}
                        </span>
                    ))}
                </Reveal>
            </div>
        </section>
    )
}

/** One CTA, on bone ground so it reads as the end of the argument. */
function Contact() {
    return (
        <section className="v6-section v6-section--paper v6-contact" id="contact">
            <div className="v6-shell">
                <Reveal className="v6-contact__inner">
                    <span className="v6-eyebrow">05 — Next</span>
                    <h2 className="v6-contact__h">
                        Bring the record.<br />
                        We&rsquo;ll bring<br />
                        <em>everything else.</em>
                    </h2>
                    <p className="v6-contact__sub">
                        Thirty minutes, no deck. Tell us what you&rsquo;re releasing and we&rsquo;ll
                        tell you exactly what it takes to land it — film, site, or both.
                    </p>
                    <div className="v6-contact__actions">
                        <a
                            className="v6-btn v6-btn--solid"
                            href={CONTACT.booking}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Book a call
                            <span aria-hidden="true">→</span>
                        </a>
                        <a className="v6-btn v6-btn--quiet" href={`mailto:${CONTACT.email}`}>
                            {CONTACT.email}
                        </a>
                    </div>
                </Reveal>
            </div>
        </section>
    )
}

/** Fixed top bar. Goes opaque once the hero is behind it. */
function Nav() {
    const [stuck, setStuck] = useState(false)

    useEffect(() => {
        const onScroll = () => setStuck(window.scrollY > window.innerHeight * 0.7)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    return (
        <header className={`v6-nav ${stuck ? 'is-stuck' : ''}`}>
            <div className="v6-nav__inner">
                <a className="v6-nav__brand" href="#top" aria-label="TdotsSolutionsz — home">
                    <svg className="v6-nav__mark" viewBox="0 0 64 64" width="22" height="22" aria-hidden="true">
                        <g fill="currentColor">
                            <path d="M4 4h20v6H10v14H4V4Z" />
                            <path d="M60 4v20h-6V10H40V4h20Z" />
                            <path d="M4 60V40h6v14h14v6H4Z" />
                            <path d="M60 60H40v-6h14V40h6v20Z" />
                            <rect x="22" y="22" width="20" height="20" rx="1" />
                        </g>
                    </svg>
                    <span className="v6-nav__word">
                        Tdots<b>Solutionsz</b>
                    </span>
                </a>
                <nav className="v6-nav__links" aria-label="Primary">
                    <a href="#film">Film</a>
                    <a href="#studio">Studio</a>
                    <a href="#build">Build</a>
                </nav>
                <a
                    className="v6-nav__cta"
                    href={CONTACT.booking}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Book a call
                </a>
            </div>
        </header>
    )
}

/**
 * The v6 studio homepage.
 * @returns {JSX.Element}
 */
export default function StudioHome() {
    useEffect(() => {
        document.body.classList.add('v6-body')
        return () => document.body.classList.remove('v6-body')
    }, [])

    return (
        <main className="v6" id="top">
            <a className="skip-nav" href="#film">Skip to work</a>
            <Nav />

            <section className="v6-hero">
                <WorkWall />
                <div className="v6-hero__scrim" aria-hidden="true" />
                <div className="v6-shell v6-hero__inner">
                    <span className="v6-hero__eyebrow">
                        Toronto <i aria-hidden="true">/</i> Creative production &amp; software
                    </span>
                    <h1 className="v6-hero__h">
                        We direct the film.<br />
                        We build the machine<br />
                        <em>that sells it.</em>
                    </h1>
                    <p className="v6-hero__sub">
                        A studio that shoots the video, designs the identity, and ships the
                        product — {STATS.films} films for {STATS.artists} artists, and six
                        applications live in production.
                    </p>
                    <div className="v6-hero__actions">
                        <a href="#film" className="v6-btn v6-btn--solid">
                            See the work
                            <span aria-hidden="true">→</span>
                        </a>
                        <a
                            className="v6-btn v6-btn--ghost"
                            href={CONTACT.booking}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Book a call
                        </a>
                    </div>
                </div>
                <div className="v6-hero__rule" aria-hidden="true">
                    <span>{STATS.firstYear}—{STATS.lastYear}</span>
                    <span>{CONTACT.location}</span>
                    <span>Scroll</span>
                </div>
            </section>

            <Ledger />
            <Reel />
            <Pipeline />
            <Builds />
            <Roster />
            <Contact />

            <footer className="v6-foot">
                <div className="v6-shell v6-foot__inner">
                    <span>TdotsSolutionsz</span>
                    <span>{CONTACT.location}</span>
                    <span>&copy; {new Date().getFullYear()}</span>
                </div>
            </footer>
        </main>
    )
}
