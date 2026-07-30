/**
 * useShots — load the shared shot pool.
 *
 * The pool is cut by scripts/build-shot-pool.mjs and lives in public/shots/.
 * It's fetched rather than imported because it's data that grows with the
 * catalogue (90 shots today, ~11,000 if all 101 films are processed) and has no
 * business being in the JS bundle.
 *
 * All three lab demos share one pool. That's the thesis: the material is fixed,
 * only the instrument changes.
 *
 * @module components/lab/useShots
 */
import { useEffect, useState } from 'react'

/**
 * @typedef {Object} Shot
 * @property {string} id       e.g. "u3O5PKN9vCQ-004"
 * @property {string} film     YouTube id of the source film
 * @property {string} artist
 * @property {string} title
 * @property {string} year
 * @property {number} views
 * @property {number} start    seconds into the source film
 * @property {number} len      shot length in seconds
 * @property {string} hex      mean colour
 * @property {number} hue      0-360
 * @property {number} sat      0-100
 * @property {number} luma     0-255
 * @property {'day'|'night'} light
 */

/** @returns {{shots: Shot[], loading: boolean, error: string|null}} */
export function useShots() {
    const [state, setState] = useState({ shots: [], loading: true, error: null })

    useEffect(() => {
        let cancelled = false
        fetch('/shots/manifest.json')
            .then((r) => {
                if (!r.ok) throw new Error(`manifest ${r.status}`)
                return r.json()
            })
            .then((m) => {
                if (!cancelled) setState({ shots: m.shots || [], loading: false, error: null })
            })
            .catch((e) => {
                if (!cancelled) setState({ shots: [], loading: false, error: e.message })
            })
        return () => { cancelled = true }
    }, [])

    return state
}

/** Asset paths for a shot. */
export const clipSrc = (shot) => `/shots/${shot.id}.mp4`
export const stillSrc = (shot) => `/shots/${shot.id}.jpg`

/**
 * Deterministic PRNG (mulberry32) so a given seed always produces the same
 * edit. That makes a Recut shareable — the seed is in the URL — and makes the
 * demo debuggable, which Math.random would not.
 */
export function rng(seed) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/**
 * Order shots for an edit.
 *
 * Not a plain shuffle: a random order clusters shots from the same film, which
 * reads as an accident rather than a cut. This deals the pool round-robin
 * across films first, so consecutive shots almost always come from different
 * artists — the collision between two eras is the whole point of a recut.
 *
 * @param {Shot[]} shots
 * @param {number} seed
 * @param {number} count
 * @returns {Shot[]}
 */
export function buildEdit(shots, seed, count) {
    const rand = rng(seed)
    const byFilm = new Map()
    for (const s of shots) {
        if (!byFilm.has(s.film)) byFilm.set(s.film, [])
        byFilm.get(s.film).push(s)
    }
    // Shuffle within each film.
    for (const list of byFilm.values()) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1))
            ;[list[i], list[j]] = [list[j], list[i]]
        }
    }
    const decks = [...byFilm.values()]
    const edit = []
    let i = 0
    while (edit.length < count && decks.some((d) => d.length)) {
        const deck = decks[i % decks.length]
        if (deck.length) edit.push(deck.pop())
        i++
    }
    return edit
}
