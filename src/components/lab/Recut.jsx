/**
 * Recut — concept 1: a different film every visit.
 *
 * Sequences shots drawn from across the catalogue into a continuous film, cut
 * on a tempo grid. The edit is generated from a seed, so every visitor gets a
 * different one, the same seed always reproduces the same cut, and the seed
 * lives in the URL so an edit can be shared.
 *
 * The gapless playback is the load-bearing part: two <video> elements
 * ping-pong, so while A is on screen B has already fetched, decoded and seeked
 * to its first frame. A single element re-sourced per shot stalls visibly for
 * 60-200ms on every cut, which destroys the illusion that this is one film.
 *
 * @module components/lab/Recut
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildEdit, clipSrc } from './useShots'

/** Cut lengths in seconds. TIGHT is a montage; LOOSE lets shots breathe. */
const CUT = { tight: 0.55, medium: 1.1, loose: 0 } // 0 = play the shot's full length
const EDIT_LENGTH = 48

export default function Recut({ shots, sound }) {
    const [seed, setSeed] = useState(() => {
        const fromUrl = Number(new URLSearchParams(location.search).get('cut'))
        return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 20260731
    })
    const [pace, setPace] = useState('medium')
    const [playing, setPlaying] = useState(false)
    const [index, setIndex] = useState(0)

    const edit = useMemo(
        () => buildEdit(shots, seed, EDIT_LENGTH),
        [shots, seed]
    )

    // Two decks. `active` says which one is on screen.
    const deckA = useRef(null)
    const deckB = useRef(null)
    const [active, setActive] = useState(0)
    const timerRef = useRef(null)
    const indexRef = useRef(0)
    const activeRef = useRef(0)

    useEffect(() => { indexRef.current = index }, [index])
    useEffect(() => { activeRef.current = active }, [active])

    const deckAt = (n) => (n === 0 ? deckA.current : deckB.current)

    /** Load a shot into the off-screen deck and park it on its first frame. */
    const preload = useCallback((deckIdx, shot) => {
        const el = deckAt(deckIdx)
        if (!el || !shot) return
        el.src = clipSrc(shot)
        el.load()
    }, [])

    const cutLength = useCallback((shot) => {
        const fixed = CUT[pace]
        return fixed > 0 ? Math.min(fixed, shot.len) : shot.len
    }, [pace])

    const stop = useCallback(() => {
        clearTimeout(timerRef.current)
        ;[deckA.current, deckB.current].forEach((el) => el?.pause())
        setPlaying(false)
    }, [])

    /** Show `n`'s deck, start it, schedule the swap to the next shot. */
    const advance = useCallback(() => {
        const i = indexRef.current
        const shot = edit[i]
        if (!shot) { stop(); return }

        const showing = activeRef.current
        const el = deckAt(showing)
        if (!el) return

        el.muted = !sound
        el.currentTime = 0
        el.play?.().catch(() => {})

        // Fetch the shot after next into the deck we are about to reveal.
        const nextShot = edit[i + 1]
        if (nextShot) preload(showing === 0 ? 1 : 0, nextShot)

        timerRef.current = setTimeout(() => {
            const ni = indexRef.current + 1
            if (ni >= edit.length) { setIndex(0); indexRef.current = 0 }
            else { setIndex(ni); indexRef.current = ni }
            const nd = showing === 0 ? 1 : 0
            setActive(nd)
            activeRef.current = nd
            advance()
        }, cutLength(shot) * 1000)
    }, [edit, sound, preload, cutLength, stop])

    const start = useCallback(() => {
        clearTimeout(timerRef.current)
        setPlaying(true)
        preload(0, edit[0])
        preload(1, edit[1])
        setActive(0)
        activeRef.current = 0
        setIndex(0)
        indexRef.current = 0
        // Give the first deck a moment to have a frame before we reveal it.
        setTimeout(advance, 180)
    }, [edit, preload, advance])

    useEffect(() => () => clearTimeout(timerRef.current), [])

    // Follow the global sound arm mid-playback.
    useEffect(() => {
        ;[deckA.current, deckB.current].forEach((el) => { if (el) el.muted = !sound })
    }, [sound])

    const recut = () => {
        const next = Math.floor(Math.random() * 9_000_000) + 1000
        stop()
        setSeed(next)
        const url = new URL(location.href)
        url.searchParams.set('cut', String(next))
        history.replaceState(null, '', url)
    }

    const current = edit[index]

    return (
        <div className="lab-recut">
            <div className="lab-recut__stage">
                <video
                    ref={deckA}
                    className={`lab-recut__deck ${active === 0 ? 'is-on' : ''}`}
                    playsInline muted preload="auto"
                />
                <video
                    ref={deckB}
                    className={`lab-recut__deck ${active === 1 ? 'is-on' : ''}`}
                    playsInline muted preload="auto"
                />

                {!playing && (
                    <button type="button" className="lab-recut__play" onClick={start}>
                        <span className="lab-recut__playdot" />
                        Run the cut
                    </button>
                )}

                {current && playing && (
                    <div className="lab-recut__lower">
                        <span className="lab-recut__artist">{current.artist}</span>
                        <span className="lab-recut__title">
                            {current.title.replace(`${current.artist} - `, '')} · {current.year}
                        </span>
                    </div>
                )}

                <div className="lab-recut__seed">CUT #{seed}</div>
            </div>

            <div className="lab-recut__strip" aria-hidden="true">
                {edit.map((s, i) => (
                    <i
                        key={s.id + i}
                        className={i === index ? 'is-now' : i < index ? 'is-past' : ''}
                        style={{ background: s.hex }}
                    />
                ))}
            </div>

            <div className="lab-bar">
                <button type="button" className="lab-btn lab-btn--hot" onClick={recut}>
                    Re-cut
                </button>
                {playing
                    ? <button type="button" className="lab-btn" onClick={stop}>Stop</button>
                    : <button type="button" className="lab-btn" onClick={start}>Run</button>}
                <span className="lab-bar__group">
                    {['tight', 'medium', 'loose'].map((p) => (
                        <button
                            type="button"
                            key={p}
                            className={`lab-chip ${pace === p ? 'is-on' : ''}`}
                            onClick={() => setPace(p)}
                        >
                            {p}
                        </button>
                    ))}
                </span>
                <span className="lab-bar__read">
                    shot {index + 1}/{edit.length} · {edit.length} cuts from{' '}
                    {new Set(edit.map((s) => s.film)).size} films
                </span>
            </div>
        </div>
    )
}
