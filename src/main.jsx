/**
 * Application entry point — responsive router that lazy-loads the desktop 3D
 * experience (App.jsx) or mobile grid view (MobileApp.jsx) based on viewport
 * width, with code-split vendor chunks so mobile users skip Three.js entirely.
 * @module main
 */
import React, { Suspense, lazy, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { useDeviceType } from './hooks/useDeviceType.js'
import './index.css'

/** Desktop 3D cityscape — lazy-loaded to separate chunk (~1.1MB with Three.js) */
const App = lazy(() => import('./App.jsx'))
/** Mobile grid view — lightweight chunk without Three.js dependency */
const MobileApp = lazy(() => import('./MobileApp.jsx'))

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
        <ResponsiveApp />
    </React.StrictMode>,
)
