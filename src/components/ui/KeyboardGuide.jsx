import { useEffect, useCallback } from 'react'
import './KeyboardGuide.css'

const SHORTCUTS = [
    { keys: ['←', '→'], action: 'Switch lanes', context: 'Desktop 3D' },
    { keys: ['F'], action: 'Toggle theater mode', context: 'Desktop' },
    { keys: ['Esc'], action: 'Close overlay', context: 'Global' },
    { keys: ['←', '→'], action: 'Previous / next video', context: 'Theater' },
    { keys: ['Scroll'], action: 'Drive through city', context: 'Desktop 3D' },
    { keys: ['Enter', 'Space'], action: 'Play selected video', context: 'Card focus' },
    { keys: ['S'], action: 'Shuffle — random video', context: 'Desktop' },
    { keys: ['?'], action: 'Toggle this guide', context: 'Global' },
]

export function KeyboardGuide({ isOpen, onClose }) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        if (!isOpen) return
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    return (
        <div className="kbd-guide-overlay" onClick={onClose}>
            <div className="kbd-guide-panel" onClick={e => e.stopPropagation()}>
                <button className="kbd-guide-close" onClick={onClose} aria-label="Close keyboard guide">✕</button>
                <h2 className="kbd-guide-title">KEYBOARD SHORTCUTS</h2>
                <div className="kbd-guide-list">
                    {SHORTCUTS.map((s, i) => (
                        <div key={i} className="kbd-guide-row">
                            <span className="kbd-guide-keys">
                                {s.keys.map((k, j) => (
                                    <span key={j}>
                                        {j > 0 && <span className="kbd-guide-sep">/</span>}
                                        <kbd>{k}</kbd>
                                    </span>
                                ))}
                            </span>
                            <span className="kbd-guide-action">{s.action}</span>
                            <span className="kbd-guide-context">{s.context}</span>
                        </div>
                    ))}
                </div>
                <p className="kbd-guide-hint">Press <kbd>?</kbd> anytime to toggle this guide</p>
            </div>
        </div>
    )
}
