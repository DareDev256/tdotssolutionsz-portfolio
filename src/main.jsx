/**
 * Application entry point — BrowserRouter wraps three routes:
 *   /        → HubPage (landing page linking to Videos + Photos)
 *   /videos  → Desktop 3D experience or Mobile grid view (device-aware)
 *   /photos  → Photo gallery with lightbox
 *
 * The desktop 3D experience (App.jsx) and MobileApp are lazy-loaded to
 * keep initial bundle small. Three.js (~1.1MB) only loads on /videos.
 * @module main
 */
import React, { Component, Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useDeviceType } from './hooks/useDeviceType.js'
import './index.css'

/** Hub landing page — lightweight, no heavy deps */
const HubPage = lazy(() => import('./components/HubPage.jsx'))
/** Photo gallery — lightweight */
const PhotoGallery = lazy(() => import('./components/PhotoGallery.jsx'))
/** Desktop 3D cityscape — lazy-loaded to separate chunk (~1.1MB with Three.js) */
const App = lazy(() => import('./App.jsx'))
/** Mobile grid view — lightweight chunk without Three.js dependency */
const MobileApp = lazy(() => import('./MobileApp.jsx'))

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
                        <Route path="/videos" element={<VideosRoute />} />
                        <Route path="/photos" element={<PhotoGallery />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AppErrorBoundary>
    </React.StrictMode>,
)
