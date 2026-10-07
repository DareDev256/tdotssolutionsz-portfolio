import { useEffect, useRef, useState } from 'react'
import './BookDoors.css'

/**
 * The close of the cinematic hub. Two doors — a music video, a website — and
 * one gesture to walk through the one you picked.
 *
 * Why not a button: the page has just spent three floors proving things, and
 * the old close asked for nothing specific (a mailto with a canned body, to an
 * inbox the audience does not use). A pick makes the visitor say what they
 * want; the slide makes the send deliberate; the email arrives in the tdots
 * inbox prefilled with the pick.
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

/* the door lands in the tdots inbox — James's call, 2026-09-20 */
const TO = 'tdotssolutionsz@gmail.com'
const mailto = (subject, body) => `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

const DOORS = [
  {
    id: 'video',
    pill: 'A music video',
    title: 'A music video',
    lines: [
      'Send the record and the idea.',
      'You get a treatment back, a shoot day with a crew, the edit and colour, and the cut delivered for YouTube with verticals for the feed.',
    ],
    subject: 'Music video',
    body: 'Hi James,\n\nI want a music video.\n\nThe record: \nThe idea: \nWhen: \n\n',
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
    subject: 'Website',
    body: 'Hi James,\n\nI want a site.\n\nMy Instagram: @\nWhat I do: \n\n',
  },
]

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export function BookDoors({ videoMeta, siteMeta }) {
  /* the proof lines come from the page's own measured data, never typed here */
  const META = { video: videoMeta, site: siteMeta }
  const [pick, setPick] = useState(null)
  const [rail, setRail] = useState(false)
  const door = DOORS.find(d => d.id === pick)
  const subject = door ? `${door.subject} — booking` : 'Booking'
  const body = door ? door.body : 'Hi James,\n\nI want to book a session.\n\n'
  const href = mailto(subject, body)

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
            onClick={() => { setRail(false); setPick(p => (p === d.id ? null : d.id)) }}
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
      <SlideToConfirm href={href} onReveal={() => setRail(true)} label={door ? `Slide to send · ${door.pill.toLowerCase()}` : 'Slide to send'} />
      {rail && <SendRail key={pick || 'any'} subject={subject} body0={body} />}
    </div>
  )
}

/* ── The send rail ──────────────────────────────────────────
   The slide used to end in window.location = mailto:. On a phone, or a desktop
   with no mail handler, that does nothing, and the booking is lost with the
   visitor none the wiser (2026-10-07 audit). Now the slide composes the message
   and PRINTS it here, editable, with a route per mail service. The text on
   screen cannot fail; each button under it can, so each says where it goes.
   Subject carries a timestamp so Gmail never folds two bookings into one thread. */
function SendRail({ subject, body0 }) {
  const [body, setBody] = useState(body0)
  const [copied, setCopied] = useState(false)
  const [subj] = useState(() => `${subject} (${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })})`)
  const q = encodeURIComponent
  const copy = async () => {
    try { await navigator.clipboard.writeText(`To: ${TO}\nSubject: ${subj}\n\n${body}`); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <div className="bd-rail" aria-live="polite">
      <p className="bd-rail-k">Your message to {TO}</p>
      <p className="bd-rail-subject">{subj}</p>
      <textarea className="bd-rail-body" value={body} onChange={e => { setBody(e.target.value); setCopied(false) }} rows={7} aria-label="Message body, editable" />
      <div className="bd-rail-routes">
        <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${q(TO)}&su=${q(subj)}&body=${q(body)}`} target="_blank" rel="noopener noreferrer">Send via Gmail</a>
        <a href={`https://outlook.live.com/mail/0/deeplink/compose?to=${q(TO)}&subject=${q(subj)}&body=${q(body)}`} target="_blank" rel="noopener noreferrer">Via Outlook</a>
        <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy it'}</button>
        <a href={mailto(subj, body)}>Mail app</a>
      </div>
    </div>
  )
}

/* ── Slide to confirm ───────────────────────────────────────
   The handle is a real link, so keyboard and reduced-motion users get a
   plain "open email" press. With a pointer, the click is suppressed
   unless the drag reached the end: the commit is the arrival, not the
   press. Released early it springs home with a small squash. */
function SlideToConfirm({ href, label, onReveal }) {
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
      window.setTimeout(onReveal, 420)
    } else {
      setX(0)
      setState('rest')
    }
  }
  const click = (e) => {
    /* a pointer that dragged is not a click; a keyboard press or a
       reduced-motion user IS, and the link does its ordinary job */
    if (drag.current || (state !== 'done' && !still && e.detail !== 0 && max > 0)) { e.preventDefault(); return }
    /* a keyboard or reduced-motion press: show the rail instead of leaving the page */
    e.preventDefault()
    onReveal()
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
      <span className="bd-slide-label" aria-hidden="true">{done ? 'Your message is below' : label}</span>
      <a
        href={href}
        className="bd-slide-handle"
        aria-label={`${label} by email`}
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
