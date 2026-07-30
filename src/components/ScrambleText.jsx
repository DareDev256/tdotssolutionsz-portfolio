/**
 * ScrambleText — decode-on-reveal for the hub's tracked labels.
 *
 * Each character starts as random glyph noise and resolves left-to-right, so a
 * label reads as a signal locking in rather than as text fading up. It suits
 * the scroll-cinema's broadcast register and costs one rAF loop per label.
 *
 * Only fires when the element scrolls into view, and only once. Under
 * prefers-reduced-motion it renders the final text immediately with no
 * animation at all — the effect is decorative and must never gate the content.
 *
 * @module components/ScrambleText
 */
import React, { useEffect, useRef, useState } from 'react'

/** Glyphs the noise is drawn from. Kept to shapes that read as "signal". */
const GLYPHS = '▚▞█▓▒░/\\|<>*+=-_:.#%&$@0123456789'

/**
 * @param {Object}  props
 * @param {string}  props.text            final text
 * @param {string}  [props.as]            element to render (default 'span')
 * @param {number}  [props.speed]         ms per resolve step
 * @param {number}  [props.settle]        extra scramble frames each char endures
 * @param {string}  [props.className]
 */
export default function ScrambleText({
    text,
    as: Tag = 'span',
    speed = 26,
    settle = 3,
    className = '',
    ...rest
}) {
    const ref = useRef(null)
    const [out, setOut] = useState(text)
    const startedRef = useRef(false)

    useEffect(() => {
        const node = ref.current
        if (!node) return

        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        if (reduced || typeof IntersectionObserver === 'undefined') {
            setOut(text)
            return
        }

        let raf = null
        let timer = null

        const runScramble = () => {
            const chars = [...text]
            // Each character gets a frame index at which it locks in.
            const lockAt = chars.map((c, i) => (c === ' ' ? 0 : i + settle))
            const total = Math.max(...lockAt, 0) + 1
            let frame = 0

            const step = () => {
                setOut(
                    chars
                        .map((c, i) => {
                            if (c === ' ') return ' '
                            if (frame >= lockAt[i]) return c
                            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
                        })
                        .join('')
                )
                frame += 1
                if (frame <= total) timer = setTimeout(() => { raf = requestAnimationFrame(step) }, speed)
                else setOut(text)
            }
            step()
        }

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !startedRef.current) {
                    startedRef.current = true
                    runScramble()
                    io.unobserve(node)
                }
            },
            { threshold: 0.4 }
        )
        io.observe(node)

        return () => {
            io.disconnect()
            clearTimeout(timer)
            cancelAnimationFrame(raf)
        }
    }, [text, speed, settle])

    return (
        <Tag ref={ref} className={className} {...rest}>
            {/* The animated glyph noise is decoration; assistive tech gets the real text. */}
            <span aria-hidden="true">{out}</span>
            <span className="sr-only">{text}</span>
        </Tag>
    )
}
