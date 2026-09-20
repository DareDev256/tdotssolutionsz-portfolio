import { useEffect, useRef, useState } from 'react'
import './BookDoors.css'

/**
 * The close of the cinematic hub. Two doors — a music video, a website — and
 * one gesture to walk through the one you picked.
 *
 * Why not a button: the page has just spent three floors proving things, and
 * the old close asked for nothing specific (a mailto with a canned body, to an
 * inbox the audience does not use). A pick makes the visitor say what they
 * want; the slide makes the send deliberate; WhatsApp is where this audience
 * already lives, and the message arrives prefilled with the pick.
 *
 * Two Bencho finds, adapted (bencho.dev/finds, MIT blocks vendored at
 * ~/Projects/tools/bencho-blocks): "Pills into cards" — press a pill and it
 * grows into the card it stands for, the label blurring out as the box opens —
 * and "Slide to confirm" — the handle only commits at the end of the track and
 * springs home if released early. Same slide as /sites, so the site has one
 * way of saying yes.
 *
 * Numbers: the website door prints the figures already published on /sites
 * ($500 build, $30/mo, live in a week). The video door prints none — there is
 * no published rate, and an invented one is the thing this site refuses.
 */

const WA = 'https://wa.me/14165286149'

const DOORS = [
  {
    id: 'video',
    pill: 'A music video',
    title: 'A music video',
    lines: [
      'Send the record and the idea.',
      'You get a treatment back, a shoot day with a crew, the edit and colour, and the cut delivered for YouTube with verticals for the feed.',
    ],
    text: "Hi James, I want a music video. The record is ",
  },
  {
    id: 'site',
    pill: 'A website',
    title: 'A website',
    lines: [
      'Built from what you already post.',
      '$500 to build, half at preview and half at live. $30 a month keeps it up, with the domain and edits. Live in a week.',
    ],
    href: '/sites/',
    text: 'Hi James, I want a site. My Instagram is @',
  },
]

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export function BookDoors({ videoMeta, siteMeta }) {
  /* the proof lines come from the page's own measured data, never typed here */
  const META = { video: videoMeta, site: siteMeta }
  const [pick, setPick] = useState(null)
  const door = DOORS.find(d => d.id === pick)
  const text = door ? door.text : 'Hi James, I want to book a session. '
  const href = `${WA}?text=${encodeURIComponent(text)}`

  return (
    <div className="bd">
      <div className="bd-pills" role="group" aria-label="What are you booking">
        {DOORS.map(d => (
          <button
            key={d.id}
            type="button"
            className="bd-pill"
            data-open={pick === d.id}
            aria-pressed={pick === d.id}
            onClick={() => setPick(p => (p === d.id ? null : d.id))}
          >
            <span className="bd-pill-label">{d.pill}</span>
            {/* the card, inside the pill: the pill IS the card once it opens */}
            <span className="bd-card" aria-hidden={pick !== d.id}>
              <span className="bd-card-title">{d.title}</span>
              {d.lines.map((l, i) => <span key={i} className="bd-card-line">{l}</span>)}
              <span className="bd-card-meta">
                {d.href ? <a href={d.href} onClick={e => e.stopPropagation()}>{META[d.id]}</a> : META[d.id]}
              </span>
            </span>
          </button>
        ))}
      </div>
      <SlideToConfirm href={href} label={door ? `Slide to send · ${door.pill.toLowerCase()}` : 'Slide to send'} />
    </div>
  )
}

/* ── Slide to confirm ───────────────────────────────────────
   The handle is a real link, so keyboard and reduced-motion users get a
   plain "open WhatsApp" press. With a pointer, the click is suppressed
   unless the drag reached the end: the commit is the arrival, not the
   press. Released early it springs home with a small squash. */
function SlideToConfirm({ href, label }) {
  const track = useRef(null)
  const [x, setX] = useState(0)
  const [max, setMax] = useState(0)
  const [state, setState] = useState('rest') // rest | drag | done
  const drag = useRef(null)
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setMax(el.clientWidth - 56 - 8) // track − handle − 2×inset
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const down = (e) => {
    if (still || state === 'done') return
    drag.current = { x0: e.clientX, moved: false }
    setState('drag')
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* not a live pointer */ }
  }
  const move = (e) => {
    const g = drag.current
    if (!g) return
    const dx = e.clientX - g.x0
    if (Math.abs(dx) > 3) g.moved = true
    setX(clamp(dx, 0, max))
  }
  const up = (e) => {
    const g = drag.current
    if (!g) return
    drag.current = null
    const dx = clamp(e.clientX - g.x0, 0, max)
    if (max > 0 && dx >= max - 4) {
      setX(max)
      setState('done')
      window.setTimeout(() => window.open(href, '_blank', 'noopener,noreferrer'), 420)
    } else {
      setX(0)
      setState('rest')
    }
  }
  const click = (e) => {
    /* a pointer that dragged is not a click; a keyboard press or a
       reduced-motion user IS, and the link does its ordinary job */
    if (drag.current || (state !== 'done' && !still && e.detail !== 0 && max > 0)) e.preventDefault()
  }

  const done = state === 'done'
  return (
    <div
      ref={track}
      className="bd-slide"
      data-state={state}
      style={{ '--x': `${x}px`, '--max': `${max}px` }}
    >
      <span className="bd-slide-fill" aria-hidden="true" />
      <span className="bd-slide-label" aria-hidden="true">{done ? 'Opening WhatsApp' : label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="bd-slide-handle"
        aria-label={`${label} on WhatsApp`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClick={click}
        draggable="false"
      >
        <span aria-hidden="true">{done ? '✓' : '→'}</span>
      </a>
    </div>
  )
}
