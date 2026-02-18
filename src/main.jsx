/**
 * Application entry point — BrowserRouter wraps two active routes:
 *   /        → HubPage (landing page)
 *   /videos  → Desktop 3D experience or Mobile grid view (device-aware)
 *
 * /photos is intentionally DISABLED (Coming Soon). Do NOT re-enable without owner approval.
 *
 * All routes are lazy-loaded to keep initial bundle small.
 * Three.js (~1.1MB) only loads on /videos.
 * @module main
 */
import React, { Component, Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useDeviceType } from './hooks/useDeviceType.js'
import './index.css'

/** Hub landing page — lightweight, no heavy deps */
const HubPage = lazy(() => import('./components/HubPage.jsx'))
/** Standalone video detail page — lightweight, shareable, no Three.js */
const VideoPage = lazy(() => import('./components/VideoPage.jsx'))
/** Desktop 3D cityscape — lazy-loaded to separate chunk (~1.1MB with Three.js) */
const App = lazy(() => import('./App.jsx'))
/** Mobile grid view — lightweight chunk without Three.js dependency */
const MobileApp = lazy(() => import('./MobileApp.jsx'))
/** Photography gallery — DO NOT enable until owner explicitly requests it */
// const PhotoGallery = lazy(() => import('./components/PhotoGallery.jsx'))

/** Catches Three.js/WebGL crashes so the page doesn't blank out */
class AppErrorBoundary extends Component {
    state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="loading-screen">
                    <div className="loading-text">Something went wrong</div>
                    <p style={{ color: '#ff6ec7', textAlign: 'center', padding: '0 1rem' }}>
                        3D rendering failed. Try refreshing or use a different browser.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem', padding: '0.75rem 2rem',
                            background: '#ff6ec7', color: '#0a0a1a', border: 'none',
                            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        Reload
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}

/** Branded 404 page — synthwave glitch aesthetic */
function NotFoundPage() {
    return (
        <div className="loading-screen" style={{ gap: '16px' }}>
            <div style={{
                fontFamily: "'Orbitron', monospace", fontSize: '5rem', fontWeight: 900,
                color: '#ff2a6d',
                textShadow: '0 0 20px rgba(255, 42, 109, 0.6), 0 0 60px rgba(255, 42, 109, 0.3)',
                animation: 'loading-blink 1.5s ease-in-out infinite'
            }}>404</div>
            <p style={{
                fontFamily: "'Rajdhani', sans-serif", color: 'rgba(255,255,255,0.5)',
                fontSize: '1.1rem', textAlign: 'center'
            }}>This page doesn't exist.</p>
            <a href="/" style={{
                fontFamily: "'Orbitron', monospace", fontSize: '0.75rem', fontWeight: 700,
                letterSpacing: '0.15em', color: '#05d9e8', textDecoration: 'none',
                padding: '12px 28px', border: '1px solid rgba(5, 217, 232, 0.4)',
                borderRadius: '24px', transition: 'all 0.3s ease'
            }}>← BACK TO HUB</a>
        </div>
    )
}

/** Synthwave-styled loading screen shown during chunk download */
function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="loading-text">♬ LOADING PORTFOLIO ♬</div>
            <div className="loading-bar">
                <div className="loading-progress"></div>
            </div>
        </div>
    )
}

/**
 * Videos route — renders App (desktop) or MobileApp (mobile) based on device.
 * Preserves ?v= deep-link support by passing through search params.
 */
function VideosRoute() {
    const deviceType = useDeviceType()

    useEffect(() => {
        if (deviceType === 'phone') {
            document.body.classList.add('mobile-mode')
            document.body.classList.remove('desktop-mode')
        } else {
            document.body.classList.add('desktop-mode')
            document.body.classList.remove('mobile-mode')
        }
        return () => {
            document.body.classList.remove('mobile-mode', 'desktop-mode')
        }
    }, [deviceType])

    return deviceType === 'phone'
        ? <MobileApp />
        : <App reducedEffects={deviceType === 'tablet'} />
}

/** Reset body classes on route change; redirect legacy ?v= deep links */
function RouteCleanup() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        // Legacy redirect: /?v=xxx → /videos?v=xxx
        if (location.pathname === '/' && location.search.includes('v=')) {
            navigate(`/videos${location.search}`, { replace: true })
            return
        }
        if (location.pathname !== '/videos') {
            document.body.classList.remove('mobile-mode', 'desktop-mode')
            document.body.style.overflow = ''
        }
        window.scrollTo(0, 0)
    }, [location.pathname, location.search, navigate])

    return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppErrorBoundary>
            <BrowserRouter>
                <RouteCleanup />
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                        <Route path="/" element={<HubPage />} />
                        <Route path="/video/:youtubeId" element={<VideoPage />} />
                        <Route path="/videos" element={<VideosRoute />} />
                        {/* DO NOT enable /photos route — Photography is Coming Soon */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AppErrorBoundary>
    </React.StrictMode>,
)
