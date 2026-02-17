import { useState, useMemo, useEffect, useRef } from 'react'
import { ALL_ARTISTS, ARTIST_STATS } from '../../utils/videoData'
import { searchAll } from '../../hooks/useSearch'

/**
 * SearchBar — Dropdown search/filter for artists and videos.
 *
 * When no filter is active, shows a "SEARCH" trigger button. When a filter is
 * active, shows the artist name with a dismiss (✕) button. The dropdown
 * provides fuzzy search across both artists and video titles, with results
 * ranked by relevance score. If fuzzy search returns no artist matches, falls
 * back to simple substring matching so the user always sees some results.
 *
 * Dismisses on: Escape key, click outside, or selecting a result.
 *
 * @param {string|null} props.filterArtist - Currently active artist filter, or null
 * @param {function} props.onFilterChange - Called with artist name (or null to clear)
 * @param {function} [props.onVideoSelect] - Called with video object when a video result is clicked
 */
export const SearchBar = ({ filterArtist, onFilterChange, onVideoSelect }) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useRef(null)

    // Close dropdown on Escape key or click outside
    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false)
                setQuery('')
            }
        }
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
                setQuery('')
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open])

    const { artists: filteredArtists, videos: matchedVideos } = useMemo(() => {
        if (!query || query.length < 2) return { artists: ALL_ARTISTS, videos: [] }
        const { artists, videos } = searchAll(query)
        return { artists: artists.length > 0 ? artists : ALL_ARTISTS.filter(a => a.toLowerCase().includes(query.toLowerCase())), videos }
    }, [query])

    const handleSelect = (artist) => {
        onFilterChange(artist)
        setOpen(false)
        setQuery('')
    }

    const handleVideoSelect = (video) => {
        onVideoSelect?.(video)
        setOpen(false)
        setQuery('')
    }

    const handleClear = () => {
        onFilterChange(null)
        setQuery('')
        setOpen(false)
    }

    return (
        <div className="search-bar-container" ref={containerRef}>
            {filterArtist ? (
                <button className="search-active-filter" onClick={handleClear}>
                    {filterArtist} ✕
                </button>
            ) : (
                <button className="search-trigger" onClick={() => setOpen(!open)}>
                    🔍 SEARCH
                </button>
            )}
            {open && (
                <div className="search-dropdown">
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search artists & videos..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        maxLength={100}
                        autoComplete="off"
                        spellCheck="false"
                        autoFocus
                    />
                    <div className="search-results">
                        {matchedVideos.length > 0 && (
                            <>
                                <div className="search-section-label">VIDEOS</div>
                                {matchedVideos.map(video => (
                                    <button
                                        key={`v-${video.id}`}
                                        className="search-result-item search-result-video"
                                        onClick={() => handleVideoSelect(video)}
                                    >
                                        <span className="search-video-title">{video.title}</span>
                                        <span className="search-result-count">{video.artist}</span>
                                    </button>
                                ))}
                                <div className="search-section-label">ARTISTS</div>
                            </>
                        )}
                        {filteredArtists.map(artist => (
                            <button
                                key={artist}
                                className="search-result-item"
                                onClick={() => handleSelect(artist)}
                            >
                                {artist}
                                <span className="search-result-count">
                                    {ARTIST_STATS[artist]?.count || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
