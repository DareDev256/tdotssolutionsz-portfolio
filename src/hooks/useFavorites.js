/**
 * Favorites persistence hook — stores favorite video IDs in localStorage
 * with validation (YouTube ID pattern check) and a 500-item cap.
 * @module hooks/useFavorites
 */
import { useState, useCallback } from 'react'
import { isValidYouTubeId } from '../utils/youtube'
import { logError, withRecovery, ErrorCategory } from '../utils/errorHandling'

/** localStorage key for persisted favorites array */
const STORAGE_KEY = 'tdots-favorites'
/** Hard cap to prevent storage abuse via crafted localStorage payloads */
const MAX_FAVORITES = 500

/**
 * Read and validate persisted favorites from localStorage.
 * Filters out invalid YouTube IDs and caps array length for safety.
 * @internal Exported for testing
 * @returns {string[]} Array of validated YouTube video IDs
 */
export function readFavorites() {
    return withRecovery(
        ErrorCategory.STORAGE, 'readFavorites',
        () => {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return []
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) return []
            return parsed.filter(isValidYouTubeId).slice(0, MAX_FAVORITES)
        },
        [], { key: STORAGE_KEY }
    )
}

/**
 * Persist favorites array to localStorage. Silently fails on quota exceeded.
 * @param {string[]} ids - Array of YouTube video IDs
 */
function writeFavorites(ids) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch (error) {
        logError(ErrorCategory.STORAGE, 'writeFavorites', error,
            { key: STORAGE_KEY, count: ids.length })
    }
}

/**
 * React hook for managing video favorites with localStorage persistence.
 * @returns {{ favorites: string[], toggleFavorite: (videoId: string) => void, isFavorite: (videoId: string) => boolean }}
 */
export default function useFavorites() {
    const [favorites, setFavorites] = useState(readFavorites)

    const toggleFavorite = useCallback((videoId) => {
        if (!isValidYouTubeId(videoId)) return
        setFavorites(prev => {
            const next = prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]
            writeFavorites(next)
            return next
        })
    }, [])

    const isFavorite = useCallback((videoId) => {
        return favorites.includes(videoId)
    }, [favorites])

    return { favorites, toggleFavorite, isFavorite }
}
