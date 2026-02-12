import { useCallback, useMemo } from 'react'

/**
 * Find the index of currentVideo in videoList by id.
 * @internal Exported for testing
 * @returns {number} Index, or -1 if not found / empty list
 */
export function findVideoIndex(currentVideo, videoList) {
    if (!currentVideo || !videoList.length) return -1
    return videoList.findIndex(v => v.id === currentVideo.id)
}

/**
 * Circular next index: wraps from last → first.
 * @internal Exported for testing
 * @returns {number} Next index, or -1 if navigation impossible
 */
export function getNextIndex(currentIndex, length) {
    if (currentIndex < 0 || !length) return -1
    return (currentIndex + 1) % length
}

/**
 * Circular prev index: wraps from first → last.
 * @internal Exported for testing
 * @returns {number} Previous index, or -1 if navigation impossible
 */
export function getPrevIndex(currentIndex, length) {
    if (currentIndex < 0 || !length) return -1
    return (currentIndex - 1 + length) % length
}

/**
 * Circular next/prev navigation over a video list.
 *
 * @param {object|null} currentVideo - Currently active video (must have .id)
 * @param {Array} videoList - Ordered array of videos to navigate through
 * @param {(video: object) => void} setVideo - Setter to change the active video
 * @returns {{ handleNext: () => void, handlePrev: () => void, currentIndex: number }}
 */
export default function useVideoNavigation(currentVideo, videoList, setVideo) {
    const currentIndex = useMemo(
        () => findVideoIndex(currentVideo, videoList),
        [currentVideo, videoList]
    )

    const handleNext = useCallback(() => {
        const next = getNextIndex(currentIndex, videoList.length)
        if (next >= 0) setVideo(videoList[next])
    }, [currentIndex, videoList, setVideo])

    const handlePrev = useCallback(() => {
        const prev = getPrevIndex(currentIndex, videoList.length)
        if (prev >= 0) setVideo(videoList[prev])
    }, [currentIndex, videoList, setVideo])

    return { handleNext, handlePrev, currentIndex }
}
