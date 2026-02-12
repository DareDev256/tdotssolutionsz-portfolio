import { useCallback, useMemo } from 'react'

/**
 * Circular next/prev navigation over a video list.
 *
 * @param {object|null} currentVideo - Currently active video (must have .id)
 * @param {Array} videoList - Ordered array of videos to navigate through
 * @param {(video: object) => void} setVideo - Setter to change the active video
 * @returns {{ handleNext: () => void, handlePrev: () => void, currentIndex: number }}
 */
export default function useVideoNavigation(currentVideo, videoList, setVideo) {
    const currentIndex = useMemo(() => {
        if (!currentVideo || !videoList.length) return -1
        return videoList.findIndex(v => v.id === currentVideo.id)
    }, [currentVideo, videoList])

    const handleNext = useCallback(() => {
        if (currentIndex < 0 || !videoList.length) return
        setVideo(videoList[(currentIndex + 1) % videoList.length])
    }, [currentIndex, videoList, setVideo])

    const handlePrev = useCallback(() => {
        if (currentIndex < 0 || !videoList.length) return
        setVideo(videoList[(currentIndex - 1 + videoList.length) % videoList.length])
    }, [currentIndex, videoList, setVideo])

    return { handleNext, handlePrev, currentIndex }
}
