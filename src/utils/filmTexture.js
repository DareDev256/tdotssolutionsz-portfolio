/**
 * filmTexture — Three.js texture loading that prefers the studio's own frames.
 *
 * The 3D routes (`/videos`, `/oldvideopage`) render every card as a texture
 * built from a URL, so they can't use the <FilmStill> element-level fallback.
 * This is the loader-level equivalent: try the locally-extracted poster first,
 * fall back to YouTube if it isn't there.
 *
 * It matters most here. The hub shows six cards; these routes show all 101, so
 * this is where the distributor watermarks (6IXBUZZ, WORLDSTARHIPHOP, VEVO)
 * burned into YouTube's thumbnails are most visible.
 *
 * @module utils/filmTexture
 */
import { getPosterUrl, getThumbnailUrl } from './youtube'

/**
 * Load a card texture, preferring `/posters/{id}.jpg`.
 *
 * Returns the Texture synchronously (Three.js populates `.image` when the
 * request resolves). If the poster is missing, the YouTube thumbnail is loaded
 * into the same Texture and flagged for upload, so callers never need to know
 * which source won.
 *
 * @param {typeof import('three')} THREE  the Three namespace the caller uses
 * @param {string} videoId
 * @param {(tex: import('three').Texture) => void} [configure] applied once up front
 * @returns {import('three').Texture}
 */
export function loadFilmTexture(THREE, videoId, configure) {
    const loader = new THREE.TextureLoader()
    const fallbackUrl = getThumbnailUrl(videoId, 'hqdefault')
    const posterUrl = getPosterUrl(videoId)

    // No valid id — go straight to whatever the fallback resolves to.
    const primary = posterUrl || fallbackUrl

    const tex = loader.load(
        primary,
        undefined,
        undefined,
        () => {
            if (!fallbackUrl || primary === fallbackUrl) return
            loader.load(fallbackUrl, (fallbackTex) => {
                tex.image = fallbackTex.image
                tex.needsUpdate = true
            })
        }
    )

    if (configure) configure(tex)
    return tex
}
