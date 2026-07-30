/**
 * Archive — concept 2: every shot you've ever cut, searchable.
 *
 * Not a portfolio grid. A shot database: every shot from the catalogue on one
 * screen, filterable by light, colour, artist and year, and — the part that
 * makes it read as an archive rather than a gallery — sortable *by hue*, so the
 * wall reorders itself into a spectrum of thirteen years of footage.
 *
 * Hovering a tile plays that shot in place. The tile is the still; the video is
 * only attached on hover, so a wall of thousands costs nothing until touched.
 *
 * @module components/lab/Archive
 */
import React, { useMemo, useState } from 'react'
import { clipSrc, stillSrc } from './useShots'

/** Coarse hue buckets. Named for what they actually are in this footage. */
const HUES = [
    { key: 'red', label: 'Red', test: (h, s) => s > 18 && (h < 20 || h >= 340) },
    { key: 'amber', label: 'Amber', test: (h, s) => s > 18 && h >= 20 && h < 65 },
    { key: 'green', label: 'Green', test: (h, s) => s > 18 && h >= 65 && h < 165 },
    { key: 'blue', label: 'Blue', test: (h, s) => s > 18 && h >= 165 && h < 260 },
    { key: 'violet', label: 'Violet', test: (h, s) => s > 18 && h >= 260 && h < 340 },
    { key: 'mono', label: 'Mono', test: (h, s) => s <= 18 }
]

function Tile({ shot, onOpen }) {
    const [hot, setHot] = useState(false)
    return (
        <button
            type="button"
            className="lab-tile"
            style={{ '--tint': shot.hex }}
            onPointerEnter={(e) => { if (e.pointerType !== 'touch') setHot(true) }}
            onPointerLeave={() => setHot(false)}
            onClick={() => onOpen(shot)}
            aria-label={`${shot.artist} — ${shot.year}, ${shot.light} shot`}
        >
            <img src={stillSrc(shot)} alt="" loading="lazy" decoding="async" />
            {hot && (
                <video
                    className="lab-tile__clip"
                    src={clipSrc(shot)}
                    autoPlay muted loop playsInline
                    onCanPlay={(e) => e.currentTarget.classList.add('is-on')}
                />
            )}
            <span className="lab-tile__meta">
                <b>{shot.artist}</b>
                <i>{shot.year}</i>
            </span>
        </button>
    )
}

export default function Archive({ shots }) {
    const [light, setLight] = useState('all')
    const [hue, setHue] = useState('all')
    const [artist, setArtist] = useState('all')
    const [spectrum, setSpectrum] = useState(false)
    const [open, setOpen] = useState(null)

    const artists = useMemo(
        () => [...new Set(shots.map((s) => s.artist))].sort(),
        [shots]
    )

    const filtered = useMemo(() => {
        let out = shots
        if (light !== 'all') out = out.filter((s) => s.light === light)
        if (artist !== 'all') out = out.filter((s) => s.artist === artist)
        if (hue !== 'all') {
            const bucket = HUES.find((h) => h.key === hue)
            if (bucket) out = out.filter((s) => bucket.test(s.hue, s.sat))
        }
        out = [...out]
        if (spectrum) {
            // Mono to one end so the colour ramp isn't broken by greys.
            out.sort((a, b) => {
                const am = a.sat <= 18 ? 1 : 0
                const bm = b.sat <= 18 ? 1 : 0
                if (am !== bm) return am - bm
                return a.hue - b.hue
            })
        } else {
            out.sort((a, b) => (a.year || '').localeCompare(b.year || '') || a.id.localeCompare(b.id))
        }
        return out
    }, [shots, light, hue, artist, spectrum])

    return (
        <div className="lab-archive">
            <div className="lab-bar lab-bar--wrap">
                <span className="lab-bar__group">
                    {['all', 'day', 'night'].map((k) => (
                        <button type="button" key={k}
                            className={`lab-chip ${light === k ? 'is-on' : ''}`}
                            onClick={() => setLight(k)}>{k}</button>
                    ))}
                </span>

                <span className="lab-bar__group">
                    <button type="button"
                        className={`lab-chip ${hue === 'all' ? 'is-on' : ''}`}
                        onClick={() => setHue('all')}>any colour</button>
                    {HUES.map((h) => {
                        const n = shots.filter((s) => h.test(s.hue, s.sat)).length
                        return (
                            <button type="button" key={h.key}
                                className={`lab-chip lab-chip--hue ${hue === h.key ? 'is-on' : ''}`}
                                onClick={() => setHue(hue === h.key ? 'all' : h.key)}
                                disabled={!n}
                                title={`${h.label} — ${n} shots`}>
                                <i className={`lab-swatch lab-swatch--${h.key}`} />
                                {h.label}
                            </button>
                        )
                    })}
                </span>

                <select
                    className="lab-select"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    aria-label="Filter by artist"
                >
                    <option value="all">all artists</option>
                    {artists.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>

                <button type="button"
                    className={`lab-btn ${spectrum ? 'lab-btn--hot' : ''}`}
                    onClick={() => setSpectrum((v) => !v)}>
                    {spectrum ? 'Sorted by colour' : 'Sort by colour'}
                </button>

                <span className="lab-bar__read">
                    {filtered.length} of {shots.length} shots
                </span>
            </div>

            <div className="lab-wall">
                {filtered.map((s) => <Tile key={s.id} shot={s} onOpen={setOpen} />)}
                {!filtered.length && (
                    <p className="lab-empty">No shots match that combination.</p>
                )}
            </div>

            {open && (
                <div className="lab-lightbox" role="dialog" aria-modal="true"
                    onClick={() => setOpen(null)}>
                    <video src={clipSrc(open)} autoPlay loop playsInline controls />
                    <div className="lab-lightbox__meta">
                        <b>{open.artist}</b>
                        <span>{open.title.replace(`${open.artist} - `, '')}</span>
                        <span className="lab-lightbox__tc">
                            {open.year} · {String(Math.floor(open.start / 60)).padStart(2, '0')}:
                            {String(Math.floor(open.start % 60)).padStart(2, '0')} in ·{' '}
                            {open.len.toFixed(1)}s · {open.light} · {open.hex}
                        </span>
                    </div>
                    <button type="button" className="lab-lightbox__x" aria-label="Close">✕</button>
                </div>
            )}
        </div>
    )
}
