import { useState, useMemo } from 'react'
import videoData from './data/videos.json'
import VideoCard from './components/VideoCard'
import './MobileApp.css'

const VIDEOS = videoData.videos.map(video => ({
    ...video,
    url: `https://www.youtube.com/watch?v=${video.youtubeId}`
}))

// Featured videos are curated via the "featured" field

export default function MobileApp() {
    const [activeTab, setActiveTab] = useState('latest')
    const [playingVideo, setPlayingVideo] = useState(null)

    const filteredVideos = useMemo(() => {
        if (activeTab === 'latest') {
            return [...VIDEOS].sort((a, b) =>
                new Date(b.uploadDate) - new Date(a.uploadDate)
            )
        } else {
            return [...VIDEOS]
                .filter(v => v.featured)
                .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        }
    }, [activeTab])

    const handleVideoClick = (video) => {
        setPlayingVideo(video)
    }

    const handleClosePlayer = () => {
        setPlayingVideo(null)
    }

    return (
        <div className="mobile-app">
            {/* Header */}
            <header className="mobile-header">
                <h1 className="mobile-title">
                    <span className="title-infinite">INFINITE</span>
                    <span className="title-drive">DRIVE</span>
                </h1>
                <p className="mobile-subtitle">TdotsSolutionsz Portfolio</p>
            </header>

            {/* Filter Tabs */}
            <nav className="filter-tabs">
                <button
                    className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('latest')}
                >
                    Latest
                </button>
                <button
                    className={`tab ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                >
                    Featured
                </button>
            </nav>

            {/* Video Grid */}
            <main className="video-grid">
                {filteredVideos.map(video => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoClick(video)}
                    />
                ))}
            </main>

            {/* Video Player Modal */}
            {playingVideo && (
                <div className="video-modal" onClick={handleClosePlayer}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-button" onClick={handleClosePlayer}>
                            ✕
                        </button>
                        <div className="video-container">
                            <iframe
                                src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1`}
                                title={playingVideo.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <div className="video-info">
                            <h2>{playingVideo.title}</h2>
                            <p>{playingVideo.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mobile-footer">
                <p>© {new Date().getFullYear()} TdotsSolutionsz</p>
            </footer>
        </div>
    )
}

