import { useState, useCallback, useEffect } from 'react'
import { getShareUrl } from '../utils/youtube'

/**
 * Copy a video's share URL to clipboard with a 2-second "copied" indicator.
 * Resets the copied state when the video changes.
 *
 * @param {object|null} video - Video object to generate a share link for
 * @returns {{ copied: boolean, handleCopyLink: () => void }}
 */
export default function useCopyLink(video) {
    const [copied, setCopied] = useState(false)

    // Reset when video changes
    useEffect(() => { setCopied(false) }, [video])

    const handleCopyLink = useCallback(() => {
        if (!video) return
        navigator.clipboard.writeText(getShareUrl(video)).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [video])

    return { copied, handleCopyLink }
}
