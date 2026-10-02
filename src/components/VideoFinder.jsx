/**
 * VideoFinder — the plain way into /videos.
 *
 * A fixed bar carries the home mark, search, artist chips and a Top/New sort.
 * The grid is a readable list of every film (still, title, artist, views,
 * year) that opens TheaterMode. Used by VideosPage (/videos).
 *
 * @module components/VideoFinder
 */
import { useMemo } from 'react'
import FilmStill from './FilmStill'
import { formatViews } from '../utils/formatters'
import './VideoFinder.css'

/** Case/accent-insensitive match on title + artist. */
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function filterVideos(videos, { q = '', artist = null, sort = 'top' } = {}) {
    const needle = norm(q.trim())
    const out = videos.filter((v) =>
        (!artist || v.artist === artist) &&
        (!needle || norm(`${v.title} ${v.artist}`).includes(needle))
    )
    return out.sort(sort === 'new'
        ? (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)
        : (a, b) => b.viewCount - a.viewCount)
}

/** Artists with the most films first; the chip row shows the top N. */
export function topArtists(videos, n = 10) {
    const counts = new Map()
    for (const v of videos) counts.set(v.artist, (counts.get(v.artist) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([a]) => a)
}

export function FinderBar({ q, setQ, artist, setArtist, sort, setSort, artists, shown, total, home = null }) {
    return (
        <div className="vf-bar" role="search">
            <div className="vf-row">
                {home}
                <label className="vf-search">
                    <span className="vf-sr">Search films</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={`Search ${total} films`}
                        aria-label={`Search ${total} films or artists`}
                        autoComplete="off"
                        enterKeyHint="search"
                    />
                </label>
            </div>
            <div className="vf-row vf-row--chips">
                <div className="vf-chips" role="group" aria-label="Artist">
                    <button type="button" aria-pressed={!artist} onClick={() => setArtist(null)}>All</button>
                    {artists.map((a) => (
                        <button key={a} type="button" aria-pressed={artist === a} onClick={() => setArtist(artist === a ? null : a)}>{a}</button>
                    ))}
                </div>
                <div className="vf-sort" role="group" aria-label="Sort">
                    <button type="button" aria-pressed={sort === 'top'} onClick={() => setSort('top')}>Top</button>
                    <button type="button" aria-pressed={sort === 'new'} onClick={() => setSort('new')}>New</button>
                </div>
            </div>
            <p className="vf-count" aria-live="polite">
                {shown === total ? `${total} films` : `${shown} of ${total} films`}
                {artist ? ` · ${artist}` : ''}
            </p>
        </div>
    )
}

export function FinderGrid({ videos, onOpen, onClear, heading = null }) {
    const cards = useMemo(() => videos.map((v) => (
        <li key={v.youtubeId}>
            <button type="button" className="vf-card" onClick={() => onOpen(v)}>
                <span className="vf-still">
                    <FilmStill videoId={v.youtubeId} alt="" />
                    <span className="vf-play" aria-hidden="true" />
                </span>
                <span className="vf-title">{v.title}</span>
                <span className="vf-meta">
                    {v.artist} · {formatViews(v.viewCount)} views{v.uploadDate ? ` · ${String(v.uploadDate).slice(0, 4)}` : ''}
                </span>
            </button>
        </li>
    )), [videos, onOpen])

    return (
        <div className="vf-grid-wrap">
            {heading}
            {videos.length
                ? <ul className="vf-grid" aria-label="Music videos">{cards}</ul>
                : <div className="vf-empty"><p>No film matches that.</p><button type="button" onClick={onClear}>Clear search</button></div>}
        </div>
    )
}
