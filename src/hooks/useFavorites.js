import { useState, useCallback } from 'react'
import { isValidYouTubeId } from '../utils/youtube'

const STORAGE_KEY = 'tdots-favorites'
const MAX_FAVORITES = 500

/** @internal Exported for testing */
export function readFavorites() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        // Only keep valid YouTube IDs, cap at MAX_FAVORITES
        return parsed.filter(isValidYouTubeId).slice(0, MAX_FAVORITES)
    } catch {
        return []
    }
}

function writeFavorites(ids) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch { /* quota exceeded — fail silently */ }
}

export default function useFavorites() {
    const [favorites, setFavorites] = useState(readFavorites)

    const toggleFavorite = useCallback((videoId) => {
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
