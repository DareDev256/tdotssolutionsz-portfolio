import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tdots-favorites'

function readFavorites() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
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
