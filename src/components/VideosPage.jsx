/**
 * VideosPage — /videos. Every film, findable.
 *
 * v6.12.0 replaced the WebGL tunnel (VideoTunnelApp, v5.6.0–v6.11.0) at James's
 * call: the tunnel was a flight you had to take to find a film. This page is
 * the finder alone: search, artist chips, Top/New, a readable grid, and the same
 * TheaterMode player whose next/prev follows the filtered list.
 *
 * All state is in the URL (?q ?artist ?sort ?v) and is updated key by key, so
 * opening and closing a film never wipes the visitor's filter. (The shared
 * useVideoDeepLink hook replaces the whole query string; it is deliberately
 * not used here.)
 *
 * @module components/VideosPage
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { VIDEOS, PORTFOLIO_STATS } from '../utils/videoData'
import { formatViews } from '../utils/formatters'
import { isValidYouTubeId } from '../utils/youtube'
import { TheaterMode } from './ui'
import useClosingGuard from '../hooks/useClosingGuard'
import { FinderBar, FinderGrid, filterVideos, topArtists } from './VideoFinder'

const CATALOG = VIDEOS.map((v) => ({ ...v, url: `https://www.youtube.com/watch?v=${v.youtubeId}`, color: '#1a1a1a' }))

export default function VideosPage() {
    const [params, setParams] = useSearchParams()
    const q = params.get('q') || ''
    const artist = params.get('artist') || null
    const sort = params.get('sort') === 'new' ? 'new' : 'top'

    const setParam = useCallback((patch) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev)
            for (const [k, v] of Object.entries(patch)) {
                if (v == null || v === '') next.delete(k); else next.set(k, v)
            }
            return next
        }, { replace: true })
    }, [setParams])

    const artists = useMemo(() => topArtists(CATALOG, 12), [])
    const list = useMemo(() => filterVideos(CATALOG, { q, artist, sort }), [q, artist, sort])

    // ── player ──
    const [active, setActive] = useState(null)
    const guard = useClosingGuard(300)
    const open = useCallback((video) => {
        setActive(video)
        guard.open()
        setParam({ v: video.youtubeId })
    }, [guard, setParam])
    const close = useCallback(() => {
        guard.close()
        setParam({ v: null })
    }, [guard, setParam])

    // deep link: ?v=<id> opens that film once, on arrival
    const linked = useRef(false)
    useEffect(() => {
        if (linked.current) return
        linked.current = true
        const id = params.get('v')
        if (!id || !isValidYouTubeId(id)) return
        const found = CATALOG.find((v) => v.youtubeId === id)
        if (found) { setActive(found); guard.open() }
    }, [params, guard])

    const queue = list.length ? list : CATALOG
    const index = active ? queue.findIndex((v) => v.youtubeId === active.youtubeId) : -1
    const step = useCallback((d) => {
        if (index < 0 || !queue.length) return
        const next = queue[(index + d + queue.length) % queue.length]
        setActive(next)
        setParam({ v: next.youtubeId })
    }, [index, queue, setParam])

    useEffect(() => {
        document.title = 'Music Videos — TdotsSolutionsz'
    }, [])

    return (
        <main className="vf-page">
            {!guard.isOpen && (
                <FinderBar
                    q={q} setQ={(v) => setParam({ q: v })}
                    artist={artist} setArtist={(a) => setParam({ artist: a })}
                    sort={sort} setSort={(v) => setParam({ sort: v === 'top' ? null : v })}
                    artists={artists}
                    shown={list.length} total={CATALOG.length}
                    home={<Link to="/" className="vf-home" aria-label="TdotsSolutionsz home"><img src="/brand/mark.svg" alt="" /></Link>}
                />
            )}

            <FinderGrid
                videos={list}
                onOpen={open}
                onClear={() => setParam({ q: null, artist: null })}
                heading={
                    <header className="vf-head">
                        <h1>Music Videos</h1>
                        <p>{PORTFOLIO_STATS.totalVideos} films · {PORTFOLIO_STATS.totalArtists} artists · {formatViews(PORTFOLIO_STATS.totalViews)} plays · directed in Toronto</p>
                    </header>
                }
            />

            <TheaterMode
                project={active}
                audioEnabled={false}
                isOpen={guard.isOpen}
                isClosing={guard.isClosing}
                onClose={close}
                onNext={() => step(1)}
                onPrev={() => step(-1)}
                hasNext={queue.length > 1}
                hasPrev={queue.length > 1}
                queuePosition={index >= 0 ? index + 1 : null}
                queueTotal={queue.length}
                nextVideoTitle={index >= 0 && queue.length > 1 ? queue[(index + 1) % queue.length]?.title : null}
            />
        </main>
    )
}
