/**
 * Pad — concept 3: play the catalogue.
 *
 * A 4x4 sampler where every pad is a shot from a film, with its audio. Hit a
 * pad (mouse or keyboard) and it fires: picture to the main display, sound to
 * the speakers. Arm REC, play a few bars, and it records your hits with real
 * timing; PLAY replays the sequence. You end up having made something out of
 * thirteen years of drill videos.
 *
 * Each pad owns its own <video>, created once and re-triggered by resetting
 * currentTime. Creating an element per hit would cost a fetch and a decode on
 * every press — far too slow to feel like an instrument. Latency matters more
 * than memory here.
 *
 * @module components/lab/Pad
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clipSrc, stillSrc, rng } from './useShots'

/** Classic MPC key layout: bottom-left is pad 1, matching the visual grid. */
const KEYS = ['1', '2', '3', '4', 'q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v']

export default function Pad({ shots, sound }) {
    const [bank, setBank] = useState(0)
    const [lit, setLit] = useState(-1)
    const [display, setDisplay] = useState(null)
    const [recording, setRecording] = useState(false)
    const [sequence, setSequence] = useState([])
    const [playingSeq, setPlayingSeq] = useState(false)

    const videoRefs = useRef([])
    const recStart = useRef(0)
    const seqTimers = useRef([])
    const litTimer = useRef(null)

    /**
     * Sixteen shots per bank, dealt round-robin across films so a bank is never
     * all one artist. Deterministic per bank so pads don't move under the
     * player's fingers between renders.
     */
    const pads = useMemo(() => {
        const rand = rng(1000 + bank)
        const byFilm = new Map()
        for (const s of shots) {
            if (!byFilm.has(s.film)) byFilm.set(s.film, [])
            byFilm.get(s.film).push(s)
        }
        for (const list of byFilm.values()) {
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1))
                ;[list[i], list[j]] = [list[j], list[i]]
            }
        }
        const decks = [...byFilm.values()]
        const out = []
        let i = 0
        while (out.length < 16 && decks.some((d) => d.length)) {
            const deck = decks[i % decks.length]
            if (deck.length) out.push(deck.pop())
            i++
        }
        return out
    }, [shots, bank])

    const fire = useCallback((n, record = true) => {
        const shot = pads[n]
        const el = videoRefs.current[n]
        if (!shot || !el) return

        el.muted = !sound
        try { el.currentTime = 0 } catch { /* not ready yet */ }
        el.play?.().catch(() => {})

        setDisplay({ shot, n })
        setLit(n)
        clearTimeout(litTimer.current)
        litTimer.current = setTimeout(() => setLit(-1), 140)

        if (record && recording) {
            setSequence((s) => [...s, { n, t: performance.now() - recStart.current }])
        }
    }, [pads, sound, recording])

    // Keyboard is the point of a sampler — mouse alone can't play a pattern.
    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName)) return
            const n = KEYS.indexOf(e.key.toLowerCase())
            if (n >= 0) { e.preventDefault(); fire(n) }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [fire])

    useEffect(() => () => {
        seqTimers.current.forEach(clearTimeout)
        clearTimeout(litTimer.current)
    }, [])

    const toggleRec = () => {
        if (recording) { setRecording(false); return }
        setSequence([])
        recStart.current = performance.now()
        setRecording(true)
    }

    const playSequence = () => {
        if (!sequence.length) return
        seqTimers.current.forEach(clearTimeout)
        setPlayingSeq(true)
        seqTimers.current = sequence.map((hit) =>
            setTimeout(() => fire(hit.n, false), hit.t)
        )
        const end = sequence[sequence.length - 1].t + 900
        seqTimers.current.push(setTimeout(() => setPlayingSeq(false), end))
    }

    const stopSequence = () => {
        seqTimers.current.forEach(clearTimeout)
        seqTimers.current = []
        setPlayingSeq(false)
    }

    return (
        <div className="lab-pad">
            <div className="lab-pad__screen">
                {display ? (
                    <>
                        <img src={stillSrc(display.shot)} alt="" className="lab-pad__still" />
                        <div className="lab-pad__now">
                            <b>{display.shot.artist}</b>
                            <span>
                                {display.shot.title.replace(`${display.shot.artist} - `, '')} ·{' '}
                                {display.shot.year}
                            </span>
                        </div>
                    </>
                ) : (
                    <p className="lab-pad__idle">
                        Hit a pad — or use the keyboard<br />
                        <code>1 2 3 4 / Q W E R / A S D F / Z X C V</code>
                    </p>
                )}
            </div>

            <div className="lab-pad__grid">
                {pads.map((shot, n) => (
                    <button
                        type="button"
                        key={shot.id}
                        className={`lab-pad__key ${lit === n ? 'is-lit' : ''}`}
                        style={{ '--tint': shot.hex }}
                        onPointerDown={() => fire(n)}
                        aria-label={`Pad ${n + 1}: ${shot.artist}`}
                    >
                        <img src={stillSrc(shot)} alt="" loading="lazy" />
                        <video
                            ref={(el) => { videoRefs.current[n] = el }}
                            src={clipSrc(shot)}
                            muted playsInline preload="auto"
                            className="lab-pad__keyvid"
                        />
                        <span className="lab-pad__label">
                            <b>{KEYS[n].toUpperCase()}</b>
                            <i>{shot.artist}</i>
                        </span>
                    </button>
                ))}
            </div>

            <div className="lab-bar">
                <button type="button"
                    className={`lab-btn ${recording ? 'lab-btn--rec' : ''}`}
                    onClick={toggleRec}>
                    {recording ? `● Recording (${sequence.length})` : '● Rec'}
                </button>
                {playingSeq
                    ? <button type="button" className="lab-btn" onClick={stopSequence}>Stop</button>
                    : <button type="button" className="lab-btn lab-btn--hot"
                        onClick={playSequence} disabled={!sequence.length}>
                        Play ({sequence.length})
                      </button>}
                <button type="button" className="lab-btn"
                    onClick={() => setSequence([])} disabled={!sequence.length}>Clear</button>
                <span className="lab-bar__group">
                    {[0, 1, 2].map((b) => (
                        <button type="button" key={b}
                            className={`lab-chip ${bank === b ? 'is-on' : ''}`}
                            onClick={() => setBank(b)}>bank {b + 1}</button>
                    ))}
                </span>
                <span className="lab-bar__read">
                    {sound ? 'sound armed' : 'sound off — turn it on, top right'}
                </span>
            </div>
        </div>
    )
}
