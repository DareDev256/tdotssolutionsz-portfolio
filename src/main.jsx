/**
 * Application entry point — responsive router that lazy-loads the desktop 3D
 * experience (App.jsx) or mobile grid view (MobileApp.jsx) based on viewport
 * width, with code-split vendor chunks so mobile users skip Three.js entirely.
 * @module main
 */
import React, { Component, Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { useDeviceType } from './hooks/useDeviceType.js'
import './index.css'

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
 * Root component that routes to App or MobileApp based on device type.
 * Applies CSS class to body for device-specific global styles.
 */
function ResponsiveApp() {
    const deviceType = useDeviceType()

    useEffect(() => {
        if (deviceType === 'phone') {
            document.body.classList.add('mobile-mode')
            document.body.classList.remove('desktop-mode')
        } else {
            document.body.classList.add('desktop-mode')
            document.body.classList.remove('mobile-mode')
        }
    }, [deviceType])

    return (
        <Suspense fallback={<LoadingScreen />}>
            {deviceType === 'phone'
                ? <MobileApp />
                : <App reducedEffects={deviceType === 'tablet'} />
            }
        </Suspense>
    )
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppErrorBoundary>
            <ResponsiveApp />
        </AppErrorBoundary>
    </React.StrictMode>,
)
