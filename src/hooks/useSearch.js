import { useState, useMemo, useCallback } from 'react'
import { fuzzyScore, searchAll, sanitizeSearchInput } from '../utils/searchScoring'

/**
 * Hook for unified fuzzy search across artists and video titles.
 * Returns query state + memoized results split into { artists, videos }.
 *
 * Pure scoring logic lives in utils/searchScoring.js — this hook manages
 * only React state (query string) and memoization.
 */
export default function useSearch() {
    const [query, setQuery] = useState('')

    const results = useMemo(() => searchAll(query), [query])

    const clear = useCallback(() => setQuery(''), [])

    const hasResults = results.artists.length > 0 || results.videos.length > 0

    return { query, setQuery, results, clear, hasResults }
}

// Re-export utilities for backward compatibility with existing consumers
// that import { fuzzyScore, searchAll } from './useSearch'
export { fuzzyScore, searchAll, sanitizeSearchInput }
