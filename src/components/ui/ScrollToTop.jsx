import { useState, useEffect, useCallback } from 'react'

const SHOW_THRESHOLD = 400 // px scrolled before FAB appears
const CIRCLE_RADIUS = 18
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

/**
 * Floating scroll-to-top button with SVG progress ring.
 * Shows scroll depth as a neon ring and smoothly scrolls to top on click.
 */
export default function ScrollToTop() {
    const [visible, setVisible] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let ticking = false
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight
                    setVisible(scrollY > SHOW_THRESHOLD)
                    setProgress(docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0)
                    ticking = false
                })
                ticking = true
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    const dashOffset = CIRCUMFERENCE * (1 - progress)

    return (
        <button
            className={`scroll-to-top ${visible ? 'scroll-to-top--visible' : ''}`}
            onClick={scrollToTop}
            aria-label={`Scroll to top — ${Math.round(progress * 100)}% scrolled`}
            title="Back to top"
        >
            <svg className="scroll-to-top__ring" viewBox="0 0 44 44" aria-hidden="true">
                <circle
                    className="scroll-to-top__track"
                    cx="22" cy="22" r={CIRCLE_RADIUS}
                    fill="none"
                    strokeWidth="2.5"
                />
                <circle
                    className="scroll-to-top__progress"
                    cx="22" cy="22" r={CIRCLE_RADIUS}
                    fill="none"
                    strokeWidth="2.5"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </svg>
            <svg className="scroll-to-top__arrow" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
    )
}
