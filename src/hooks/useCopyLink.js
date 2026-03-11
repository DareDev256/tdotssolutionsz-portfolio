import { useState, useCallback, useEffect, useRef } from 'react'
import { getShareUrl } from '../utils/youtube'

/**
 * Copy a video's share URL to clipboard with a 2-second "copied" indicator.
 * Resets the copied state when the video changes.
 *
 * Cleans up the auto-reset timer on unmount and on rapid re-copies so the
 * indicator always stays visible for a full 2 seconds from the last copy.
 *
 * @param {object|null} video - Video object to generate a share link for
 * @returns {{ copied: boolean, handleCopyLink: () => void }}
 */
export default function useCopyLink(video) {
    const [copied, setCopied] = useState(false)
    const timerRef = useRef(null)

    // Reset when video changes
    useEffect(() => { setCopied(false) }, [video])

    // Cleanup on unmount — prevents setState on dead component
    useEffect(() => {
        return () => { clearTimeout(timerRef.current) }
    }, [])

    const handleCopyLink = useCallback(() => {
        if (!video) return
        navigator.clipboard.writeText(getShareUrl(video)).then(() => {
            // Clear any pending reset so rapid re-copies restart the 2s window
            clearTimeout(timerRef.current)
            setCopied(true)
            timerRef.current = setTimeout(() => setCopied(false), 2000)
        })
    }, [video])

    return { copied, handleCopyLink }
}
