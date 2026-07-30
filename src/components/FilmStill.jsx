/**
 * FilmStill — an <img> that prefers the studio's own poster frame.
 *
 * Resolution order:
 *   1. /posters/{id}.jpg   clean frame cut from the film (no distributor
 *                          watermark, letterbox bars removed, exposure-scored)
 *   2. maxresdefault.jpg   YouTube's best, when it exists
 *   3. hqdefault.jpg       always exists, the guaranteed floor
 *
 * The stub trap: YouTube answers a missing `maxresdefault.jpg` with a 120x90
 * grey placeholder and HTTP 200, not a 404. `onError` therefore never fires and
 * the card silently renders a grey box. The only reliable signal is the decoded
 * size, so we check `naturalWidth` on load as well as handling onError.
 *
 * @module components/FilmStill
 */
import { useEffect, useState } from 'react'
import { getPosterUrl, getThumbnailUrl } from '../utils/youtube'

/**
 * @param {Object} props
 * @param {string} props.videoId
 * @param {string} props.alt
 * @param {string} [props.className]
 * @param {'lazy'|'eager'} [props.loading]
 */
export default function FilmStill({ videoId, alt, className = '', loading = 'lazy', ...rest }) {
    const chain = [
        getPosterUrl(videoId),
        getThumbnailUrl(videoId, 'maxresdefault'),
        getThumbnailUrl(videoId, 'hqdefault')
    ].filter(Boolean)

    const [step, setStep] = useState(0)

    // A new videoId restarts the chain.
    useEffect(() => { setStep(0) }, [videoId])

    const next = () => setStep((i) => (i < chain.length - 1 ? i + 1 : i))

    if (!chain.length) return null

    return (
        <img
            src={chain[step]}
            alt={alt}
            className={className}
            loading={loading}
            decoding="async"
            onError={next}
            onLoad={(e) => {
                // 120x90 is YouTube's "no thumbnail" stub, served with a 200.
                if (e.currentTarget.naturalWidth <= 120) next()
            }}
            {...rest}
        />
    )
}
